import { DataSource, Repository } from 'typeorm';
import { Plot } from '@entities/plot.entity';
import { Field } from '@entities/field.entity';
import { Variety } from '@entities/variety.entity';
import { CreatePlotDto, UpdatePlotDto } from '@dtos/plot.dto';
import { PlotFilters } from '@/interfaces/filters.interface';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@/enums';

interface GetAllPlotsOptions {
  includeFullDetails?: boolean;
  filters?: PlotFilters;
  userId?: string;
  userRole?: UserRole;
}

export class PlotService {
  private plotRepository: Repository<Plot>;
  private fieldRepository: Repository<Field>;
  private varietyRepository: Repository<Variety>;

  constructor(dataSource: DataSource) {
    this.plotRepository = dataSource.getRepository(Plot);
    this.fieldRepository = dataSource.getRepository(Field);
    this.varietyRepository = dataSource.getRepository(Variety);
  }

  /**
   * Crear una nueva parcela
   */
  async createPlot(createPlotDto: CreatePlotDto): Promise<Plot> {
    const { fieldId, varietyId, ...plotFields } = createPlotDto;
    if (!fieldId) throw new HttpException(StatusCodes.BAD_REQUEST, 'El ID del campo es obligatorio.');
    const field = await this.fieldRepository.findOneBy({ id: fieldId });
    if (!field) throw new HttpException(StatusCodes.NOT_FOUND, `El campo con ID ${fieldId} no fue encontrado.`);
    if (varietyId) {
      const variety = await this.varietyRepository.findOneBy({ id: varietyId });
      if (!variety) throw new HttpException(StatusCodes.NOT_FOUND, `La variedad con ID ${varietyId} no fue encontrada.`);
    }
    const plotData: Partial<Plot> = { ...plotFields, field: { id: fieldId } as any };
    if (varietyId) plotData.variety = { id: varietyId } as any;
    const plot = this.plotRepository.create(plotData);
    const savedPlot = await this.plotRepository.save(plot);
    return await this.getPlotById(savedPlot.id);
  }

  /**
   * Obtener todas las parcelas con proyección adaptativa según contexto
   */
  async getAllPlots(options: GetAllPlotsOptions = {}): Promise<{ data: (Plot | Partial<Plot>)[]; count: number }> {
    const { includeFullDetails = false, filters = {}, userId, userRole } = options;

    const queryBuilder = this.plotRepository.createQueryBuilder('plot');

    
    if (filters.withDeleted) {
      queryBuilder.withDeleted();
    }

    // Determinar si debe incluir detalles completos
    const hasFilters = 
      filters.fieldId !== undefined ||
      filters.varietyId !== undefined ||
      filters.managedFieldIds !== undefined ||
      filters.minArea !== undefined ||
      filters.maxArea !== undefined;

    const shouldIncludeDetails = 
      includeFullDetails || 
      userRole === UserRole.ADMIN ||
      hasFilters;

    if (shouldIncludeDetails) {
      // Datos completos: incluir relaciones y todos los campos
      queryBuilder
        .leftJoinAndSelect('plot.field', 'field')
        .leftJoinAndSelect('plot.variety', 'variety');
    } else {
      // Solo datos de mapa: proyección limitada
      queryBuilder.select([
        'plot.id',
        'plot.name',
        'plot.location',
      ]);
    }

    // Aplicar filtros
    if (filters.fieldId) {
      queryBuilder.andWhere('plot.fieldId = :fieldId', { fieldId: filters.fieldId });
    }

    if (filters.varietyId) {
      queryBuilder.andWhere('plot.varietyId = :varietyId', { varietyId: filters.varietyId });
    }

    if (filters.minArea) {
      queryBuilder.andWhere('plot.area >= :minArea', { minArea: filters.minArea });
    }

    if (filters.maxArea) {
      queryBuilder.andWhere('plot.area <= :maxArea', { maxArea: filters.maxArea });
    }

    // Filtro especial para CAPATAZ: Solo parcelas de campos gestionados
    if (filters.managedFieldIds && filters.managedFieldIds.length > 0) {
      queryBuilder.andWhere('plot.fieldId IN (:...managedFieldIds)', {
        managedFieldIds: filters.managedFieldIds
      });
    }

    queryBuilder.orderBy('plot.createdAt', 'DESC');

    const [data, count] = await queryBuilder.getManyAndCount();

    return { data, count };
  }

  /**
   * Buscar una parcela por su ID
   */
  async getPlotById(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findOne({ where: { id }, relations: ['field', 'variety'] });
    if (!plot) throw new HttpException(StatusCodes.NOT_FOUND, 'La parcela no fue encontrada.');
    return plot;
  }

  /**
   * Actualizar una parcela por su ID
   */
  async updatePlot(id: string, updatePlotDto: UpdatePlotDto): Promise<Plot> {
    const plot = await this.getPlotById(id);
    const { varietyId, ...plotFields } = updatePlotDto;
    const updateData: any = { ...plotFields };
    if (varietyId !== undefined) {
      if (varietyId === null) { updateData.varietyId = null; } 
      else {
        const variety = await this.varietyRepository.findOneBy({ id: varietyId });
        if (!variety) throw new HttpException(StatusCodes.NOT_FOUND, `La variedad con ID ${varietyId} no fue encontrada.`);
        updateData.varietyId = varietyId;
      }
    }
    const updateResult = await this.plotRepository.createQueryBuilder().update(Plot).set(updateData).where('id = :id', { id }).execute();
    if (updateResult.affected === 0) throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'No se pudo actualizar la parcela.');
    const updatedPlot = await this.plotRepository.findOne({ where: { id }, relations: ['field', 'variety'] });
    if (!updatedPlot) throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'No se pudo recuperar la parcela actualizada.');
    return updatedPlot;
  }

  /**
   * Eliminar una parcela (soft delete)
   */
  async deletePlot(id: string): Promise<Plot> {
    const plot = await this.getPlotById(id);
    return await this.plotRepository.softRemove(plot);
  }

  /**
   * Restaurar una parcela por su ID
   */
  async restorePlot(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findOne({ where: { id }, withDeleted: true });
    if (!plot) throw new HttpException(StatusCodes.NOT_FOUND, 'La parcela no fue encontrada.');
    return await this.plotRepository.recover(plot);
  }

  /**
   * Eliminar una parcela (hard delete)
   */
  async hardDeletePlot(id: string): Promise<Plot> {
    const plot = await this.plotRepository.findOne({ where: { id }, withDeleted: true });
    if (!plot) throw new HttpException(StatusCodes.NOT_FOUND, 'La parcela no fue encontrada.');
    return await this.plotRepository.remove(plot);
  }
}
