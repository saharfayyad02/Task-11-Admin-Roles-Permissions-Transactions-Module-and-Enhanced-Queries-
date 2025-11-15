import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './modules/guards/auth.guard';
import { EnvVariables } from './types/decleration-merging';
import { RoleGuard } from './modules/guards/roles.guard';
import { ProductModule } from './modules/product/product.module';
import { FileModule } from './modules/file/file.module';
import { OrderModule } from './modules/order/order.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    JwtModule.registerAsync({
      global: true,
      useFactory: (configService: ConfigService<EnvVariables>) => ({
        secret: configService.get<string>('JWT_SECRET'), // ✅ Not undefined anymore
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UserModule,
    DatabaseModule,
    ProductModule,
    FileModule,
    OrderModule,
  ],

  controllers: [AppController],   
  providers: [
    AppService,                  
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    }
  ],
})
export class AppModule {}
