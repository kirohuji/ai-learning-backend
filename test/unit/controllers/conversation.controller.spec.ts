import { Test, TestingModule } from '@nestjs/testing';
import { ConversationController } from '../../../src/modules/conversation/conversation.controller';
import { ConversationService } from '../../../src/modules/conversation/conversation.service';
import { ChatService } from '../../../src/modules/conversation/chat.service';
import { Observable } from 'rxjs';
import {
  ConversationNotFoundException,
  ConversationUnauthorizedException,
  ConversationLimitExceededException,
} from '../../../src/modules/conversation/exceptions/conversation.exceptions';

describe('ConversationController', () => {
  let controller: ConversationController;

  const mockConversationService = {
    createConversation: jest.fn(),
    getConversation: jest.fn(),
    conversations: jest.fn(),
    updateConversation: jest.fn(),
    deleteConversation: jest.fn(),
  };

  const mockChatService = {
    sendMessage: jest.fn(),
    analyzeContract: jest.fn(),
  };

  const mockUser = {
    id: '1',
    phone: '13800138000',
    name: 'Test User',
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashed_password',
    avatar: null,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationController],
      providers: [
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ConversationController>(ConversationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const createConversationDto = {
        title: 'Test Conversation',
        context: {},
      };

      const mockConversation = {
        id: '1',
        ...createConversationDto,
        createdBy: mockUser.id,
        messages: [],
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      mockConversationService.createConversation.mockResolvedValue(
        mockConversation,
      );

      const result = await controller.createConversation(
        mockUser,
        createConversationDto,
      );

      expect(result).toEqual(mockConversation);
      expect(mockConversationService.createConversation).toHaveBeenCalledWith(
        mockUser.id,
        createConversationDto.title,
        createConversationDto.context,
      );
    });

    it('should throw ConversationLimitExceededException when limit is reached', async () => {
      const createConversationDto = {
        title: 'Test Conversation',
        context: {},
      };

      mockConversationService.createConversation.mockRejectedValue(
        new ConversationLimitExceededException(),
      );

      await expect(
        controller.createConversation(mockUser, createConversationDto),
      ).rejects.toThrow(ConversationLimitExceededException);
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      const conversationId = '1';
      const mockConversation = {
        id: conversationId,
        title: 'Test Conversation',
        messages: [],
      };

      mockConversationService.getConversation.mockResolvedValue(
        mockConversation,
      );

      const result = await controller.getConversationHistory(conversationId);

      expect(result).toEqual(mockConversation);
      expect(mockConversationService.getConversation).toHaveBeenCalledWith(
        conversationId,
      );
    });

    it('should return error when conversation not found', async () => {
      const conversationId = 'non-existent-id';
      const mockError = new ConversationNotFoundException();

      mockConversationService.getConversation.mockRejectedValue(mockError);

      await expect(
        controller.getConversationHistory(conversationId),
      ).rejects.toThrow(ConversationNotFoundException);
    });
  });

  describe('conversations', () => {
    it('should return paginated conversations', async () => {
      const paginationDto = {
        page: 1,
        limit: 10,
        title: 'Test',
      };

      const mockResponse = {
        data: [
          {
            id: '1',
            title: 'Test Conversation',
            createdBy: mockUser.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          total: 1,
          page: paginationDto.page,
          limit: paginationDto.limit,
          totalPages: 1,
        },
      };

      mockConversationService.conversations.mockResolvedValue(mockResponse);

      const result = await controller.conversations(mockUser, paginationDto);

      expect(result).toEqual(mockResponse);
      expect(mockConversationService.conversations).toHaveBeenCalledWith(
        mockUser.id,
        paginationDto.page,
        paginationDto.limit,
        paginationDto.title,
      );
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation', async () => {
      const conversationId = '1';
      const updateConversationDto = {
        title: 'Updated Conversation',
      };

      const mockUpdatedConversation = {
        id: conversationId,
        ...updateConversationDto,
        createdBy: mockUser.id,
      };

      mockConversationService.updateConversation.mockResolvedValue(
        mockUpdatedConversation,
      );

      const result = await controller.updateConversation(
        mockUser,
        conversationId,
        updateConversationDto,
      );

      expect(result).toEqual(mockUpdatedConversation);
      expect(mockConversationService.updateConversation).toHaveBeenCalledWith(
        conversationId,
        mockUser.id,
        updateConversationDto,
      );
    });

    it('should throw ConversationNotFoundException when conversation not found', async () => {
      const conversationId = '1';
      const updateConversationDto = {
        title: 'Updated Conversation',
      };

      mockConversationService.updateConversation.mockRejectedValue(
        new ConversationNotFoundException(),
      );

      await expect(
        controller.updateConversation(
          mockUser,
          conversationId,
          updateConversationDto,
        ),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('should throw ConversationUnauthorizedException when unauthorized', async () => {
      const conversationId = '1';
      const updateConversationDto = {
        title: 'Updated Conversation',
      };

      mockConversationService.updateConversation.mockRejectedValue(
        new ConversationUnauthorizedException(),
      );

      await expect(
        controller.updateConversation(
          mockUser,
          conversationId,
          updateConversationDto,
        ),
      ).rejects.toThrow(ConversationUnauthorizedException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      const conversationId = '1';

      mockConversationService.deleteConversation.mockResolvedValue({
        id: conversationId,
      });

      const result = await controller.deleteConversation(
        conversationId,
        mockUser,
      );

      expect(result).toEqual({ id: conversationId });
      expect(mockConversationService.deleteConversation).toHaveBeenCalledWith(
        conversationId,
        mockUser.id,
      );
    });

    it('should throw ConversationNotFoundException when conversation not found', async () => {
      const conversationId = '1';

      mockConversationService.deleteConversation.mockRejectedValue(
        new ConversationNotFoundException(),
      );

      await expect(
        controller.deleteConversation(conversationId, mockUser),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('should throw ConversationUnauthorizedException when unauthorized', async () => {
      const conversationId = '1';

      mockConversationService.deleteConversation.mockRejectedValue(
        new ConversationUnauthorizedException(),
      );

      await expect(
        controller.deleteConversation(conversationId, mockUser),
      ).rejects.toThrow(ConversationUnauthorizedException);
    });
  });

  describe('streamChat', () => {
    it('should return stream response', async () => {
      const conversationId = '1';
      const message = 'Hello';

      const mockObservable = new Observable((subscriber) => {
        subscriber.next({ data: 'Response' });
        subscriber.complete();
      });

      mockChatService.sendMessage.mockReturnValue(mockObservable);

      const result = await controller.streamChat(conversationId, message);

      expect(result).toBeInstanceOf(Observable);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        conversationId,
        message,
      );
    });

    it('should return error message when no message provided', async () => {
      const conversationId = '1';
      const message = '';

      const result = await controller.streamChat(conversationId, message);

      expect(result).toBeInstanceOf(Observable);
      result.subscribe((value) => {
        expect(value).toEqual({ data: '请提供消息' });
      });
    });
  });

  describe('analyzeContract', () => {
    it('should analyze contract', async () => {
      const analyzeContractDto = {
        content: 'Contract content',
        category: 'employment',
        reviewPerspective: 'employer',
        reviewRequirements: 'Check compliance',
      };

      const mockResponse = {
        title: 'Employment Contract',
        description: 'Contract analysis',
        amount: 50000,
        riskPoints: ['Risk 1', 'Risk 2'],
      };

      mockChatService.analyzeContract.mockResolvedValue(mockResponse);

      const result = await controller.analyzeContract(analyzeContractDto);

      expect(result).toEqual(mockResponse);
      expect(mockChatService.analyzeContract).toHaveBeenCalledWith(
        analyzeContractDto.content,
        analyzeContractDto.category,
        analyzeContractDto.reviewPerspective,
        analyzeContractDto.reviewRequirements,
      );
    });
  });
});
