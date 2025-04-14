import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { getBullConfig } from './configurations/bull.config';
import { AuthModule } from './modules/auth/auth.module';
import { ConversationModule } from './modules/conversation/conversation.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { FileModule } from './modules/file/file.module';
import { AiModule } from './modules/ai/ai.module';
import configurations from './configurations';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        getBullConfig(configService),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    ConversationModule,
    FileModule,
    AiModule,
  ],
})
export class AppModule {}
