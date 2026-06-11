import { Controller, Get, Patch, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get unread notifications for a wallet address" })
  getUnread(@Query("recipient") recipient: string) {
    return this.notificationsService.getUnread(recipient);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  markRead(@Param("id") id: string) {
    return this.notificationsService.markRead(id);
  }
}
