import { z } from 'zod';

export const transactionIdSchema = z.object({
  id: z.coerce.number().min(1, 'Transaction ID must be a positive number'),
});
