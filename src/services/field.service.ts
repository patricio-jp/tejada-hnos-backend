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
   * - ADMIN: Todos los campos con datos completos (puede filtrar)
   * - OPERARIO: Todos los campos solo con datos de mapa (id, name, location)
   * - CAPATAZ: 
   *   - Campos gestionados: datos completos (area, address, manager, plots)
   *   - Campos NO gestionados: datos de mapa (id, name, location)
   * 
   * Ejemplos de uso:
   * - findAll({ userRole: UserRole.ADMIN }) → Todos los campos (datos completos)
   * - findAll({ userRole: UserRole.OPERARIO }) → Todos los campos (solo mapa)
   * - findAll({ userRole: UserRole.CAPATAZ, filters: { managedFieldIds: [...] } }) → Diferenciado por campo
   */
  public async findAll(options: GetAllFieldsOptions = {}): Promise<{ data: (Field | Partial<Field>)[]; count: number }> {
    const { includeFullDetails = false, filters = {}, userId, userRole } = options;

    const queryBuilder = this.fieldRepository
      .createQueryBuilder('field');

    // OPERARIO: Solo datos de mapa (proyección limitada)
    if (userRole === UserRole.OPERARIO) {
      queryBuilder.select([
        'field.id',
        'field.name',
        'field.location',
      ]);
      
      queryBuilder.orderBy('field.createdAt', 'DESC');
      const [data, count] = await queryBuilder.getManyAndCount();
      return { data, count };
    }

    // ADMIN y CAPATAZ: Siempre cargar relaciones completas
    queryBuilder
      .leftJoinAndSelect('field.manager', 'manager')
      .leftJoinAndSelect('field.plots', 'plots');

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

    queryBuilder.orderBy('field.createdAt', 'DESC');

    const [allFields, count] = await queryBuilder.getManyAndCount();

    // ADMIN: Retornar todos los campos con detalles completos
    if (userRole === UserRole.ADMIN) {
      return { data: allFields, count };
    }

    // CAPATAZ: Proyección diferenciada por campo
    if (userRole === UserRole.CAPATAZ) {
      const managedFieldIds = filters.managedFieldIds || [];
      
      const data = allFields.map(field => {
        // Si el campo es gestionado por este CAPATAZ, retornar info completa
        if (managedFieldIds.includes(field.id)) {
          return field;
        }
        
        // Si NO es gestionado, retornar solo info básica para el mapa
        return {
          id: field.id,
          name: field.name,
          location: field.location,
        };
      });

      return { data, count };
    }

    // Fallback: retornar datos completos
    return { data: allFields, count };
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
