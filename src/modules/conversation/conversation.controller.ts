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
import { AnalyzeContractDto } from './dto/analyze-contract.dto';
import { AnalyzeContractResponseDto } from './dto/analyze-contract-response.dto';
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

  @ApiOperation({ summary: '创建新的对话' })
  @ApiResponse({ status: 201, description: '对话创建成功' })
  @Post()
  createConversation(
    @CurrentUser() user: User,
    @Body() body: CreateConversationDto,
  ) {
    const conversation = this.conversationService.createConversation(
      user.id,
      body.title,
      body.context,
    );
    return conversation;
  }

  @ApiOperation({ summary: '获取对话历史记录' })
  @ApiResponse({ status: 200, description: '成功获取对话历史' })
  @Post('get/:conversationId')
  async getConversationHistory(
    @Param('conversationId') conversationId: string,
  ) {
    const conversation =
      await this.conversationService.getConversation(conversationId);
    if (!conversation) {
      return { error: '会话未找到' };
    }
    return conversation;
  }

  @ApiOperation({ summary: '获取对话列表（分页）' })
  @ApiResponse({ status: 200, description: '成功获取对话列表' })
  @Post('pagination')
  async conversations(@CurrentUser() user: User, @Body() body: PaginationDto) {
    return await this.conversationService.conversations(
      user.id,
      body.page,
      body.limit,
      body.title,
    );
  }

  @ApiOperation({ summary: '更新对话信息' })
  @ApiResponse({ status: 200, description: '对话更新成功' })
  @Post('update/:conversationId')
  async updateConversation(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
    @Body() body: UpdateConversationDto,
  ) {
    return this.conversationService.updateConversation(
      conversationId,
      user.id,
      body,
    );
  }

  @ApiOperation({ summary: '删除对话' })
  @ApiResponse({ status: 200, description: '对话删除成功' })
  @Post('delete/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
  ) {
    return this.conversationService.deleteConversation(conversationId, user.id);
  }

  @ApiOperation({ summary: '发送消息并获取流式响应' })
  @ApiResponse({ status: 200, description: '消息发送成功' })
  @Sse(':conversationId/message')
  async streamChat(
    @Param('conversationId') conversationId: string,
    @Query('message') message: string,
  ): Promise<Observable<any>> {
    if (!message) {
      return new Observable((subscriber) => {
        subscriber.next({ data: '请提供消息' });
        subscriber.complete();
      });
    }
    return this.chatService.sendMessage(conversationId, message);
  }

  @ApiOperation({ summary: '测试合同AI分析' })
  @ApiResponse({
    status: 200,
    description: '返回合同分析结果，包括标题、描述、金额和风险点分析',
    type: AnalyzeContractResponseDto,
  })
  @Post('analyzeContract')
  async analyzeContract(@Body() body: AnalyzeContractDto) {
    return await this.chatService.analyzeContract(
      body.content,
      body.category,
      body.reviewPerspective,
      body.reviewRequirements,
    );
  }
}
