import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Driver, DriverStatus } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    const driver = this.driverRepository.create(createDriverDto);
    return this.driverRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return this.driverRepository.find();
  }

  async findAvailable(): Promise<Driver[]> {
    return this.driverRepository.find({
      where: { status: DriverStatus.AVAILABLE },
    });
  }

  async findOne(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { id },
      relations: ['requests'],
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Driver> {
    return this.driverRepository.findOne({ where: { licenseNumber } });
  }

  async update(id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findOne(id);
    await this.driverRepository.update(id, updateDriverDto);
    return this.findOne(id);
  }

  async updateStatus(id: string, status: DriverStatus): Promise<Driver> {
    await this.driverRepository.update(id, { status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const driver = await this.findOne(id);
    await this.driverRepository.remove(driver);
  }

  async getDriverStats() {
    const totalDrivers = await this.driverRepository.count();
    const availableDrivers = await this.driverRepository.count({ 
      where: { status: DriverStatus.AVAILABLE } 
    });
    const assignedDrivers = await this.driverRepository.count({ 
      where: { status: DriverStatus.ASSIGNED } 
    });

    return {
      totalDrivers,
      availableDrivers,
      assignedDrivers,
    };
  }

  async getDriversWithExpiringLicenses(days: number = 30): Promise<Driver[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.driverRepository
      .createQueryBuilder('driver')
      .where('driver.licenseExpiryDate <= :futureDate', { futureDate })
      .getMany();
  }
}
