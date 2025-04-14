import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from '@/modules/conversation/conversation.service';
import { PrismaService } from '@/common/prisma/prisma.service';
import {
  ConversationNotFoundException,
  ConversationUnauthorizedException,
  ConversationLimitExceededException,
} from '@/modules/conversation/exceptions/conversation.exceptions';

describe('ConversationService', () => {
  let service: ConversationService;

  const mockPrismaService = {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
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
      providers: [
        ConversationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const title = 'Test Conversation';
      const context = {};

      const mockConversation = {
        id: '1',
        title,
        context,
        createdBy: mockUser.id,
        messages: [],
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);
      mockPrismaService.conversation.count.mockResolvedValue(0);

      const result = await service.createConversation(
        mockUser.id,
        title,
        context,
      );

      expect(result).toEqual(mockConversation);
      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: {
          title,
          context,
          createdBy: mockUser.id,
          messages: [],
          updatedAt: expect.any(Date) as Date,
          createdAt: expect.any(Date) as Date,
        },
      });
    });

    it('should throw ConversationLimitExceededException when limit is reached', async () => {
      const title = 'Test Conversation';
      const context = {};

      mockPrismaService.conversation.count.mockResolvedValue(100);

      await expect(
        service.createConversation(mockUser.id, title, context),
      ).rejects.toThrow(ConversationLimitExceededException);
    });
  });

  describe('getConversation', () => {
    it('should return a conversation', async () => {
      const conversationId = '1';
      const mockConversation = {
        id: conversationId,
        title: 'Test Conversation',
        createdBy: mockUser.id,
        messages: [],
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation,
      );

      const result = await service.getConversation(conversationId);

      expect(result).toEqual(mockConversation);
      expect(mockPrismaService.conversation.findFirst).toHaveBeenCalledWith({
        where: { id: conversationId },
      });
    });

    it('should throw ConversationNotFoundException when conversation not found', async () => {
      const conversationId = '1';

      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(service.getConversation(conversationId)).rejects.toThrow(
        ConversationNotFoundException,
      );
    });
  });

  describe('conversations', () => {
    it('should return paginated conversations', async () => {
      const page = 1;
      const limit = 10;
      const title = 'Test';

      const mockConversations = [
        {
          id: '1',
          title: 'Test Conversation',
          createdBy: mockUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockTotal = 1;

      mockPrismaService.conversation.findMany.mockResolvedValue(
        mockConversations,
      );
      mockPrismaService.conversation.count.mockResolvedValue(mockTotal);

      const result = await service.conversations(
        mockUser.id,
        page,
        limit,
        title,
      );

      expect(result).toEqual({
        data: mockConversations,
        meta: {
          total: mockTotal,
          page,
          limit,
          totalPages: Math.ceil(mockTotal / limit),
        },
      });

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: mockUser.id,
          title: {
            contains: title,
            mode: 'insensitive',
          },
        },
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
        skip: 0,
        take: limit,
      });
    });
  });

  describe('updateConversation', () => {
    it('should update a conversation', async () => {
      const conversationId = '1';
      const updateData = { title: 'Updated Title' };
      const mockConversation = {
        id: conversationId,
        title: 'Test Conversation',
        createdBy: mockUser.id,
        messages: [],
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation,
      );
      mockPrismaService.conversation.update.mockResolvedValue({
        ...mockConversation,
        ...updateData,
      });

      const result = await service.updateConversation(
        conversationId,
        mockUser.id,
        updateData,
      );

      expect(result).toEqual({
        ...mockConversation,
        ...updateData,
      });
    });

    it('should throw ConversationNotFoundException when conversation not found', async () => {
      const conversationId = '1';
      const updateData = { title: 'Updated Title' };

      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.updateConversation(conversationId, mockUser.id, updateData),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('should throw ConversationUnauthorizedException when unauthorized', async () => {
      const conversationId = '1';
      const updateData = { title: 'Updated Title' };
      const mockConversation = {
        id: conversationId,
        title: 'Test Conversation',
        createdBy: 'different-user-id',
        messages: [],
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation,
      );

      await expect(
        service.updateConversation(conversationId, mockUser.id, updateData),
      ).rejects.toThrow(ConversationUnauthorizedException);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', async () => {
      const conversationId = '1';
      const mockConversation = {
        id: conversationId,
        title: 'Test Conversation',
        createdBy: mockUser.id,
        messages: [],
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation,
      );
      mockPrismaService.conversation.delete.mockResolvedValue(mockConversation);

      await service.deleteConversation(conversationId, mockUser.id);

      expect(mockPrismaService.conversation.delete).toHaveBeenCalledWith({
        where: { id: conversationId },
      });
    });

    it('should throw ConversationNotFoundException when conversation not found', async () => {
      const conversationId = '1';

      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteConversation(conversationId, mockUser.id),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('should throw ConversationUnauthorizedException when unauthorized', async () => {
      const conversationId = '1';
      const mockConversation = {
        id: conversationId,
        title: 'Test Conversation',
        createdBy: 'different-user-id',
        messages: [],
      };

      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation,
      );

      await expect(
        service.deleteConversation(conversationId, mockUser.id),
      ).rejects.toThrow(ConversationUnauthorizedException);
    });
  });
});
