import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from '../../../src/modules/auth/sms.service';
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserAlreadyExistsException,
  VerificationCodeExpiredException,
  TooManyVerificationAttemptsException,
  InvalidTokenException,
  TokenExpiredException,
} from '../../../src/modules/auth/exceptions';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    verificationCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockSmsService = {
    sendVerificationCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      const phone = '13800138000';
      const password = 'password123';
      const salt = 'mockSalt';
      const hashedPassword = 'mockHashedPassword';
      const mockUser = {
        id: '1',
        phone,
        password: `${salt}:${hashedPassword}`,
        roles: [
          {
            id: '1',
            name: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
          },
        ],
        avatar: null,
        status: 1,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(phone, password);
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.phone).toBe(mockUser.phone);
      expect(result?.roles).toEqual(mockUser.roles);
    });

    it('should throw UserNotFoundException for non-existent user', async () => {
      const phone = '13800138000';
      const password = 'password123';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(phone, password)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should throw InvalidCredentialsException for wrong password', async () => {
      const phone = '13800138000';
      const password = 'wrongpassword';
      const salt = 'mockSalt';
      const hashedPassword = 'mockHashedPassword';
      const mockUser = {
        id: '1',
        phone,
        password: `${salt}:${hashedPassword}`,
        roles: [
          {
            id: '1',
            name: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
          },
        ],
        avatar: null,
        status: 1,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.validateUser(phone, password)).rejects.toThrow(
        InvalidCredentialsException,
      );
    });
  });

  describe('login', () => {
    it('should generate tokens for valid user', async () => {
      const mockUser = {
        id: '1',
        phone: '13800138000',
        name: 'Test User',
        roles: [
          {
            id: '1',
            name: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
          },
        ],
        avatar: null,
        status: 1,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        access_token: 'mockAccessToken',
        refresh_token: 'mockRefreshToken',
        user: {
          id: mockUser.id,
          phone: mockUser.phone,
          name: mockUser.name,
          roles: mockUser.roles,
        },
      };

      mockJwtService.sign.mockReturnValueOnce('mockAccessToken');
      mockJwtService.sign.mockReturnValueOnce('mockRefreshToken');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(mockUser);
      expect(result).toEqual(mockTokens);
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const phone = '13800138000';
      const password = 'password123';
      const code = '123456';
      const name = 'Test User';

      mockPrismaService.verificationCode.findFirst.mockResolvedValue({
        id: '1',
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const mockNewUser = {
        id: '1',
        phone,
        name,
        roles: [
          {
            id: '1',
            name: 'user',
            createdAt: new Date(),
            updatedAt: new Date(),
            description: null,
          },
        ],
        avatar: null,
        status: 1,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockNewUser);
      mockJwtService.sign.mockReturnValueOnce('mockAccessToken');
      mockJwtService.sign.mockReturnValueOnce('mockRefreshToken');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.register(phone, password, code, name);
      expect(result).toBeDefined();
      expect(result.access_token).toBe('mockAccessToken');
      expect(result.refresh_token).toBe('mockRefreshToken');
      expect(result.user.id).toBe(mockNewUser.id);
    });

    it('should throw UserAlreadyExistsException for existing user', async () => {
      const phone = '13800138000';
      const password = 'password123';
      const code = '123456';
      const name = 'Test User';

      mockPrismaService.verificationCode.findFirst.mockResolvedValue({
        id: '1',
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        phone,
      });

      await expect(
        service.register(phone, password, code, name),
      ).rejects.toThrow(UserAlreadyExistsException);
    });
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      const phone = '13800138000';
      const code = '123456';

      mockPrismaService.verificationCode.count.mockResolvedValue(0);
      mockSmsService.sendVerificationCode.mockResolvedValue(true);
      mockPrismaService.verificationCode.create.mockResolvedValue({
        id: '1',
        phone,
        code,
      });

      const result = await service.sendVerificationCode(phone);
      expect(result).toBe(code);
      expect(mockSmsService.sendVerificationCode).toHaveBeenCalledWith(
        phone,
        code,
      );
    });

    it('should throw TooManyVerificationAttemptsException for too many attempts', async () => {
      const phone = '13800138000';

      mockPrismaService.verificationCode.count.mockResolvedValue(61);

      await expect(service.sendVerificationCode(phone)).rejects.toThrow(
        TooManyVerificationAttemptsException,
      );
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const phone = '13800138000';
      const code = '123456';

      mockPrismaService.verificationCode.findFirst.mockResolvedValue({
        id: '1',
        phone,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      mockPrismaService.verificationCode.update.mockResolvedValue({});

      const result = await service.verifyCode(phone, code);
      expect(result).toBe(true);
    });

    it('should throw VerificationCodeExpiredException for expired code', async () => {
      const phone = '13800138000';
      const code = '123456';

      mockPrismaService.verificationCode.findFirst.mockResolvedValue(null);

      await expect(service.verifyCode(phone, code)).rejects.toThrow(
        VerificationCodeExpiredException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'mockRefreshToken';
      const mockPayload = {
        id: '1',
        phone: '13800138000',
        roles: ['user'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: '1',
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: {
          id: '1',
          phone: '13800138000',
          roles: [{ name: 'user' }],
        },
      });

      mockJwtService.sign.mockReturnValueOnce('newAccessToken');
      mockJwtService.sign.mockReturnValueOnce('newRefreshToken');
      mockPrismaService.refreshToken.delete.mockResolvedValue({});
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken(refreshToken);
      expect(result).toBeDefined();
      expect(result.access_token).toBe('newAccessToken');
      expect(result.refresh_token).toBe('newRefreshToken');
    });

    it('should throw TokenExpiredException for expired token', async () => {
      const refreshToken = 'mockRefreshToken';
      const mockPayload = {
        id: '1',
        phone: '13800138000',
        roles: ['user'],
      };

      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: '1',
        token: refreshToken,
        expiresAt: new Date(Date.now() - 1000),
        user: {
          id: '1',
          phone: '13800138000',
          roles: [{ name: 'user' }],
        },
      });

      mockPrismaService.refreshToken.delete.mockResolvedValue({});

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        TokenExpiredException,
      );
    });

    it('should throw InvalidTokenException for invalid token', async () => {
      const refreshToken = 'invalidToken';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        InvalidTokenException,
      );
    });
  });
});
