import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDTO, RegisterDTO, UserResponseDTO } from './dto/auth.dto';
import * as argon from 'argon2'
import { UserService } from '../user/user.service';
import { removeFields } from '../utils/object';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'generated/prisma';
import { ConfigService } from '@nestjs/config';
import { EnvVariables } from 'src/types/decleration-merging';

@Injectable() 
export class AuthService {
  constructor(
    private userService : UserService,
    private jwtService: JwtService,
    private configService:ConfigService<EnvVariables>
  ){}
  async register(registerDTO: RegisterDTO):Promise<UserResponseDTO> {
    //hash passward
      const hashPass = await this.hashPassward(registerDTO.password);
      // store user in db with hashed pass
      const CreatedUser = await this.userService.create({...registerDTO,password:hashPass})
      //const createdUserWithoutPass = removeFields(CreatedUser,['password']);
      // geterate jwt token 
      const token = await this.generateJwtToken(BigInt(CreatedUser.id),CreatedUser.role)
       
      // return user object without pass
      return{ 
        user:this.userService.mapwithoutPasswordAndCastBigInt(CreatedUser),
        token,
      };

  }

  async login(loginDTO: LoginDTO):Promise<UserResponseDTO> {
        // find the user by email
    const user = await this.userService.findbyEmail(loginDTO.email);
    // verfiy password with argon
    if(user.isDeleted){
      throw new UnauthorizedException('Invalid credentials Deleted')
    }
    const verPassword =await this.verifyPasswarrd(loginDTO.password,user.password);
    
    if(!verPassword){
      throw new UnauthorizedException('Invalid credentials Wrong Password')
    }
    
    // generate jwt token 
    const token = await this.generateJwtToken(BigInt(user.id),user.role)

    // const userWithoutPass = removeFields(user,['password'])
    // return user data + token
     return {
      user:this.userService.mapwithoutPasswordAndCastBigInt(user) ,token
     }
  }

  validate(User:UserResponseDTO['user']){
    const token =  this.generateJwtToken(BigInt(User.id),User.role)
    // const userWithoutPass = removeFields(User,['pa'])
     return {
      user:User ,token
     }
  }

  private hashPassward(passward:string){
       return argon.hash(passward);
  }
  private verifyPasswarrd(passward:string,hashPassward:string){
      return argon.verify(hashPassward,passward);
  }
  private generateJwtToken(userId:bigint,role:UserRole){
    console.log("💡 SECRET INSIDE TOKEN:", this.configService.get('JWT_SECRET'));
    return this.jwtService.sign({sub:String(userId),role})
  }

  // BigInt.prototype.toJson(id:bigint){
  //   return Number(id);
  // }
 
}
