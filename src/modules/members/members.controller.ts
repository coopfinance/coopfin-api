import { Controller, Get, Post, Param, Body } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { MembersService } from "./members.service";
import { Public } from "../../common/guards/public.decorator";

@ApiTags("members")
@Controller("groups/:groupId/members")
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Public()
  @Get()
  findByGroup(@Param("groupId") groupId: string) {
    return this.membersService.findByGroup(groupId);
  }

  @Post()
  @ApiBearerAuth()
  add(
    @Param("groupId") groupId: string,
    @Body("address") address: string,
    @Body("displayName") displayName?: string,
  ) {
    return this.membersService.add(groupId, address, displayName);
  }
}
