import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LedgerType } from '@prisma/client';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { AdminDataService } from './admin-data.service';

class PageQuery { @Type(() => Number) @Min(1) page = 1; @Type(() => Number) @Min(1) @Max(100) pageSize = 20; @IsOptional() @IsString() keyword = ''; }
class LedgerQuery extends PageQuery { @IsOptional() @IsEnum(LedgerType) type?: LedgerType; }

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminDataController {
  constructor(private readonly data: AdminDataService) {}
  @Get('users') users(@Query() query: PageQuery) { return this.data.users(query.page, query.pageSize, query.keyword); }
  @Get('point-ledgers') ledgers(@Query() query: LedgerQuery) { return this.data.ledgers(query.page, query.pageSize, query.keyword, query.type); }
}
