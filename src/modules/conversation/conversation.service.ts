import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  MESSAGE_ROLES,
  DEFAULT_PAGINATION,
  CONVERSATION_LIMITS,
} from './constants/conversation.constants';
import {
  ConversationNotFoundException,
  ConversationUnauthorizedException,
  ConversationLimitExceededException,
} from './exceptions/conversation.exceptions';

interface Message {
  role: (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];
  content: string;
  isStreamed: boolean;
  timestamp: Date;
}

@Injectable()
export class ConversationService {
  constructor(private readonly prisma: PrismaService) {}

  async finalizeStreamedMessages(
    conversationId: string,
    fullContent: string,
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);

    const messages = (conversation.messages as unknown as Message[]) || [];
    const nonStreamedMessages = messages.filter((msg) => !msg.isStreamed);
    const finalMessage: Message = {
      role: MESSAGE_ROLES.ASSISTANT,
      content: fullContent,
      timestamp: new Date(),
      isStreamed: false,
    };

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messages: [
          ...nonStreamedMessages,
          finalMessage,
        ] as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async createConversation(
    userId: string,
    title?: string,
    context?: Prisma.InputJsonValue,
  ) {
    const conversationCount = await this.prisma.conversation.count({
      where: { createdBy: userId },
    });

    if (conversationCount >= CONVERSATION_LIMITS.MAX_CONVERSATIONS_PER_USER) {
      throw new ConversationLimitExceededException();
    }

    return this.prisma.conversation.create({
      data: {
        title: title || '未命名对话',
        createdBy: userId,
        context: context || {},
        messages: [],
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    });
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id },
    });

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    return conversation;
  }

  async conversations(
    userId: string,
    page: number = DEFAULT_PAGINATION.PAGE,
    limit: number = DEFAULT_PAGINATION.LIMIT,
    title?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ConversationWhereInput = {
      createdBy: userId,
    };

    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive',
      };
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        select: {
          id: true,
          title: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where,
      }),
    ]);

    return {
      list: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addMessage(conversationId: string, message: Message): Promise<void> {
    const conversation = await this.getConversation(conversationId);

    const currentMessages =
      (conversation.messages as unknown as Message[]) || [];
    const updatedMessages = [...currentMessages, message];

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messages: updatedMessages as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  async updateConversation(
    id: string,
    userId: string,
    data: Prisma.ConversationUpdateInput,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    if (conversation.createdBy !== userId) {
      throw new ConversationUnauthorizedException();
    }

    return this.prisma.conversation.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async deleteConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        createdBy: userId,
      },
    });

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    if (conversation.createdBy !== userId) {
      throw new ConversationUnauthorizedException();
    }

    return this.prisma.conversation.delete({
      where: { id },
    });
  }

  async updateTitle(conversationId: string, title: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { title, updatedAt: new Date() },
    });
  }
}
