import { DataSource, Repository } from 'typeorm';
import { HarvestLot } from '@entities/harvest-lot.entity';
import { Plot } from '@entities/plot.entity';
import { CreateHarvestLotDto, UpdateHarvestLotDto, ProcessHarvestLotDto } from '@dtos/harvest-lot.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';
import { HarvestLotStatus } from '@/enums';

export interface HarvestLotFilters {
  plotId?: string;
  status?: HarvestLotStatus;
  varietyName?: string;
  minGrossWeight?: number;
  maxGrossWeight?: number;
  startDate?: Date;
  endDate?: Date;
}

export class HarvestLotService {
  private harvestLotRepository: Repository<HarvestLot>;
  private plotRepository: Repository<Plot>;

  constructor(dataSource: DataSource) {
    this.harvestLotRepository = dataSource.getRepository(HarvestLot);
    this.plotRepository = dataSource.getRepository(Plot);
  }

  /**
   * Crear un nuevo lote de cosecha en estado PENDIENTE_PROCESO
   * Requiere plotId, fecha, lotCode, varietyName y peso bruto
   * caliber puede ser null para asignar después durante el procesamiento
   * @param createHarvestLotDto Datos del lote a crear
   * @returns Promise<HarvestLot>
   */
  async create(createHarvestLotDto: CreateHarvestLotDto): Promise<HarvestLot> {
    const { plotId, ...lotFields } = createHarvestLotDto;

    if (!plotId) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        'El ID de la parcela es obligatorio.'
      );
    }

    // Verificar que la parcela existe
    const plot = await this.plotRepository.findOneBy({ id: plotId });
    if (!plot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        `La parcela con ID ${plotId} no fue encontrada.`
      );
    }

    // Verificar que el código de lote no exista
    const existingLot = await this.harvestLotRepository.findOne({
      where: { lotCode: lotFields.lotCode }
    });

    if (existingLot) {
      throw new HttpException(
        StatusCodes.CONFLICT,
        `Ya existe un lote con el código ${lotFields.lotCode}.`
      );
    }

    // Crear el lote en estado PENDIENTE_PROCESO
    // caliber puede ser null para clasificar después
    // netWeightKg, remainingNetWeightKg y yieldPercentage quedan null hasta el proceso
    const harvestLot = this.harvestLotRepository.create({
      ...lotFields,
      plotId,
      status: HarvestLotStatus.PENDIENTE_PROCESO,
    });

    await this.harvestLotRepository.save(harvestLot);

    // Retornar con relaciones
    return this.harvestLotRepository.findOne({
      where: { id: harvestLot.id },
      relations: ['plot', 'plot.field', 'plot.variety']
    }) as Promise<HarvestLot>;
  }

  /**
   * Obtener todos los lotes de cosecha con filtros opcionales
   * @param filters Filtros opcionales para la búsqueda
   * @returns Promise<HarvestLot[]>
   */
  async findAll(filters?: HarvestLotFilters): Promise<HarvestLot[]> {
    const queryBuilder = this.harvestLotRepository
      .createQueryBuilder('harvestLot')
      .leftJoinAndSelect('harvestLot.plot', 'plot')
      .leftJoinAndSelect('plot.field', 'field')
      .leftJoinAndSelect('plot.variety', 'variety');

    if (filters) {
      if (filters.plotId) {
        queryBuilder.andWhere('harvestLot.plotId = :plotId', {
          plotId: filters.plotId
        });
      }

      if (filters.status) {
        queryBuilder.andWhere('harvestLot.status = :status', {
          status: filters.status
        });
      }

      if (filters.varietyName) {
        queryBuilder.andWhere('harvestLot.varietyName ILIKE :varietyName', {
          varietyName: `%${filters.varietyName}%`
        });
      }

      if (filters.minGrossWeight) {
        queryBuilder.andWhere('harvestLot.grossWeightKg >= :minGrossWeight', {
          minGrossWeight: filters.minGrossWeight
        });
      }

      if (filters.maxGrossWeight) {
        queryBuilder.andWhere('harvestLot.grossWeightKg <= :maxGrossWeight', {
          maxGrossWeight: filters.maxGrossWeight
        });
      }

      if (filters.startDate) {
        queryBuilder.andWhere('harvestLot.harvestDate >= :startDate', {
          startDate: filters.startDate
        });
      }

      if (filters.endDate) {
        queryBuilder.andWhere('harvestLot.harvestDate <= :endDate', {
          endDate: filters.endDate
        });
      }
    }

    queryBuilder.orderBy('harvestLot.harvestDate', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Buscar un lote de cosecha por su ID
   * @param id ID del lote
   * @returns Promise<HarvestLot>
   */
  async findById(id: string): Promise<HarvestLot> {
    const harvestLot = await this.harvestLotRepository.findOne({
      where: { id },
      relations: ['plot', 'plot.field', 'plot.variety', 'shipmentDetails']
    });

    if (!harvestLot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'El lote de cosecha no fue encontrado.'
      );
    }

    return harvestLot;
  }

  /**
   * Actualizar un lote de cosecha en estado PENDIENTE_PROCESO
   * Una vez que el lote está EN_STOCK, se vuelve inmutable
   * @param id ID del lote
   * @param updateHarvestLotDto Datos a actualizar
   * @returns Promise<HarvestLot>
   */
  async update(id: string, updateHarvestLotDto: UpdateHarvestLotDto): Promise<HarvestLot> {
    const harvestLot = await this.findById(id);

    // Validar que el lote esté en PENDIENTE_PROCESO
    if (harvestLot.status !== HarvestLotStatus.PENDIENTE_PROCESO) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        `No se puede actualizar un lote en estado ${harvestLot.status}. ` +
        `Solo los lotes en PENDIENTE_PROCESO pueden ser modificados. ` +
        `Use el endpoint de procesamiento para clasificar el lote.`
      );
    }

    // Si se actualiza el código de lote, verificar que no exista otro con ese código
    if (updateHarvestLotDto.lotCode && updateHarvestLotDto.lotCode !== harvestLot.lotCode) {
      const existingLot = await this.harvestLotRepository.findOne({
        where: { lotCode: updateHarvestLotDto.lotCode }
      });

      if (existingLot) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          `Ya existe un lote con el código ${updateHarvestLotDto.lotCode}.`
        );
      }
    }

    // Actualizar solo los campos permitidos
    this.harvestLotRepository.merge(harvestLot, updateHarvestLotDto);

    return await this.harvestLotRepository.save(harvestLot);
  }

  /**
   * Procesar/clasificar un lote de cosecha (PENDIENTE_PROCESO → EN_STOCK)
   * Establece varietyName, caliber, netWeightKg y hace el lote inmutable
   * @param id ID del lote
   * @param processDto Datos del procesamiento
   * @returns Promise<HarvestLot>
   */
  async process(id: string, processDto: ProcessHarvestLotDto): Promise<HarvestLot> {
    const harvestLot = await this.findById(id);

    // Validar que el lote esté en PENDIENTE_PROCESO
    if (harvestLot.status !== HarvestLotStatus.PENDIENTE_PROCESO) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        `No se puede procesar un lote en estado ${harvestLot.status}. ` +
        `Solo los lotes en PENDIENTE_PROCESO pueden ser procesados.`
      );
    }

    // Validar que netWeightKg no exceda grossWeightKg
    if (processDto.netWeightKg > harvestLot.grossWeightKg) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        `El peso neto (${processDto.netWeightKg} kg) no puede ser mayor al peso bruto (${harvestLot.grossWeightKg} kg).`
      );
    }

    // Si se proporciona un nuevo lotCode, verificar que no exista
    if (processDto.lotCode && processDto.lotCode !== harvestLot.lotCode) {
      const existingLot = await this.harvestLotRepository.findOne({
        where: { lotCode: processDto.lotCode }
      });

      if (existingLot) {
        throw new HttpException(
          StatusCodes.CONFLICT,
          `Ya existe un lote con el código ${processDto.lotCode}.`
        );
      }
    }

    // Establecer todos los campos del procesamiento
    if (processDto.lotCode) {
      harvestLot.lotCode = processDto.lotCode;
    }
    
    harvestLot.varietyName = processDto.varietyName;
    harvestLot.caliber = processDto.caliber;
    harvestLot.netWeightKg = processDto.netWeightKg;
    harvestLot.remainingNetWeightKg = processDto.netWeightKg; // Inicializar stock disponible

    // Calcular rendimiento
    harvestLot.yieldPercentage = parseFloat(
      ((processDto.netWeightKg / harvestLot.grossWeightKg) * 100).toFixed(2)
    );

    // Cambiar estado a EN_STOCK (ahora es inmutable)
    harvestLot.status = HarvestLotStatus.EN_STOCK;

    return await this.harvestLotRepository.save(harvestLot);
  }

  /**
   * Eliminar un lote de cosecha por su ID (soft delete)
   * @param id ID del lote
   * @returns Promise<HarvestLot> El lote eliminado
   */
  async delete(id: string): Promise<HarvestLot> {
    const harvestLot = await this.findById(id);

    // Verificar que no esté asociado a envíos
    if (harvestLot.shipmentDetails && harvestLot.shipmentDetails.length > 0) {
      throw new HttpException(
        StatusCodes.CONFLICT,
        'No se puede eliminar el lote porque tiene envíos asociados.'
      );
    }

    return await this.harvestLotRepository.softRemove(harvestLot);
  }

  /**
   * Restaurar un lote de cosecha por su ID
   * @param id ID del lote a restaurar
   * @returns Promise<HarvestLot> El lote restaurado
   */
  async restore(id: string): Promise<HarvestLot> {
    const harvestLot = await this.harvestLotRepository.findOne({
      where: { id },
      withDeleted: true
    });

    if (!harvestLot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'El lote de cosecha no fue encontrado.'
      );
    }

    return await this.harvestLotRepository.recover(harvestLot);
  }

  /**
   * Eliminar un lote de cosecha por su ID (hard delete)
   * @param id ID del lote a eliminar de la base de datos
   * @returns Promise<HarvestLot> El lote eliminado permanentemente
   */
  async hardDelete(id: string): Promise<HarvestLot> {
    const harvestLot = await this.harvestLotRepository.findOne({
      where: { id },
      withDeleted: true
    });

    if (!harvestLot) {
      throw new HttpException(
        StatusCodes.NOT_FOUND,
        'El lote de cosecha no fue encontrado.'
      );
    }

    return await this.harvestLotRepository.remove(harvestLot);
  }
}
