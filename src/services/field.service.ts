import { StatusCodes } from "http-status-codes";
import { Field } from "@entities/field.entity";
import { User } from "@entities/user.entity";
import { CreateFieldDto, UpdateFieldDto } from "@dtos/field.dto";
import { FieldFilters } from "@/interfaces/filters.interface";
import { HttpException } from "../exceptions/HttpException";
import { DataSource, Repository } from "typeorm";
import { UserRole } from "@/enums";

interface GetAllFieldsOptions {
  includeFullDetails?: boolean;
  filters?: FieldFilters;
  userId?: string;
  userRole?: UserRole;
}

export class FieldService {
  private fieldRepository: Repository<Field>;
  private userRepository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.fieldRepository = dataSource.getRepository(Field);
    this.userRepository = dataSource.getRepository(User);
  }

  /**
   * Crear un nuevo campo
   * @param fieldData CreateFieldDto
   * @returns Promise<Field>
   * @throws HttpException si el nombre ya existe
   */
  public async create(fieldData: CreateFieldDto): Promise<Field> {
    const { managerId, ...fieldFields } = fieldData;

    // Validar nombre duplicado (solo en campos activos)
    const existingField = await this.fieldRepository.findOne({
      where: { name: fieldFields.name }
    });

    if (existingField) {
      throw new HttpException(
        StatusCodes.BAD_REQUEST,
        `Ya existe un campo con el nombre "${fieldFields.name}". Por favor, elige otro nombre.`
      );
    }

    const newField = this.fieldRepository.create(fieldFields);

    if (managerId) {
      const manager = await this.userRepository.findOne({ where: { id: managerId } });
      if (!manager) {
        throw new HttpException(StatusCodes.NOT_FOUND, "El usuario encargado no fue encontrado.");
      }

      if (manager.role !== UserRole.CAPATAZ) {
        throw new HttpException(
          StatusCodes.BAD_REQUEST,
          "El usuario asignado como encargado no tiene el rol de CAPATAZ."
        );
      }

      newField.managerId = managerId;
      newField.manager = manager;
    }

    return await this.fieldRepository.save(newField);
  }

  /**
   * Obtener todos los campos con proyección adaptativa según contexto
   * @param options Opciones de búsqueda y proyección
   * @returns Promise<{ data: Field[] | Partial<Field>[]; count: number }>
   * 
   * Comportamiento:
   * - Sin filtros + sin includeFullDetails → Solo datos de mapa (id, name, location)
   * - Con filtros o ADMIN o includeFullDetails → Datos completos (area, address, manager, plots)
   * 
   * Ejemplos de uso:
   * - findAll() → Todos los campos (solo mapa)
   * - findAll({ includeFullDetails: true }) → Todos los campos (datos completos)
   * - findAll({ filters: { managerId: '123' } }) → Campos de encargado (datos completos)
   * - findAll({ filters: { managedFieldIds: [...] }, userRole: UserRole.CAPATAZ }) → Campos del CAPATAZ (datos completos)
   */
  public async findAll(options: GetAllFieldsOptions = {}): Promise<{ data: (Field | Partial<Field>)[]; count: number }> {
    const { includeFullDetails = false, filters = {}, userId, userRole } = options;

    const queryBuilder = this.fieldRepository
      .createQueryBuilder('field');

    // Determinar si debe incluir detalles completos
    const hasFilters = 
      filters.managerId !== undefined ||
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
        .leftJoinAndSelect('field.manager', 'manager')
        .leftJoinAndSelect('field.plots', 'plots');
    } else {
      // Solo datos de mapa: proyección limitada
      queryBuilder.select([
        'field.id',
        'field.name',
        'field.location',
      ]);
    }

    // Aplicar filtros
    if (filters.managerId) {
      queryBuilder.andWhere('field.managerId = :managerId', {
        managerId: filters.managerId
      });
    }

    if (filters.minArea) {
      queryBuilder.andWhere('field.area >= :minArea', {
        minArea: filters.minArea
      });
    }

    if (filters.maxArea) {
      queryBuilder.andWhere('field.area <= :maxArea', {
        maxArea: filters.maxArea
      });
    }

    // Filtro especial para CAPATAZ: Solo campos gestionados por él
    if (filters.managedFieldIds && filters.managedFieldIds.length > 0) {
      queryBuilder.andWhere('field.id IN (:...managedFieldIds)', {
        managedFieldIds: filters.managedFieldIds
      });
    }

    queryBuilder.orderBy('field.createdAt', 'DESC');

    const [data, count] = await queryBuilder.getManyAndCount();

    return { data, count };
  }
  
  /**
   * Buscar un campo por su ID
   * @param fieldId El ID del campo a buscar
   * @returns Promise<Field>
   */
  public async findById(fieldId: string): Promise<Field> {
    const field = await this.fieldRepository.findOne({ 
      where: { id: fieldId }, 
      relations: ['manager', 'plots', 'plots.variety'] 
    });
    
    if (!field) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }
    
    return field;
  }

  /**
   * Actualizar un campo por su ID
   * @param fieldId El ID del campo a actualizar
   * @param fieldData Los datos a actualizar
   * @returns Promise<Field>
   */
  public async update(fieldId: string, fieldData: UpdateFieldDto): Promise<Field> {
    const field = await this.findById(fieldId);
    const { managerId, ...fieldFields } = fieldData;

    this.fieldRepository.merge(field, fieldFields);

    if (managerId !== undefined) {
      if (managerId === null) {
        field.managerId = null;
        field.manager = null as any;
      } else {
        const manager = await this.userRepository.findOne({ where: { id: managerId } });
        if (!manager) {
          throw new HttpException(StatusCodes.NOT_FOUND, "El usuario encargado no fue encontrado.");
        }

        if (manager.role !== UserRole.CAPATAZ) {
          throw new HttpException(
            StatusCodes.BAD_REQUEST,
            "El usuario asignado como encargado no tiene el rol de CAPATAZ."
          );
        }

        field.managerId = managerId;
        field.manager = manager;
      }
    }

    return await this.fieldRepository.save(field);
  }

  /**
   * Eliminar un campo por su ID (soft delete)
   * @param fieldId El ID del campo a eliminar
   * @returns Promise<Field> El campo eliminado
   */
  public async delete(fieldId: string): Promise<Field> {
    const field = await this.findById(fieldId);
    return await this.fieldRepository.softRemove(field);
  }

  /**
   * Restaurar un campo por su ID
   * @param fieldId El ID del campo a restaurar
   * @returns Promise<Field> El campo restaurado
   */
  public async restore(fieldId: string): Promise<Field> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
      withDeleted: true,
    });

    if (!field) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }

    return await this.fieldRepository.recover(field);
  }

  /**
   * Eliminar un campo por su ID (hard delete)
   * @param fieldId El ID del campo a eliminar de la base de datos
   * @returns Promise<Field> El campo eliminado permanentemente
   */
  public async hardDelete(fieldId: string): Promise<Field> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId },
      withDeleted: true,
    });

    if (!field) {
      throw new HttpException(StatusCodes.NOT_FOUND, "El campo no fue encontrado.");
    }

    return await this.fieldRepository.remove(field);
  }
}
