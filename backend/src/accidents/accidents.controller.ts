import { Controller, Post, Get, Body, UseGuards, Req, Param, ParseIntPipe } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { JoinAccidentDto } from './dto/join-accident.dto';

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

    @UseGuards(JwtAuthGuard)
    @Post('join')
    join(@Req() req, @Body() dto: JoinAccidentDto) {
        const userId = req.user.sub;
        return this.accidentsService.joinAccident(userId, dto.token);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req) {
        const userId = req.user.sub;
        return this.accidentsService.findAllByUser(userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
        const userId = req.user.sub;
        return this.accidentsService.findOneByUser(userId, id);
    }
}
