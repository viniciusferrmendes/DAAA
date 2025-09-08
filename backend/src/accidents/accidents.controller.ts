import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Req,
    Param,
    ParseIntPipe,
    Patch,
} from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccidentDto } from './dto/create-accident.dto';
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
        return this.accidentsService.create(userId, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/qrsessions')
    createQrSession(@Req() req, @Param('id') id: string) {
        const userId = req.user.sub;
        return this.accidentsService.createQrSession(userId, Number(id), req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Post('join')
    joinAccident(@Req() req, @Body('token') token: string) {
        const userId = req.user.sub;
        return this.accidentsService.joinAccident(userId, token, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req) {
        return this.accidentsService.findAllByUser(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
        return this.accidentsService.findOneByUser(req.user.sub, id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/general')
    updateGeneral(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateAccidentGeneralDto,
    ) {
        return this.accidentsService.updateGeneral(req.user.sub, +id, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/party/A')
    updatePartyA(@Req() req, @Param('id') id: string, @Body() dto: UpdateAccidentPartyDto) {
        return this.accidentsService.updateParty(req.user.sub, +id, 'A', dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/party/B')
    updatePartyB(@Req() req, @Param('id') id: string, @Body() dto: UpdateAccidentPartyDto) {
        return this.accidentsService.updateParty(req.user.sub, +id, 'B', dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/circumstances')
    updateCircumstances(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateCircumstancesDto,
    ) {
        return this.accidentsService.updateCircumstances(+id, req.user.sub, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/collision-point')
    updateCollisionPoint(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateCollisionPointDto,
    ) {
        return this.accidentsService.updateCollisionPoint(+id, req.user.sub, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/witnesses')
    updateWitnesses(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateWitnessesDto,
    ) {
        return this.accidentsService.updateWitnesses(+id, req.user.sub, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/observations')
    updateObservations(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateObservationsDto,
    ) {
        return this.accidentsService.updateObservations(+id, req.user.sub, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/visible-damages')
    updateVisibleDamages(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateVisibleDamagesDto,
    ) {
        return this.accidentsService.updateVisibleDamages(+id, req.user.sub, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/sketch')
    updateSketch(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: UpdateSketchDto,
    ) {
        return this.accidentsService.updateSketch(+id, req.user.sub, dto, req.ip);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/sign')
    signAccident(
        @Req() req,
        @Param('id') id: string,
        @Body() dto: SignAccidentDto,
    ) {
        return this.accidentsService.signAccident(+id, req.user.sub, dto, req.ip);
    }
}
