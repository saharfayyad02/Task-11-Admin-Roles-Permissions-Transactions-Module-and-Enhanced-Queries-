import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDTO, CreateOrderResponseDTO, CreateOrderReturnDTO } from './types/order.dto';
import { DatabaseService } from '../database/database.service';
import { BadRequestError } from '@imagekit/nodejs';
import { MoneyUtil } from '../utils/money.util';
import { Prisma, Product } from 'generated/prisma';
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

 async findAll(userId: bigint, query:PaginationQueryType) {
      return this.prismaService.$transaction(async (prisma) =>{
          const pagination = this.prismaService.handleQueryPagination(query);    
          const Orders = await prisma.order.findMany({
                ...removeFields(pagination,['page']),
                where:{userId},
                include:{
                  orderProducts:true,
                  orderReturns:true,
                  transactions:true 
                }
              });
              const count = await prisma.order.count();
              return {
              data: Orders,
              ...this.prismaService.formatPaginationResult({
                page: pagination.page,
                count: count,
                limit: pagination.take, 
              })
            } 
        })
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

  // update(id: number, updateOrderDto: Update) {
  //   return `This action updates a #${id} order`;
  // }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }

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
