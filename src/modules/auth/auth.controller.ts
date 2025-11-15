import { Controller, Get, Post, Body, Req, UsePipes, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginDTO, RegisterDTO, UserResponseDTO } from './dto/auth.dto';
import type { Request } from 'express'
import { IsPublic } from 'src/decorators/public.decorator';
import { ZodValidationPipe } from 'src/pips/zod.validation.pipe';
import { registerValidationSchema } from './auth.validation.schema';

@Controller('auth')
@IsPublic(true)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  
  @Post('/register')
  @IsPublic()
  async create(@Body(new ZodValidationPipe(registerValidationSchema)) registerDTO:RegisterDTO,
               @Query() query:Record<string, unknown>, ):Promise<UserResponseDTO> {
    const createdUser = await this.authService.register(registerDTO);
    return createdUser
  }

   @Post('/login')
   @IsPublic()
  login(@Body() loginDTO:LoginDTO ):Promise<UserResponseDTO> {
    return this.authService.login(loginDTO);
  }

  @Get('validate')
  validate(@Req() request:Request) {
    return this.authService.validate(request.user!);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
  //   return this.authService.update(+id, updateAuthDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authService.remove(+id);
  // }
}
