import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AdminAuthController } from './admin-auth/admin-auth.controller';
import { AdminAuthService } from './admin-auth/admin-auth.service';
import { AdminAuthGuard } from './admin-auth/admin-auth.guard';
import { AdminDataController } from './admin-data/admin-data.controller';
import { AdminDataService } from './admin-data/admin-data.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
  controllers: [AppController, AdminAuthController, AdminDataController],
  providers: [AdminAuthService, AdminAuthGuard, AdminDataService]
})
export class AppModule {}
