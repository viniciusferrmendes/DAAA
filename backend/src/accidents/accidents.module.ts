// src/accidents/accidents.module.ts
import { Module } from '@nestjs/common';
import { AccidentsService } from './accidents.service';
import { AccidentsController } from './accidents.controller';

@Module({
    providers: [AccidentsService],
    controllers: [AccidentsController],
})
export class AccidentsModule { }
