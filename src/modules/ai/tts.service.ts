import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TtsRequestDto, TtsResponseDto } from './dto/tts.dto';
import {
  MINIMAX_API_URL,
  MINIMAX_TTS_ENDPOINT,
  MINIMAX_TTS_VOICES,
  MINIMAX_TTS_LANGUAGES,
} from './constants/minimax.constants';
import {
  TtsServiceException,
  TtsApiException,
  TtsInvalidRequestException,
} from './exceptions/tts.exception';

interface MinimaxTtsResponse {
  audioUrl: string;
  duration?: number;
}

@Injectable()
export class TtsService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('minimax.apiKey');
    if (!apiKey) {
      throw new Error('MINIMAX_API_KEY is not configured');
    }
    this.apiKey = apiKey;
    this.apiUrl = MINIMAX_API_URL;
  }

  textToSpeech(request: TtsRequestDto): Promise<TtsResponseDto> {
    try {
      const { text } = request;

      if (!text) {
        throw new TtsInvalidRequestException('Text is required');
      }

      return Promise.resolve({
        audioUrl: 'response.audioUrl',
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
