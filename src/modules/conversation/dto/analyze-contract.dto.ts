import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AnalyzeContractDto {
  @ApiProperty({
    description: '合同内容',
    example: '本合同由甲方和乙方签订...',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: '合同类型',
    required: false,
    example: '劳动合同',
    default: '通用',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: '合同视角',
    required: false,
    example: '律师',
    default: '律师',
  })
  @IsString()
  @IsOptional()
  reviewPerspective?: string;

  @ApiProperty({
    description: '合同要求',
    required: false,
    example: '请重点关注违约责任条款',
    default: '请分析合同内容，并提取以下信息：',
  })
  @IsString()
  @IsOptional()
  reviewRequirements?: string;
}
