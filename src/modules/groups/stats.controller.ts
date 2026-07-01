import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GroupsService } from "./groups.service";
import { Public } from "../../common/guards/public.decorator";

@ApiTags("stats")
@Controller("stats")
export class StatsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Public()
  @Get()
  getStats() {
    return this.groupsService.getStats();
  }
}
