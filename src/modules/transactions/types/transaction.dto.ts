import { Prisma } from 'generated/prisma';

// Full transaction details (for GET /:id)
export type TransactionResponseDTO = Prisma.UserTransactionGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } }; // show basic user info
    order: true;
    orderReturn: true;
  };
}>;

// Lightweight view (for GET /transactions)
export type TransactionOverviewDTO = {
  id: bigint;
  userId: bigint;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  paymentMethod: 'CASH';
  createdAt: Date;
  orderId: bigint | null;
  orderReturnId: bigint | null;
};
