import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationService } from './conversation.service';
import { Observable } from 'rxjs';
import { createDeepSeek, DeepSeekProvider } from '@ai-sdk/deepseek';
import { streamText, generateText, generateObject } from 'ai';
import { z } from 'zod';
import {
  MESSAGE_ROLES,
  MESSAGE_ROLE_NAMES,
  CONVERSATION_LIMITS,
} from './constants/conversation.constants';
import { InvalidMessageException } from './exceptions/conversation.exceptions';
import { contractAnalysisPrompts } from './prompts/contract-analysis';

interface Message {
  role: (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];
  content: string;
  isStreamed: boolean;
  timestamp: Date;
}

type ChatMessage = {
  role: (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];
  content: string;
};

@Injectable()
export class ChatService {
  private readonly apiKey: string;
  // private readonly openrouter: OpenRouterProvider;
  private readonly deepseek: DeepSeekProvider;
  private readonly model = 'deepseek-chat';
  private readonly systemPrompt = `你好`;

  constructor(
    private readonly configService: ConfigService,
    private readonly conversationService: ConversationService,
  ) {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    if (!apiKey) {
      throw new Error('Deepseek API 密钥未配置');
    }
    this.apiKey = apiKey;
    // this.openrouter = createOpenRouter({
    //   apiKey: this.apiKey,
    // });
    this.deepseek = createDeepSeek({
      apiKey: this.apiKey,
    });
  }

  async sendMessage(
    conversationId: string,
    message: string,
  ): Promise<Observable<{ data: string }>> {
    if (message.length > CONVERSATION_LIMITS.MAX_MESSAGE_LENGTH) {
      throw new InvalidMessageException(
        `消息长度不能超过 ${CONVERSATION_LIMITS.MAX_MESSAGE_LENGTH} 个字符`,
      );
    }

    const conversation =
      await this.conversationService.getConversation(conversationId);

    const userMessage: Message = {
      role: MESSAGE_ROLES.USER,
      content: message,
      timestamp: new Date(),
      isStreamed: false,
    };

    await this.conversationService.addMessage(conversationId, userMessage);

    const messages: ChatMessage[] = [
      { role: MESSAGE_ROLES.SYSTEM, content: this.systemPrompt },
      ...(conversation.messages as unknown as Message[]).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const abortController = new AbortController();

    const result = streamText({
      model: this.deepseek.chat(this.model),
      messages,
      abortSignal: abortController.signal,
    });

    return new Observable((subscriber) => {
      let fullContent = '';
      let hasError = false;

      void (async () => {
        try {
          for await (const content of result.textStream) {
            if (!hasError && content) {
              fullContent += content;
              subscriber.next({ data: content });
            }
          }

          if (!hasError && fullContent) {
            await this.conversationService.finalizeStreamedMessages(
              conversationId,
              fullContent,
            );
            subscriber.next({ data: '[DONE]' });
            subscriber.complete();
          }
        } catch (error) {
          hasError = true;
          subscriber.error(
            error instanceof InvalidMessageException
              ? error
              : new InvalidMessageException('消息处理过程中发生错误'),
          );
        }
      })();

      return () => {
        subscriber.next({ data: '[DONE]' });
        subscriber.complete();
        abortController.abort();
      };
    });
  }

  async generateTitle(conversationId: string): Promise<string> {
    const conversation =
      await this.conversationService.getConversation(conversationId);

    if (
      !conversation ||
      (conversation.messages as unknown as Message[]).length === 0
    ) {
      return '未命名对话';
    }

    const summary = (conversation.messages as unknown as Message[])
      .slice(0, 3)
      .map((msg) => `${MESSAGE_ROLE_NAMES[msg.role]}: ${msg.content}`)
      .join('\n');

    const result = await generateText({
      model: this.deepseek.chat(this.model),
      messages: [
        {
          role: MESSAGE_ROLES.SYSTEM,
          content: `你是一个法律 AI 助手。根据以下聊天摘要生成一个简短的中文标题（不超过15个字）：\n${summary}`,
        },
      ],
    });

    const title = result.text.trim();
    await this.conversationService.updateTitle(conversationId, title);
    return title;
  }
}
