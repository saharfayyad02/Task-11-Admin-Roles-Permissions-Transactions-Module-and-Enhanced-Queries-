import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, ParseFilePipeBuilder, Req, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import type{ CreateProductDto, ProductResponseDto, UpdateProductDto } from './types/product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'src/pips/zod.validation.pipe';
import { productSchema, productValidationSchema, updateProductValidationSchema } from './util/product.validation';
import { Roles } from 'src/decorators/roles.decorator';
import type {ProductQuery} from './types/product.types';

@Controller('product')
@Roles(['MERCHANT'])
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body(new ZodValidationPipe(productValidationSchema)) createProductDto: CreateProductDto,
         @Req() request:Express.Request,
        @UploadedFile() file?: Express.Multer.File,
         ): Promise<ProductResponseDto> {
      return this.productService.create(createProductDto,request.user,file);
  }

@Patch(':id')
@UseInterceptors(FileInterceptor('file'))
 update(
  @Req() request: Express.Request,
  @Param('id', ParseIntPipe) id: number,
  @Body(new ZodValidationPipe(updateProductValidationSchema))
  updatePayload: UpdateProductDto,             
  @UploadedFile() file?: Express.Multer.File,  
): Promise<ProductResponseDto> {
  return   this.productService.update(id, updatePayload, request.user, file);
}


  @Roles(['CUSTOMER','MERCHANT','ADMIN'])
  @Get()
  findAll(@Query(new ZodValidationPipe(productSchema)) query: ProductQuery) {
    console.log('entered')
    return this.productService.findAll(query);
  }

  @Roles(['CUSTOMER','MERCHANT','ADMIN'])
  @Get(':id')
  findOne(@Param('id',ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id',ParseIntPipe) id: number,
   @Req() request:Express.Request) {
     return this.productService.remove(id,request.user);
   
  }
}
