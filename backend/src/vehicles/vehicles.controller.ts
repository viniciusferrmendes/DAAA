import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
    constructor(private readonly vehiclesService: VehiclesService) { }

    @Post()
    create(@Body() dto: CreateVehicleDto) {
        return this.vehiclesService.create(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Req() req, @Param('id') id: string, @Body() dto: UpdateVehicleDto) {
        const userId = req.user.sub;
        return this.vehiclesService.update(userId, Number(id), dto);
    }

    @Get()
    findAll() {
        return this.vehiclesService.findAll();
    }
}
