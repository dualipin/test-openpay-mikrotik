import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [PrismaModule, PaymentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
