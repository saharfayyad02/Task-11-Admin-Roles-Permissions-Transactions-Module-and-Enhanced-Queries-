import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { PaginationQueryType } from 'src/types/util.types';
import { ZodValidationPipe } from 'src/pips/zod.validation.pipe';
import { updatedUserValidationSchema } from './util/user.validation.schema';
import { paginationSchema } from '../utils/api.util';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(paginationSchema)) 
  query: PaginationQueryType = { limit: 10, page: 1  })  {
    return this.userService.findAll({
      limit: Number(query.limit) ,
      page: Number(query.page) ,
    } as Required<PaginationQueryType>);
  }

  @Get(':id')
  findOne(@Param('id') id: bigint) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: bigint, @Body(new ZodValidationPipe(updatedUserValidationSchema)) updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: bigint) {
    const deletedUser = await this.userService.remove(id);
    return Boolean(deletedUser);
  }
}
