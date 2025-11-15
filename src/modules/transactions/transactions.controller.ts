import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ZodValidationPipe } from 'src/pips/zod.validation.pipe';
import { paginationSchema } from '../utils/api.util';
import type { PaginationQueryType } from 'src/types/util.types';
import { TransactionOverviewDTO, TransactionResponseDTO } from './types/transaction.dto';
import { transactionIdSchema } from './types/transaction.Validation';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

   @Get()
  findAll(
    @Req() req: Express.Request,
    @Query(new ZodValidationPipe(paginationSchema)) query: PaginationQueryType,
  ): Promise<TransactionOverviewDTO[]> {
    return this.transactionsService.findAll(BigInt(req.user!.id), query);
  }

  @Get(':id')
  findOne(
    @Param(new ZodValidationPipe(transactionIdSchema)) params: { id: number },
    @Req() req: Express.Request,
  ): Promise<TransactionResponseDTO> {
    return this.transactionsService.findOne(BigInt(req.user!.id), BigInt(params.id));
  }
}
