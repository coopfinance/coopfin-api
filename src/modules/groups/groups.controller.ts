import { Controller, Get, Post, Param, Body, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { GroupsService, CreateGroupDto } from "./groups.service";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

@ApiTags("groups")
@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: "List groups (paginated)" })
  @ApiQuery({ name: "page",  required: false, type: Number, description: "1-based page number (default 1)" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page (default 20, max 100)" })
  findAll(@Query() query: PaginationQueryDto) {
    return this.groupsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single group" })
  findOne(@Param("id") id: string) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Register a new group after contract deployment" })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }
}
