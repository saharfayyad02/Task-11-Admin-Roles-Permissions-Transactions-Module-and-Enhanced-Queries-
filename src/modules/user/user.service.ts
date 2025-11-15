import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDTO, UserResponseDTO } from '../auth/dto/auth.dto';
import { DatabaseService } from '../database/database.service';
import { User } from 'generated/prisma';
import { removeFields } from '../utils/object';
import { PaginationQueryType, PaginationResult } from 'src/types/util.types';
import is from 'zod/v4/locales/is.js';

@Injectable()
export class UserService {
  constructor(private prismaService: DatabaseService){}
  create(registerDTO: RegisterDTO) {
    return this.prismaService.user.create({
        data: registerDTO
    })
  }

  findbyEmail(email: string) {
    return this.prismaService.user.findUniqueOrThrow({
      where: { email }
    });
  }

   findbyId(id: bigint) {
    return this.prismaService.user.findUniqueOrThrow({
      where: { id }
    });
  }

  findAll(query:PaginationQueryType)
  :Promise<PaginationResult<Omit<User,'password'>>> {
    return this.prismaService.$transaction(async (prisma) =>{
      const pagination = this.prismaService.handleQueryPagination(query);    
      const users = await prisma.user.findMany({
            ...removeFields(pagination,['page']),
            omit: {
              password: true, 
            }
          });
          const totalUsers = await prisma.user.count();
          return {
          data: users,
          ...this.prismaService.formatPaginationResult({
            page: pagination.page,
            count: totalUsers,
            limit: pagination.take, 
          })
        } 
    })
  }


  findOne(id: bigint) {
    return this.prismaService.user.findUniqueOrThrow({
        where: { id },
        omit:{
          password: true,
        }
    });
  }

  update(id: bigint, userUpdatePayDto: UpdateUserDto) {
    return this.prismaService.user.update({
        where: { id },
        data: userUpdatePayDto,
        omit:{
          password: true,
        }
    });
  }

  remove(id: bigint) {
    return this.prismaService.user.update({
        where: { id },
        data:{isDeleted:true},
    });
  }
  
  mapwithoutPasswordAndCastBigInt(user:User):UserResponseDTO['user']{
    const userWithoutPassword = removeFields(user, ['password']);
    // cast bigint to number
    return {
      ...userWithoutPassword,
      id: String(userWithoutPassword.id),
    };
  }
}
