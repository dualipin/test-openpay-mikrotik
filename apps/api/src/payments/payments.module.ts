import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { StripeService } from './services/stripe.service';
import { OpenpayService } from './services/openpay.service';

@Module({
  controllers: [PaymentsController],
  providers: [StripeService, OpenpayService]
})
export class PaymentsModule {}
