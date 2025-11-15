import { Prisma, Product } from "generated/prisma";


export type CreateProductDto = Pick<Product, 'name' | 'description'  > & { price : number };

export type UpdateProductDto = Partial<CreateProductDto>;

export type ProductResponseDto = Prisma.ProductGetPayload<{
  include: {
    Asset: true;
  };
}>;