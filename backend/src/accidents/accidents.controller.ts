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
    createQrSession(@Req() req, @Param('id') id: string) {
        const userId = req.user.sub;
        return this.accidentsService.createQrSession(userId, Number(id));
    }

    @UseGuards(JwtAuthGuard)
    @Post('join')
    joinAccident(@Req() req, @Body('token') token: string) {
        const userId = req.user.sub;
        return this.accidentsService.joinAccident(userId, token);
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
