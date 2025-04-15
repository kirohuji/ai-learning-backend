import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TtsRequestDto, TtsResponseDto } from './dto/tts.dto';
import {
  TtsServiceException,
  TtsApiException,
  TtsInvalidRequestException,
} from './exceptions/tts.exception';

// interface MinimaxTtsResponse {
//   audioUrl: string;
//   duration?: number;
// }

@Injectable()
export class TtsService {
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('minimax.apiKey');
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY is not configured');
    }
    this.apiKey = apiKey;
  }

  textToSpeech(request: TtsRequestDto): Promise<TtsResponseDto> {
    try {
      const { text } = request;

      if (!text) {
        throw new TtsInvalidRequestException('Text is required');
      }

      return Promise.resolve({
        audioUrl: this.apiKey,
        duration: 0,
      });
    } catch (error: unknown) {
      if (
        error instanceof TtsInvalidRequestException ||
        error instanceof TtsApiException
      ) {
        throw error;
      }
      throw new TtsServiceException('Failed to convert text to speech');
    }
  }
}
