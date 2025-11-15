import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/decorators/roles.decorator';
import type { CreateOrderDTO, CreateOrderResponseDTO, CreateOrderReturnDTO, OrderOverViewResponseDTO, OrderResponseDTO, UpdateOrderStatusDTO, UpdateReturnStatusDTO } from './types/order.dto';
import { ZodValidationPipe } from 'src/pips/zod.validation.pipe';
import { createOrderDTOValidationSchema, createReturnDTOValidationSchema, updateOrderStatusValidationSchema, updateReturnStatusValidationSchema } from './util/order.validation.schema';
import { ProductResponseDto } from '../product/types/product.dto';
import { paginationSchema } from '../utils/api.util';
import type{ PaginationQueryType, PaginationResult } from 'src/types/util.types';

@Controller('order')
@Roles(['CUSTOMER','ADMIN'])
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Post()
  create(@Body(new ZodValidationPipe(createOrderDTOValidationSchema)) createOrderDto: CreateOrderDTO,
         @Req() req:Express.Request): Promise<CreateOrderResponseDTO> {
    return this.orderService.create(createOrderDto,BigInt(req.user!.id));
  }

  @Get()
  findAll(@Req() req:Express.Request,
          @Query(new ZodValidationPipe(paginationSchema)) query:
          PaginationQueryType): Promise<PaginationResult <OrderOverViewResponseDTO>> {
      return this.orderService.findAll(BigInt(req.user!.id),query);
  }

   @Get(':id')
  findOne(@Param('id') id: number, @Req() req:Express.Request): Promise<OrderResponseDTO> {
    return this.orderService.findOne(id,BigInt(req.user!.id));
  }

  // must edit to pass the orderId
@Roles(['ADMIN'])
@Patch(':id/status')
async updateStatus(
  @Param('id') id: number,
  @Req() req:Express.Request,
  @Body(new ZodValidationPipe(updateOrderStatusValidationSchema))
  updateOrderStatusDto: UpdateOrderStatusDTO,
) {
  return this.orderService.updateStatus(BigInt(req.user!.id),BigInt(id),updateOrderStatusDto.status);
}

  /*---------------------------------------------Returned --------------------------*/
  // create return
  @Post('return')
  createReturn(
    @Body(new ZodValidationPipe(createReturnDTOValidationSchema)) 
    createOrderReturnDTO: CreateOrderReturnDTO,
    @Req() req:Express.Request): Promise<CreateOrderResponseDTO>
  {
       return this.orderService.createReturn(createOrderReturnDTO,BigInt(req.user!.id))
  } 

@Roles(['ADMIN'])
@Patch('return/:id/status')
async updateReturnStatus(
  @Param('id') id: number,
  @Body(new ZodValidationPipe(updateReturnStatusValidationSchema))
  dto: UpdateReturnStatusDTO,
): Promise<OrderResponseDTO> {
  return this.orderService.updateReturnStatus(BigInt(id), dto.status);
}
}
