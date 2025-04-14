import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Prisma } from '@prisma/client';

export class UpdateConversationDto {
  @ApiProperty({ description: '对话标题', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: '对话上下文', required: false })
  @IsOptional()
  context?: Prisma.InputJsonValue;
}
