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
  private readonly systemPrompt = `你是一位专业的法律AI助手，具有以下特点：

1. 专业背景：
- 精通中国法律体系，包括宪法、民法、刑法、商法、行政法等各个领域
- 熟悉最新的法律法规、司法解释和典型案例
- 了解法律实务操作流程和法律文书写作规范

2. 服务范围：
- 提供法律咨询和法律知识普及
- 协助分析法律问题和案例
- 提供法律文书写作建议
- 解释法律概念和术语
- 提供法律风险提示

3. 回答原则：
- 准确性：确保提供的法律信息准确、及时、可靠
- 客观性：保持中立立场，不偏袒任何一方
- 实用性：注重实际应用，提供可操作的建议
- 全面性：从多个角度分析问题，提供完整的解决方案

4. 交互规范：
- 使用专业但易懂的语言
- 回答要条理清晰，层次分明
- 在必要时引用相关法条和案例
- 对复杂问题分步骤解答
- 主动询问用户需求，确保理解准确

5. 免责声明：
- 本AI助手提供的建议仅供参考，不构成法律意见
- 建议用户在重要法律事务中咨询专业律师
- 不对AI助手的回答承担法律责任
- 用户应自行判断和承担使用建议的风险

6. 安全提示：
- 不提供可能涉及违法或不当行为的建议
- 保护用户隐私，不收集或存储敏感信息
- 遇到紧急情况时建议用户及时寻求专业帮助

请基于以上原则，为用户提供专业、可靠的法律咨询服务。`;

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
      model: this.openrouter.chat(this.model),
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

  async analyzeContract(
    content: string,
    category: string = '通用',
    reviewPerspective: string = '律师',
    reviewRequirements: string = '请分析合同内容，并提取以下信息：',
  ): Promise<{
    title: string;
    description: string;
    amount: string;
    riskPoints: Array<{
      title: string;
      type: '高' | '注意' | '合规';
      originalText: string;
      analysis: string;
      advice: string;
    }>;
    dynamicFields: Array<{
      name: string;
      value: string;
      type: 'string' | 'number' | 'date' | 'boolean';
      description?: string;
    }>;
  }> {
    const MAX_CONTENT_LENGTH = 200000; // 设置最大内容长度为20万字

    if (content.length > MAX_CONTENT_LENGTH) {
      throw new InvalidMessageException(
        `合同内容长度不能超过 ${MAX_CONTENT_LENGTH} 个字符，当前长度为 ${content.length} 个字符。请将合同内容分成多个部分进行分析。`,
      );
    }

    const contractSchema = z.object({
      title: z.string().max(50),
      description: z.string().max(1000),
      amount: z.string(),
      riskPoints: z.array(
        z.object({
          title: z.string(),
          type: z.enum(['高', '注意', '合规']),
          originalText: z.string(),
          analysis: z.string(),
          advice: z.string(),
        }),
      ),
      dynamicFields: z
        .array(
          z.object({
            name: z.string(),
            value: z.string(),
            type: z.enum(['string', 'number', 'date', 'boolean']),
            description: z.string().optional(),
          }),
        )
        .optional(),
    });

    const prompt = contractAnalysisPrompts.chinese
      .replace('{category}', category)
      .replace('{reviewPerspective}', reviewPerspective)
      .replace('{reviewRequirements}', reviewRequirements)
      .replace('{content}', content);

    try {
      const { object } = await generateObject({
        model: this.openrouter.chat(this.model),
        schema: contractSchema,
        prompt,
      });

      return {
        title: object.title || '未命名',
        description: object.description || content,
        amount: object.amount || '0',
        riskPoints: object.riskPoints || [],
        dynamicFields: object.dynamicFields || [],
      };
    } catch (error) {
      console.error('合同分析失败:', error);

      // 处理不同类型的错误
      if (error instanceof Error) {
        if (
          error.message.includes('No endpoints found that support tool use')
        ) {
          throw new InvalidMessageException(
            '当前模型不支持工具调用，请更换模型',
          );
        } else if (error.message.includes('API key')) {
          throw new InvalidMessageException('API 密钥无效或未配置');
        } else if (error.message.includes('rate limit')) {
          throw new InvalidMessageException('API 调用频率超限，请稍后重试');
        } else if (error.message.includes('timeout')) {
          throw new InvalidMessageException('请求超时，请稍后重试');
        }
      }

      // 处理 API 响应错误
      const apiError = error as { response?: { status: number } };
      if (apiError.response?.status === 500) {
        throw new InvalidMessageException('服务器内部错误，请稍后重试');
      } else if (apiError.response?.status === 401) {
        throw new InvalidMessageException('API 认证失败，请检查配置');
      } else if (apiError.response?.status === 429) {
        throw new InvalidMessageException('API 调用次数超限，请稍后重试');
      } else if (apiError.response?.status === 400) {
        throw new InvalidMessageException('请求参数错误，请检查输入');
      }

      // 其他未知错误
      throw new InvalidMessageException(
        `合同分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }
}
