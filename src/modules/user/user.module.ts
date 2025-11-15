import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],          // ✅ Import DatabaseModule (so UserService can use DatabaseService)
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],             // ✅ Export UserService (so AuthModule can use it)
})
export class UserModule {}
