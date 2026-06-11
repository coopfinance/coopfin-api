import { Controller, Get, Post, Patch, Param, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
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
  @ApiOperation({ summary: "Register a loan request after on-chain submission" })
  create(@Body() dto: CreateLoanDto) {
    return this.loansService.create(dto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update loan status (after on-chain approval/repayment)" })
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.loansService.updateStatus(id, status);
  }
}
