import { Controller, Post, Get, Body, UseGuards, Req, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { JoinAccidentDto } from './dto/join-accident.dto';
import { UpdateAccidentPartyDto } from './dto/update-accident-party.dto';
import { UpdateAccidentGeneralDto } from './dto/update-accident-general.dto';
import { UpdateCircumstancesDto } from './dto/update-circumstances.dto';
import { UpdateCollisionPointDto } from './dto/update-collision-point.dto';

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

    @UseGuards(JwtAuthGuard)
    @Patch(':id/general')
    updateGeneral(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateAccidentGeneralDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateGeneral(userId, +id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/party/A')
    updatePartyA(@Req() req, @Param('id') id: string, @Body() dto: UpdateAccidentPartyDto) {
        return this.accidentsService.updateParty(req.user.sub, +id, 'A', dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/party/B')
    updatePartyB(@Req() req, @Param('id') id: string, @Body() dto: UpdateAccidentPartyDto) {
        return this.accidentsService.updateParty(req.user.sub, +id, 'B', dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/circumstances')
    updateCircumstances(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateCircumstancesDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateCircumstances(+id, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/collision-point')
    updateCollisionPoint(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateCollisionPointDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateCollisionPoint(+id, userId, dto);
    }
}
