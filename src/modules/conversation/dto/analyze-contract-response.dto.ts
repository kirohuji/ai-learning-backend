import { ApiProperty } from '@nestjs/swagger';

export class RiskPointDto {
  @ApiProperty({
    description: '风险点标题',
    example: '合同期限不明确',
  })
  title: string;

  @ApiProperty({
    description: '风险类型',
    enum: ['高', '注意', '合规'],
    example: '高',
  })
  type: '高' | '注意' | '合规';

  @ApiProperty({
    description: '原文段落',
    example: '合同期限：自签订之日起生效',
  })
  originalText: string;

  @ApiProperty({
    description: '风险分析',
    example: '未明确合同的具体期限，可能导致合同履行时间不明确',
  })
  analysis: string;

  @ApiProperty({
    description: '修改建议',
    example: '建议明确合同的具体期限，如"自签订之日起至2025年12月31日止"',
  })
  advice: string;
}

export class DynamicFieldDto {
  @ApiProperty({
    description: '字段名称',
    example: '合同编码',
  })
  name: string;

  @ApiProperty({
    description: '字段值',
    example: 'HT20240315001',
  })
  value: string;

  @ApiProperty({
    description: '字段类型',
    enum: ['string', 'number', 'date', 'boolean'],
    example: 'string',
  })
  type: 'string' | 'number' | 'date' | 'boolean';

  @ApiProperty({
    description: '字段描述',
    example: '合同的唯一编号',
    required: false,
  })
  description?: string;
}

export class AnalyzeContractResponseDto {
  @ApiProperty({
    description: '合同标题',
    example: '房屋租赁合同',
  })
  title: string;

  @ApiProperty({
    description: '合同描述',
    example: '本合同为房屋租赁合同，约定了租赁期限、租金、押金等条款',
  })
  description: string;

  @ApiProperty({
    description: '合同金额',
    example: '5000元/月',
  })
  amount: string;

  @ApiProperty({
    description: '风险点分析列表',
    type: [RiskPointDto],
  })
  riskPoints: RiskPointDto[];

  @ApiProperty({
    description: '动态字段列表',
    type: [DynamicFieldDto],
    example: [
      {
        name: '合同编码',
        value: 'HT20240315001',
        type: 'string',
        description: '合同的唯一编号',
      },
      {
        name: '签订日期',
        value: '2024-03-15',
        type: 'date',
        description: '合同签订的具体日期',
      },
      {
        name: '合同版本',
        value: '1.0',
        type: 'string',
        description: '合同版本号',
      },
    ],
  })
  dynamicFields: DynamicFieldDto[];
}
