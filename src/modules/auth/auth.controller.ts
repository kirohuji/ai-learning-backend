import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Put,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { CurrentUser } from '@/decorator/user.decorator';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import {
  LoginDto,
  LoginWithSMSDto,
  RegisterDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  SendSmsDto,
  VerifyCodeDto,
  TokenResponseDto,
  ProfileResponseDto,
  MessageResponseDto,
  VerificationResponseDto,
  ForgotPasswordDto,
} from './dto';
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserAlreadyExistsException,
  InvalidVerificationCodeException,
  VerificationCodeExpiredException,
  TooManyVerificationAttemptsException,
  AuthExceptionFilter,
} from './exceptions';
import { Request, Response } from 'express';
import { JWT_CONSTANTS, JWT_COOKIE_OPTIONS } from './constants/jwt.constants';

@ApiTags('用户管理')
@Controller()
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 201, description: '登录成功', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: '登录失败' })
  @Post('auth/tokens')
  async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
    try {
      const user = await this.authService.validateUser(
        loginDto.phone,
        loginDto.password,
      );
      if (!user) {
        throw new InvalidCredentialsException();
      }
      return this.authService.login(user);
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }
      throw new InvalidCredentialsException();
    }
  }

  @ApiOperation({ summary: '短信验证码登录' })
  @ApiResponse({ status: 201, description: '登录成功', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: '登录失败' })
  @Post('auth/tokens/sms')
  async loginWithSMS(
    @Body() loginWithSMSDto: LoginWithSMSDto,
  ): Promise<TokenResponseDto> {
    try {
      return await this.authService.loginWithSMS(
        loginWithSMSDto.phone,
        loginWithSMSDto.code,
      );
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new UserNotFoundException();
      }
      throw new InvalidVerificationCodeException();
    }
  }

  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: '注册失败' })
  @Post('users')
  async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
    try {
      return await this.authService.register(
        registerDto.phone,
        registerDto.password,
        registerDto.code,
        registerDto.name,
      );
    } catch (error) {
      if (
        error instanceof InvalidVerificationCodeException ||
        error instanceof UserAlreadyExistsException
      ) {
        throw error;
      }
      throw new InvalidVerificationCodeException();
    }
  }

  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('users/me')
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    try {
      return await this.authService.getProfile(user.id);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new UserNotFoundException();
    }
  }

  @ApiOperation({ summary: '更新用户信息' })
  @ApiResponse({
    status: 200,
    description: '信息更新成功',
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 404, description: '用户不存在' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Put('users/me')
  async updateUserProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    try {
      const updatedUser = await this.authService.updateUserProfile(
        user.id,
        updateProfileDto,
      );
      return updatedUser as ProfileResponseDto;
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw error;
      }
      throw new UserNotFoundException();
    }
  }

  @ApiOperation({ summary: '发送短信验证码' })
  @ApiResponse({
    status: 201,
    description: '验证码发送成功',
    type: VerificationResponseDto,
  })
  @ApiResponse({ status: 429, description: '请求过于频繁' })
  @Post('verification-codes')
  async sendVerificationCode(
    @Body() sendSmsDto: SendSmsDto,
  ): Promise<VerificationResponseDto> {
    try {
      const code = await this.authService.sendVerificationCode(
        sendSmsDto.phone,
      );
      return {
        phone: sendSmsDto.phone,
        verificationCode: code,
      };
    } catch (error) {
      if (error instanceof TooManyVerificationAttemptsException) {
        throw error;
      }
      throw new TooManyVerificationAttemptsException();
    }
  }

  @ApiOperation({ summary: '验证短信验证码' })
  @ApiResponse({
    status: 200,
    description: '验证成功',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: '验证码错误' })
  @Post('verification-codes/verify')
  async verifyCode(
    @Body() verifyCodeDto: VerifyCodeDto,
  ): Promise<MessageResponseDto> {
    try {
      const isValid = await this.authService.verifyCode(
        verifyCodeDto.phone,
        verifyCodeDto.code,
      );
      if (!isValid) {
        throw new InvalidVerificationCodeException();
      }
      return { message: '验证成功' };
    } catch (error) {
      if (
        error instanceof InvalidVerificationCodeException ||
        error instanceof VerificationCodeExpiredException
      ) {
        throw error;
      }
      throw new InvalidVerificationCodeException();
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({ status: 200, type: TokenResponseDto })
  @ApiResponse({ status: 401, description: '无效的刷新令牌' })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    const refreshToken = (req.cookies as { [key: string]: string })[
      JWT_CONSTANTS.REFRESH_TOKEN_COOKIE
    ];

    await this.authService.logout(user.id, refreshToken);

    // 清除 refresh token cookie
    res.clearCookie(JWT_CONSTANTS.REFRESH_TOKEN_COOKIE, JWT_COOKIE_OPTIONS);

    return { message: '退出登录成功' };
  }

  @ApiOperation({ summary: '忘记密码' })
  @ApiResponse({
    status: 200,
    description: '密码重置成功',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 400, description: '验证码错误或用户不存在' })
  @Post('reset-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    try {
      await this.authService.resetPasswordWithVerification(
        forgotPasswordDto.phone,
        forgotPasswordDto.code,
        forgotPasswordDto.newPassword,
      );
      return { message: '密码重置成功' };
    } catch (error) {
      if (
        error instanceof InvalidVerificationCodeException ||
        error instanceof UserNotFoundException
      ) {
        throw error;
      }
      throw new InvalidVerificationCodeException();
    }
  }
}
