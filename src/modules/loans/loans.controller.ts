import { Controller, Get, Post, Patch, Param, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { LoansService, CreateLoanDto } from "./loans.service";
import { FindLoansQueryDto } from "./dto/find-loans-query.dto";

@ApiTags("loans")
@Controller("loans")
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Get()
  @ApiOperation({ summary: "List loans (paginated), optionally filtered by group or status" })
  @ApiQuery({ name: "page",    required: false, type: Number, description: "1-based page number (default 1)" })
  @ApiQuery({ name: "limit",   required: false, type: Number, description: "Items per page (default 20, max 100)" })
  @ApiQuery({ name: "groupId", required: false })
  @ApiQuery({ name: "status",  required: false })
  @ApiQuery({ name: "sortBy",  required: false, enum: ["amount", "requestedAt"] })
  @ApiQuery({ name: "order",   required: false, enum: ["asc", "desc"] })
  findAll(@Query() query: FindLoansQueryDto) {
    return this.loansService.findAll(query);
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
