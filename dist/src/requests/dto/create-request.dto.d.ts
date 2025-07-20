import { RequestPriority } from '../entities/car-request.entity';
export declare class CreateRequestDto {
    purpose: string;
    destination: string;
    departureDateTime: Date;
    returnDateTime?: Date;
    passengerCount: number;
    priority?: RequestPriority;
    additionalNotes?: string;
}
