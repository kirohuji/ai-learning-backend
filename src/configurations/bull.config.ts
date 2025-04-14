import { ConfigService } from '@nestjs/config';
import { QueueOptions } from 'bullmq';

export const getBullConfig = (configService: ConfigService): QueueOptions => {
  return {
    connection: {
      url: configService.get('REDIS_URL'),
    },
    prefix: configService.get('BULL_QUEUE_PREFIX'),
    defaultJobOptions: {
      attempts: configService.get('BULL_QUEUE_ATTEMPTS'),
      backoff: {
        type: 'exponential',
        delay: configService.get('BULL_QUEUE_BACKOFF_DELAY'),
      },
      removeOnComplete: configService.get('BULL_QUEUE_REMOVE_ON_COMPLETE'),
    },
  };
};

// 定义所有队列名称
export const QUEUE_NAMES = {
  CONTRACT_ANALYSIS: 'contract-analysis',
} as const;

// 队列名称类型
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
