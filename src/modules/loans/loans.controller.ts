import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/auth.types";
import { LoansService, CreateLoanDto } from "./loans.service";

@ApiTags("loans")
@Controller("loans")
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @ApiOperation({ summary: "List loans, optionally filtered by group or status" })
  @ApiQuery({ name: "groupId", required: false })
  @ApiQuery({ name: "status",  required: false })
  findAll(@Query("groupId") groupId?: string, @Query("status") status?: string) {
    return this.loansService.findAll(groupId, status);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.loansService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a loan request after on-chain submission" })
  create(@Body() dto: CreateLoanDto, @Req() req: AuthenticatedRequest) {
    return this.loansService.create(dto, req.user.address);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update loan status (after on-chain approval/repayment)" })
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loansService.updateStatus(id, status, req.user.address);
  }
}
