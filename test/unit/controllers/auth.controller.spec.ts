import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserAlreadyExistsException,
  InvalidVerificationCodeException,
  VerificationCodeExpiredException,
  TooManyVerificationAttemptsException,
} from '../../../src/modules/auth/exceptions';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
    loginWithSMS: jest.fn(),
    getProfile: jest.fn(),
    updateUserPassword: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        phone: '13800138000',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        phone: loginDto.phone,
        roles: [{ name: 'user' }],
      };

      const mockTokens = {
        access_token: 'mockAccessToken',
        refresh_token: 'mockRefreshToken',
        user: {
          id: mockUser.id,
          phone: mockUser.phone,
          roles: mockUser.roles,
        },
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockTokens);

      const result = await controller.login(loginDto);
      expect(result).toEqual(mockTokens);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.phone,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw InvalidCredentialsException for invalid credentials', async () => {
      const loginDto = {
        phone: '13800138000',
        password: 'wrongpassword',
      };

      mockAuthService.validateUser.mockRejectedValue(
        new InvalidCredentialsException(),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
    });
  });

  describe('loginWithSMS', () => {
    it('should login successfully with valid SMS code', async () => {
      const loginWithSMSDto = {
        phone: '13800138000',
        code: '123456',
      };

      const mockTokens = {
        access_token: 'mockAccessToken',
        refresh_token: 'mockRefreshToken',
        user: {
          id: '1',
          phone: loginWithSMSDto.phone,
          roles: [{ name: 'user' }],
        },
      };

      mockAuthService.loginWithSMS.mockResolvedValue(mockTokens);

      const result = await controller.loginWithSMS(loginWithSMSDto);
      expect(result).toEqual(mockTokens);
      expect(mockAuthService.loginWithSMS).toHaveBeenCalledWith(
        loginWithSMSDto.phone,
        loginWithSMSDto.code,
      );
    });

    it('should throw UserNotFoundException for non-existent user', async () => {
      const loginWithSMSDto = {
        phone: '13800138000',
        code: '123456',
      };

      mockAuthService.loginWithSMS.mockRejectedValue(
        new UserNotFoundException(),
      );

      await expect(controller.loginWithSMS(loginWithSMSDto)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('should throw InvalidVerificationCodeException for invalid code', async () => {
      const loginWithSMSDto = {
        phone: '13800138000',
        code: 'wrongcode',
      };

      mockAuthService.loginWithSMS.mockRejectedValue(
        new InvalidVerificationCodeException(),
      );

      await expect(controller.loginWithSMS(loginWithSMSDto)).rejects.toThrow(
        InvalidVerificationCodeException,
      );
    });
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        phone: '13800138000',
        password: 'password123',
        code: '123456',
        name: 'Test User',
      };

      const mockTokens = {
        access_token: 'mockAccessToken',
        refresh_token: 'mockRefreshToken',
        user: {
          id: '1',
          phone: registerDto.phone,
          name: registerDto.name,
          roles: [{ name: 'user' }],
        },
      };

      mockAuthService.register.mockResolvedValue(mockTokens);

      const result = await controller.register(registerDto);
      expect(result).toEqual(mockTokens);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.phone,
        registerDto.password,
        registerDto.code,
        registerDto.name,
      );
    });

    it('should throw UserAlreadyExistsException for existing user', async () => {
      const registerDto = {
        phone: '13800138000',
        password: 'password123',
        code: '123456',
        name: 'Test User',
      };

      mockAuthService.register.mockRejectedValue(
        new UserAlreadyExistsException(),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });

    it('should throw InvalidVerificationCodeException for invalid code', async () => {
      const registerDto = {
        phone: '13800138000',
        password: 'password123',
        code: 'wrongcode',
        name: 'Test User',
      };

      mockAuthService.register.mockRejectedValue(
        new InvalidVerificationCodeException(),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        InvalidVerificationCodeException,
      );
    });
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      const sendSmsDto = {
        phone: '13800138000',
      };

      const mockResponse = {
        phone: sendSmsDto.phone,
        verificationCode: true,
      };

      mockAuthService.sendVerificationCode.mockResolvedValue(true);

      const result = await controller.sendVerificationCode(sendSmsDto);
      expect(result).toEqual(mockResponse);
      expect(mockAuthService.sendVerificationCode).toHaveBeenCalledWith(
        sendSmsDto.phone,
      );
    });

    it('should throw TooManyVerificationAttemptsException for too many attempts', async () => {
      const sendSmsDto = {
        phone: '13800138000',
      };

      mockAuthService.sendVerificationCode.mockRejectedValue(
        new TooManyVerificationAttemptsException(),
      );

      await expect(controller.sendVerificationCode(sendSmsDto)).rejects.toThrow(
        TooManyVerificationAttemptsException,
      );
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const verifyCodeDto = {
        phone: '13800138000',
        code: '123456',
      };

      const mockResponse = {
        message: '验证成功',
      };

      mockAuthService.verifyCode.mockResolvedValue(true);

      const result = await controller.verifyCode(verifyCodeDto);
      expect(result).toEqual(mockResponse);
      expect(mockAuthService.verifyCode).toHaveBeenCalledWith(
        verifyCodeDto.phone,
        verifyCodeDto.code,
      );
    });

    it('should throw VerificationCodeExpiredException for expired code', async () => {
      const verifyCodeDto = {
        phone: '13800138000',
        code: '123456',
      };

      mockAuthService.verifyCode.mockRejectedValue(
        new VerificationCodeExpiredException(),
      );

      await expect(controller.verifyCode(verifyCodeDto)).rejects.toThrow(
        VerificationCodeExpiredException,
      );
    });
  });
});
