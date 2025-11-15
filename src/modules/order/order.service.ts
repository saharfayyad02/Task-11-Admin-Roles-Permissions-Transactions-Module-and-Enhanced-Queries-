import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDTO, CreateOrderResponseDTO, CreateOrderReturnDTO, OrderOverViewResponseDTO, OrderResponseDTO } from './types/order.dto';
import { DatabaseService } from '../database/database.service';
import { BadRequestError } from '@imagekit/nodejs';
import { MoneyUtil } from '../utils/money.util';
import { Prisma, Product, ReturnStatus } from 'generated/prisma';
import { Decimal } from 'generated/prisma/runtime/index-browser';
import { PaginationQueryType } from 'src/types/util.types';
import { removeFields } from '../utils/object';

@Injectable()
export class OrderService {
  constructor(private readonly prismaService:DatabaseService) {}
 async create(createOrderDto: CreateOrderDTO, userId: number | bigint) {
  const productIds = createOrderDto.map((item) => item.productId);

  const products = await this.prismaService.product.findMany({
    where: {
      id: { in: productIds },
      isDeleted: false,
    },
  });
  console.log('products.length',products.length)
    console.log('productIds.length',productIds.length)


  if (products.length !== productIds.length) {
    throw new BadRequestException('One or more products are invalid');
  }

  const orderProductData = this.mapProductDtoOrderProduct(
    createOrderDto,
    products,
  );

  const orderTotalPrice = MoneyUtil.calculateTotalAmount(
    orderProductData.map((item) => ({
      price: item.pricePerItem as Decimal,
      qty: item.totalQty,
    })),
  );

  const createdOrder = await this.prismaService.order.create({
    data: {
      orderProducts: {
        createMany: { data: orderProductData },
      },
      transactions: {
        create: {
          amount: orderTotalPrice,
          type: 'DEBIT',
          userId: userId,
        },
      },
      orderStatus: 'PENDING',
      userId: BigInt(userId), 
    },
    include: {
      orderProducts: { include: { product: true } },
      transactions: true,
      orderReturns: {
        include: { returnedItems: { include: { product: true } } },
      },
    },
  });

  return createdOrder;
}


async updateStatus(
  userId: bigint,
  orderId: bigint,
  status: 'PENDING' | 'SUCCESS'
): Promise<OrderResponseDTO> {
  const order = await this.prismaService.order.findUnique({
    where: { id: orderId },
    include: {
      orderProducts: { include: { product: true } },
      transactions: true,
      orderReturns: { include: { returnedItems: { include: { product: true } } } },
    },
  });

  if (!order) {
    throw new NotFoundException(`Order #${orderId} not found`);
  }

  if (order.orderStatus === status) {
    throw new BadRequestException('Order already has this status');
  }

  const updatedOrder = await this.prismaService.order.update({
    where: { id: orderId },
    data: { orderStatus: status },
    include: {
      orderProducts: { include: { product: true } },
      transactions: true,
      orderReturns: { include: { returnedItems: { include: { product: true } } } },
    },
  });

  return updatedOrder;
}

//  async findAll(userId: bigint, query:PaginationQueryType) {
//       return this.prismaService.$transaction(async (prisma) =>{
//           const pagination = this.prismaService.handleQueryPagination(query);    
//           const Orders = await prisma.order.findMany({
//                 ...removeFields(pagination,['page']),
//                 where:{userId},
//                 include:{
//                   orderProducts:true,
//                   orderReturns:true,
//                   transactions:true 
//                 }
//               });
//               const count = await prisma.order.count();
//               return {
//               data: Orders,
//               ...this.prismaService.formatPaginationResult({
//                 page: pagination.page,
//                 count: count,
//                 limit: pagination.take, 
//               })
//             } 
//         })
//   }

async findAll(userId: bigint, query: PaginationQueryType) {
  return this.prismaService.$transaction(async (prisma) => {
    const pagination = this.prismaService.handleQueryPagination(query);

    const orders = await prisma.order.findMany({
      ...removeFields(pagination, ['page']),
      where: { userId },
      orderBy: { id: 'desc' }, 
      select: {      
        id: true,
        orderStatus: true,
        createdAt: true,
        orderProducts: {
          select: {
            productId: true,
            totalQty: true,
            pricePerItem: true,
          },
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            createdAt: true,
          },
        },
        orderReturns: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const count = await prisma.order.count({ where: { userId } });

    return {
  data: orders as unknown as OrderOverViewResponseDTO[],
  ...this.prismaService.formatPaginationResult({
    page: pagination.page,
    count,
    limit: pagination.take,
  }),
};

  });
}


  findOne(id: number,userId:bigint) {
    return this.prismaService.order.findUniqueOrThrow({
       where:{id,userId},
       include:{
    orderProducts : { include :{ product:true } },
    transactions:true,
    orderReturns:{ include :{ returnedItems:{include:{ product:true}}}}
    }
    });
  }


  remove(id: number) {
    return `This action removes a #${id} order`;
  }



  /*----------------------------Returned ----------------------------------*/ 

  async createReturn(createReturnDTO:CreateOrderReturnDTO,userId:bigint){
    const returnedProductIdsDTO =  createReturnDTO.items.map((item)=>item.productId)
    await this.prismaService.$transaction(async(prismaTx)=>{
      
      const orderUser = prismaTx.order.findUniqueOrThrow({
        where:{
          userId,
          id:createReturnDTO.orderId
        }
      })
      
      const existingOrderProducts = await prismaTx.orderProduct.findMany({
            where :{ 
              orderId:createReturnDTO.orderId,
              productId:{
                in: returnedProductIdsDTO
              }
            } 
           })
           
      if (returnedProductIdsDTO.length !== existingOrderProducts.length) {
        throw new BadRequestException('invalid returned product');
      }

     await prismaTx.orderReturn.create({
        data:{
          orderId:BigInt(createReturnDTO.orderId),
          returnedItems:{
            createMany:{
              data: createReturnDTO.items
            }
          }
        }
      })

      for(const item of createReturnDTO.items){

        await prismaTx.orderProduct.update({
            where:{
              orderId_productId:{
                orderId:createReturnDTO.orderId,
                productId:item.productId
              }
            },
            data:{
              totalQty:{
                increment:-item.qty
              }
            }
        })
      
      }
    })
    return this.findOne(createReturnDTO.orderId,userId)
  }

  async updateReturnStatus(
  orderReturnId: bigint,
  newStatus: ReturnStatus,
): Promise<OrderResponseDTO> {
  await this.prismaService.$transaction(async (tx) => {
    const orderReturn = await tx.orderReturn.findUnique({
      where: { id: orderReturnId },
      include: {
        returnedItems: {
          select: {
            productId: true,
            qty: true,
            product: { select: { price: true } }, 
          },
        },
        order: {
          include: {
            orderProducts: true,
            transactions: true,
          },
        },
      },
    });

    if (!orderReturn) {
      throw new NotFoundException(`Order return #${orderReturnId} not found`);
    }

    const currentStatus = orderReturn.status as ReturnStatus;

    const allowedTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      PENDING: ['PICKED'],
      PICKED: ['REFUND'],
      REFUND: [],
    };

    if (currentStatus === newStatus) {
      throw new BadRequestException(`Return already has status ${newStatus}`);
    }

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${newStatus}. Allowed: ${
          allowedTransitions[currentStatus].join(', ') || 'none'
        }`,
      );
    }

    await tx.orderReturn.update({
      where: { id: orderReturnId },
      data: { status: newStatus },
    });

    if (newStatus === 'REFUND') {
  for (const item of orderReturn.returnedItems) {
    const refundAmount = Number(item.product.price) * item.qty;

    await tx.userTransaction.create({
      data: {
        orderId: orderReturn.orderId,
        userId: orderReturn.order.userId,
        type: 'CREDIT',
        amount: refundAmount,
        paymentMethod: 'CASH',
      },
    });
  }
}
  });

  const updatedReturn = await this.prismaService.orderReturn.findUnique({
    where: { id: orderReturnId },
  });

  if (!updatedReturn) {
    throw new NotFoundException(`Order return #${orderReturnId} not found after update`);
  }

  return this.findOne(Number(updatedReturn.orderId), BigInt(0));
}

  private mapProductDtoOrderProduct(createOrderDto: CreateOrderDTO,
    products:Product[],
  ): Prisma.OrderProductCreateManyOrderInput[]{
    return createOrderDto.map((item) => { 
      const product = products.find(
        (prod) => BigInt(item.productId) === BigInt(prod.id),
      )!;
      return {
        productId: product.id,
        totalQty: item.qty,
        pricePerItem: product.price,
      };
  }) 
}
}

