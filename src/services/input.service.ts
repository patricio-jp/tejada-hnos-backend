import { DataSource, Repository } from 'typeorm';
import { Input } from '@entities/input.entity';
import { CreateInputDto, UpdateInputDto } from '@dtos/input.dto';
import { HttpException } from '@/exceptions/HttpException';
import { StatusCodes } from 'http-status-codes';

export class InputService {
  private readonly inputRepository: Repository<Input>;

  constructor(private readonly dataSource: DataSource) {
    this.inputRepository = this.dataSource.getRepository(Input);
  }

  public async create(data: CreateInputDto): Promise<Input> {
    const input = this.inputRepository.create({
      name: data.name,
      unit: data.unit,
    });

    return this.inputRepository.save(input);
  }

  public async findAll(): Promise<Input[]> {
    return this.inputRepository.find();
  }

  /**
   * Obtener un Input por su ID
   */
  public async findById(id: string): Promise<Input> {
    const input = await this.inputRepository.findOne({ where: { id } });

    if (!input) {
      throw new HttpException(StatusCodes.NOT_FOUND, 'El insumo no fue encontrado.');
    }

    return input;
  }

  /**
   * Actualizar un Input por su ID
   */
  public async update(id: string, data: UpdateInputDto): Promise<Input> {
    // Verificar existencia
    await this.findById(id);

    const updateData: Partial<Input> = { ...data };

    const updateResult = await this.inputRepository
      .createQueryBuilder()
      .update(Input)
      .set(updateData)
      .where('id = :id', { id })
      .execute();

    if (updateResult.affected === 0) {
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'No se pudo actualizar el insumo.');
    }

    const updated = await this.inputRepository.findOne({ where: { id } });

    if (!updated) {
      throw new HttpException(StatusCodes.INTERNAL_SERVER_ERROR, 'No se pudo recuperar el insumo actualizado.');
    }

    return updated;
  }

  /**
   * Eliminar un Input (soft delete)
   */
  public async delete(id: string): Promise<Input> {
    const input = await this.findById(id);
    return await this.inputRepository.softRemove(input);
  }
}
