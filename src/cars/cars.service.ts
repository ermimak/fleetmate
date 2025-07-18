import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Car, CarStatus, CarType } from './entities/car.entity';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

@Injectable()
export class CarsService {
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
  ) {}

  async create(createCarDto: CreateCarDto): Promise<Car> {
    const car = this.carRepository.create(createCarDto);
    return this.carRepository.save(car);
  }

  async findAll(): Promise<Car[]> {
    return this.carRepository.find({
      relations: ['currentDriver'],
    });
  }

  async findAvailable(passengerCount?: number, type?: CarType): Promise<Car[]> {
    const query = this.carRepository.createQueryBuilder('car')
      .leftJoinAndSelect('car.currentDriver', 'driver')
      .where('car.status = :status', { status: CarStatus.AVAILABLE });

    if (passengerCount) {
      query.andWhere('car.capacity >= :capacity', { capacity: passengerCount });
    }

    if (type) {
      query.andWhere('car.type = :type', { type });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { id },
      relations: ['currentDriver', 'requests'],
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }

  async findByPlateNumber(plateNumber: string): Promise<Car> {
    return this.carRepository.findOne({
      where: { plateNumber },
      relations: ['currentDriver'],
    });
  }

  async update(id: string, updateCarDto: UpdateCarDto): Promise<Car> {
    const car = await this.findOne(id);
    await this.carRepository.update(id, updateCarDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: CarStatus): Promise<Car> {
    await this.carRepository.update(id, { status });
    return this.findOne(id);
  }

  async assignDriver(carId: string, driverId: string): Promise<Car> {
    await this.carRepository.update(carId, { 
      currentDriverId: driverId,
      status: CarStatus.IN_USE 
    });
    return this.findOne(carId);
  }

  async unassignDriver(carId: string): Promise<Car> {
    await this.carRepository.update(carId, { 
      currentDriverId: null,
      status: CarStatus.AVAILABLE 
    });
    return this.findOne(carId);
  }

  async remove(id: string): Promise<void> {
    const car = await this.findOne(id);
    await this.carRepository.remove(car);
  }

  async getCarStats() {
    const totalCars = await this.carRepository.count();
    const availableCars = await this.carRepository.count({ 
      where: { status: CarStatus.AVAILABLE } 
    });
    const inUseCars = await this.carRepository.count({ 
      where: { status: CarStatus.IN_USE } 
    });
    const maintenanceCars = await this.carRepository.count({ 
      where: { status: CarStatus.MAINTENANCE } 
    });

    const carsByType = await this.carRepository
      .createQueryBuilder('car')
      .select('car.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('car.type')
      .getRawMany();

    return {
      totalCars,
      availableCars,
      inUseCars,
      maintenanceCars,
      carsByType,
    };
  }

  async getCarsNeedingMaintenance(): Promise<Car[]> {
    const today = new Date();
    return this.carRepository.find({
      where: [
        { nextMaintenanceDate: null },
        { nextMaintenanceDate: today },
      ],
      relations: ['currentDriver'],
    });
  }
}
