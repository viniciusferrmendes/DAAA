import { Body, Controller, Get, Post } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @Post()
    create(@Body() dto: CreateVehicleDto) {
        return this.vehiclesService.create(dto);
    }

    @Get()
    findAll() {
        return this.vehiclesService.findAll();
    }
}
