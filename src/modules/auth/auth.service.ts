import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/common/prisma/prisma.service';
import { SmsService } from './sms.service';
import { User, Role } from '@prisma/client';
import * as crypto from 'crypto';
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserAlreadyExistsException,
  InvalidVerificationCodeException,
  VerificationCodeExpiredException,
  TooManyVerificationAttemptsException,
  InvalidTokenException,
  TokenExpiredException,
  VerificationCodeSendFailedException,
} from './exceptions';
import { REFRESH_TOKEN_CONFIG } from './constants/jwt.constants';

type UserWithRoles = User & {
  roles: Role[];
};

interface JwtPayload {
  id: string;
  phone: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  async validateUser(
    phone: string,
    password: string,
  ): Promise<Omit<UserWithRoles, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { roles: true },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user?.password) {
      const [salt, storedHash] = user.password.split(':');
      const hash = crypto
        .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
        .toString('hex');

      if (hash === storedHash) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...result } = user;
        return result;
      }
    }
    throw new InvalidCredentialsException();
  }

  async generateTokens(user: Omit<UserWithRoles, 'password'>) {
    const payload = {
      id: user.id,
      phone: user.phone,
      roles: user.roles.map((role) => role.name),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: REFRESH_TOKEN_CONFIG.secret,
      expiresIn: REFRESH_TOKEN_CONFIG.signOptions.expiresIn,
    });
    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userId: user.id,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        avatar: user.avatar,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.roles,
      },
    };
  }

  async login(user: Omit<UserWithRoles, 'password'>) {
    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: REFRESH_TOKEN_CONFIG.secret,
      });

      // Check if token exists in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { roles: true } } },
      });

      if (!storedToken) {
        throw new InvalidTokenException();
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await this.prisma.refreshToken.delete({
          where: { id: storedToken.id },
        });
        throw new TokenExpiredException();
      }

      // Delete old refresh token
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      const { user } = storedToken;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return this.generateTokens(userWithoutPassword);
    } catch (error) {
      if (error instanceof TokenExpiredException) {
        throw error;
      }
      throw new InvalidTokenException();
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // 删除 refresh token
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          token: refreshToken,
          userId: userId,
        },
      });
    }
  }

  async loginWithSMS(phone: string, code: string) {
    const isValid = await this.verifyCode(phone, code);
    if (!isValid) {
      throw new InvalidVerificationCodeException();
    }

    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { roles: true },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return this.generateTokens(userWithoutPassword);
  }

  async register(phone: string, password: string, code: string, name?: string) {
    const isValid = await this.verifyCode(phone, code);
    if (!isValid) {
      throw new InvalidVerificationCodeException();
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
      include: { roles: true },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');

    const newUser = await this.prisma.user.create({
      data: {
        phone,
        password: `${salt}:${hashedPassword}`,
        name,
        roles: {
          connect: [{ name: 'user' }], // Default role
        },
      },
      include: { roles: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;
    return this.generateTokens(userWithoutPassword);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async sendVerificationCode(phone: string): Promise<string> {
    // Check if there are too many attempts
    const recentAttempts = await this.prisma.verificationCode.count({
      where: {
        phone,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentAttempts >= 60) {
      throw new TooManyVerificationAttemptsException();
    }

    // Generate a 6-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Send the verification code via SMS
    // const isSend = await this.smsService.sendVerificationCode(phone, code);
    const isSend = true;
    if (!isSend) {
      throw new VerificationCodeSendFailedException();
    } else {
      // Store the verification code in the database with expiration time
      await this.prisma.verificationCode.create({
        data: {
          phone,
          code,
          type: 1, // 1: login
          status: 1, // 1: unused
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiration
        },
      });
      return code;
    }
  }

  async verifyCode(phone: string, code: string): Promise<boolean> {
    const verification = await this.prisma.verificationCode.findFirst({
      where: {
        phone,
        code,
        type: 1,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verification) {
      throw new VerificationCodeExpiredException();
    }

    // Mark the code as used
    await this.prisma.verificationCode.update({
      where: { id: verification.id },
      data: { status: 0 }, // 0: used
    });

    return true;
  }

  async createUser(phone: string): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    return this.prisma.user.create({
      data: {
        phone,
      },
    });
  }

  async findUserByPhone(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: {
        roles: true,
      },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async updateUserPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto
      .pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512')
      .toString('hex');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: `${salt}:${hashedPassword}`,
      },
    });

    return { message: 'Password updated successfully' };
  }

  async updateUserProfile(userId: string, data: { name?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        roles: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async resetPasswordWithVerification(
    phone: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    // 验证验证码
    const isValid = await this.verifyCode(phone, code);
    if (!isValid) {
      throw new InvalidVerificationCodeException();
    }

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    // 更新密码
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto
      .pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512')
      .toString('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: `${salt}:${hashedPassword}` },
    });
  }
}
