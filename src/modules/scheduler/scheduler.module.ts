import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity.js';
import { StellarModule } from '../stellar/stellar.module.js';
import { SchedulerService } from './scheduler.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), StellarModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
