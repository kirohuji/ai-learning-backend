import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsPhoneNumber('CN', { message: '请输入有效的手机号码' })
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @ApiProperty({ description: '密码' })
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

export class LoginWithSMSDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsPhoneNumber('CN', { message: '请输入有效的手机号码' })
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @ApiProperty({ description: '短信验证码' })
  @IsString({ message: '验证码必须是字符串' })
  @IsNotEmpty({ message: '验证码不能为空' })
  code: string;
}
