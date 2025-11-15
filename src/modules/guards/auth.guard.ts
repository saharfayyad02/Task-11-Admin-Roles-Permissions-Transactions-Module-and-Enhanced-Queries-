import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JSON_WEB_TOKEN_Payload } from '../auth/types/user.auth.type';
import { UserService } from '../user/user.service';
import { DatabaseService } from '../database/database.service';
import { removeFields } from '../utils/object';
import { Reflector } from '@nestjs/core';
import { IsPublic } from 'src/decorators/public.decorator';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService,
              private prismaService: DatabaseService,
              private refloctor: Reflector,
  ){} 
  async canActivate(
    context: ExecutionContext,
  ){
    const isPublic = this.refloctor.getAllAndOverride<boolean>(IsPublic,[context.getHandler(),context.getClass()])
    if(isPublic){
      return true;
    }
    // http
    const request = context.switchToHttp().getRequest<Request>();
    // authorization header
    const authHeader = request.headers.authorization;
    const jwt = authHeader?.split(' ')[1];
    if(!jwt){
      throw new UnauthorizedException();
    }
    try{
        // validate jwt
    const payload = this.jwtService.verify<JSON_WEB_TOKEN_Payload>(jwt) 
    // get user from dp
    const user = await this.prismaService.user.findUniqueOrThrow({
       where :{id: BigInt(payload.sub)}
  })
  request.user = {
    ...removeFields(user,['password']),
    id: String(user.id),
  };
    }catch{
      throw new UnauthorizedException();
    }
    return true;
  }
}

