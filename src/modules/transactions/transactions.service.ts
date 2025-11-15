import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaginationQueryType } from 'src/types/util.types';
import { TransactionOverviewDTO, TransactionResponseDTO } from './types/transaction.dto';
import { removeFields } from '../utils/object';
import { Decimal } from 'generated/prisma/runtime/library';


@Injectable()
export class TransactionsService {
 constructor(private readonly prismaService: DatabaseService) {}

  async findAll(userId: bigint, query: PaginationQueryType): Promise<TransactionOverviewDTO[]> {
    return this.prismaService.$transaction(async (prisma) => {
      const pagination = this.prismaService.handleQueryPagination(query);

      const transactions = await prisma.userTransaction.findMany({
        ...removeFields(pagination, ['page']),
        where: { userId },
        orderBy: { id: 'desc' },
        select: {
          userId:true,
          id: true,
          amount: true,
          type: true,
          paymentMethod: true,
          createdAt: true,
          orderId: true,
          orderReturnId: true,
        },
      });

      return transactions.map((tx) => ({
      ...tx,
      amount: Number(tx.amount),
    }));
    });
  }

   async findOne(userId: bigint, id: bigint): Promise<TransactionResponseDTO> {
    const transaction = await this.prismaService.userTransaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } }, // ✅ add this
        order: true,
        orderReturn: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }

    if (transaction.userId !== userId) {
      throw new NotFoundException(`Transaction #${id} not found for this user`);
    }

    // ✅ Prisma already returns a Decimal — convert it to number for response clarity
    return {
      ...transaction,
      amount: new Decimal(transaction.amount),
    };
  }

}
