import { Controller, Post, Body, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('accidents')
export class AccidentsController {
    constructor(private readonly accidentsService: AccidentsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() req, @Body() dto: CreateAccidentDto) {
        const userId = req.user.sub;
        return this.accidentsService.create(userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/qrsessions')
    createQr(@Param('id', ParseIntPipe) id: number) {
        return this.accidentsService.createQrSession(id);
    }
}
