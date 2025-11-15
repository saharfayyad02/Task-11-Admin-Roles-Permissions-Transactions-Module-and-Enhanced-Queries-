import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { Roles } from 'src/decorators/roles.decorator';
import type { CreateOrderDTO, CreateOrderResponseDTO, CreateOrderReturnDTO, OrderOverViewResponseDTO, OrderResponseDTO } from './types/order.dto';
import { ZodValidationPipe } from 'src/pips/zod.validation.pipe';
import { createOrderDTOValidationSchema, createReturnDTOValidationSchema } from './util/order.validation.schema';
import { ProductResponseDto } from '../product/types/product.dto';
import { paginationSchema } from '../utils/api.util';
import type{ PaginationQueryType, PaginationResult } from 'src/types/util.types';

@Controller('order')
@Roles(['CUSTOMER'])
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

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
  //   return this.orderService.update(+id, updateOrderDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }

  //return end points

  // create return
  @Post('return')
  createReturn(
    @Body(new ZodValidationPipe(createReturnDTOValidationSchema)) 
    createOrderReturnDTO: CreateOrderReturnDTO,
    @Req() req:Express.Request): Promise<CreateOrderResponseDTO>
  {
       return this.orderService.createReturn(createOrderReturnDTO,BigInt(req.user!.id))
  } 
}
