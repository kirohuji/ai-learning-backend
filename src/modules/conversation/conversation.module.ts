import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { ConversationExceptionFilter } from './exceptions/conversation-exception.filter';

@Module({
  imports: [PrismaModule.forRoot({ isGlobal: true })],
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ChatService,
    {
      provide: 'APP_FILTER',
      useClass: ConversationExceptionFilter,
    },
  ],
  exports: [ConversationService, ChatService],
})
export class ConversationModule {}
