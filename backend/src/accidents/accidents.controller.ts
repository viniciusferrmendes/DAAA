import { Controller, Post, Get, Body, UseGuards, Req, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { JoinAccidentDto } from './dto/join-accident.dto';
import { UpdateAccidentPartyDto } from './dto/update-accident-party.dto';
import { UpdateAccidentGeneralDto } from './dto/update-accident-general.dto';
import { UpdateCircumstancesDto } from './dto/update-circumstances.dto';
import { UpdateCollisionPointDto } from './dto/update-collision-point.dto';
import { UpdateWitnessesDto } from './dto/update-witnesses.dto';
import { UpdateObservationsDto } from './dto/update-observations.dto';
import { SignAccidentDto } from './dto/sign-accident.dto';
import { UpdateVisibleDamagesDto } from './dto/update-visible-damages.dto';
import { UpdateSketchDto } from './dto/update-sketch.dto';

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

    @UseGuards(JwtAuthGuard)
    @Patch(':id/witnesses')
    updateWitnesses(
        @Param('id') id: string,
        @Req() req,
        @Body() dto: UpdateWitnessesDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateWitnesses(+id, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/observations')
    updateObservations(
        @Param('id') id: string,
        @Req() req,
        @Body() dto: UpdateObservationsDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateObservations(+id, userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/visible-damages')
    async updateVisibleDamages(
        @Param('id') id: string,
        @Req() req,
        @Body() dto: UpdateVisibleDamagesDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateVisibleDamages(Number(id), userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/sketch')
    async updateSketch(
        @Param('id') id: string,
        @Req() req,
        @Body() dto: UpdateSketchDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.updateSketch(Number(id), userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/sign')
    async signAccident(
        @Param('id') id: string,
        @Req() req,
        @Body() dto: SignAccidentDto,
    ) {
        const userId = req.user.sub;
        return this.accidentsService.signAccident(Number(id), userId, dto);
    }
}
