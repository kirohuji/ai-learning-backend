import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Sse,
  Query,
  UseFilters,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConversationService } from './conversation.service';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { PaginationDto } from './dto/pagination.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { CurrentUser } from '@/decorator/user.decorator';
import { User } from '@prisma/client';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ConversationExceptionFilter } from './exceptions/conversation-exception.filter';

@ApiTags('会话管理')
@ApiBearerAuth()
@Controller('conversations')
@UseFilters(ConversationExceptionFilter)
@UseGuards(AuthGuard('jwt'))
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly chatService: ChatService,
  ) {}

  @ApiOperation({ summary: '获取对话列表' })
  @ApiResponse({ status: 200, description: '成功获取对话列表' })
  @Get()
  async getConversations(
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto,
  ) {
    return await this.conversationService.conversations(
      user.id,
      paginationDto.page,
      paginationDto.limit,
      paginationDto.title,
    );
  }

  @ApiOperation({ summary: '创建新的对话' })
  @ApiResponse({ status: 201, description: '对话创建成功' })
  @Post()
  createConversation(
    @CurrentUser() user: User,
    @Body() body: CreateConversationDto,
  ) {
    return this.conversationService.createConversation(
      user.id,
      body.title,
      body.context,
    );
  }

  @ApiOperation({ summary: '获取对话详情' })
  @ApiResponse({ status: 200, description: '成功获取对话详情' })
  @Get(':id')
  async getConversation(@Param('id') id: string) {
    const conversation = await this.conversationService.getConversation(id);
    if (!conversation) {
      return { error: '会话未找到' };
    }
    return conversation;
  }

  @ApiOperation({ summary: '更新对话' })
  @ApiResponse({ status: 200, description: '对话更新成功' })
  @Put(':id')
  async updateConversation(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateDto: UpdateConversationDto,
  ) {
    return await this.conversationService.updateConversation(
      id,
      user.id,
      updateDto,
    );
  }

  @ApiOperation({ summary: '删除对话' })
  @ApiResponse({ status: 204, description: '对话删除成功' })
  @Delete(':id')
  async deleteConversation(@Param('id') id: string, @CurrentUser() user: User) {
    await this.conversationService.deleteConversation(id, user.id);
    return null;
  }

  @ApiOperation({ summary: '发送消息并获取流式响应' })
  @ApiResponse({ status: 200, description: '消息发送成功' })
  @Post(':id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ): Promise<Observable<any>> {
    if (!content) {
      return new Observable((subscriber) => {
        subscriber.next({ data: '请提供消息' });
        subscriber.complete();
      });
    }
    return this.chatService.sendMessage(conversationId, content);
  }
}
