import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { TtsService } from './tts.service';
import { TtsRequestDto, TtsResponseDto } from './dto/tts.dto';

@ApiTags('AI服务')
@Controller('tts')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly ttsService: TtsService) {}

  @Post()
  @ApiOperation({ summary: '文本转语音' })
  @ApiResponse({
    status: 201,
    description: '转换成功',
    type: TtsResponseDto,
  })
  async textToSpeech(@Body() request: TtsRequestDto): Promise<TtsResponseDto> {
    return this.ttsService.textToSpeech(request);
  }
}
