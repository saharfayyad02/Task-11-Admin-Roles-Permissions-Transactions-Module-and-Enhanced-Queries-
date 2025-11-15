import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { JSON_WEB_TOKEN_Payload } from '../auth/types/user.auth.type';
import { removeFields } from '../utils/object';
import { Reflector } from '@nestjs/core';
import { IsPublic } from 'src/decorators/public.decorator';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/decorators/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private refloctor: Reflector){} 
  async canActivate(
    context: ExecutionContext,
  ){
    const roles = this.refloctor.getAllAndOverride<UserRole>(Roles,[context.getHandler(),context.getClass()])
    if(!roles){
      return true;
    }
    // http
    const { user } = context.switchToHttp().getRequest<Request>();
    if(!user){
        throw new UnauthorizedException('User not found in request');
    }
    if(!roles.includes(user.role)){
        throw new UnauthorizedException('User does not have the required role');
    }
    return true;
  }
}

