import { Module } from "@nestjs/common";
import { LoansController } from "./loans.controller";
import { LoansService } from "./loans.service";
import { PrismaService } from "../../common/prisma.service";
import { StellarService } from "../../common/stellar.service";
import { NotificationsService } from "../notifications/notifications.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [LoansController],
  providers: [LoansService, PrismaService, StellarService, NotificationsService],
  exports: [LoansService],
})
export class LoansModule {}
