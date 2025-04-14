import { Module } from '@nestjs/common';
import { TtsService } from './tts.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [TtsService],
  exports: [TtsService],
})
export class AiModule {}
