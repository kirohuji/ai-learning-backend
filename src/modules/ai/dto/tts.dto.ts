import { IsString, IsEnum, IsOptional } from 'class-validator';
import {
  MINIMAX_TTS_VOICES,
  MINIMAX_TTS_LANGUAGES,
} from '../constants/minimax.constants';

export class TtsRequestDto {
  @IsString()
  text: string;

  @IsEnum(MINIMAX_TTS_VOICES)
  @IsOptional()
  voice?: keyof typeof MINIMAX_TTS_VOICES;

  @IsEnum(MINIMAX_TTS_LANGUAGES)
  @IsOptional()
  language?: keyof typeof MINIMAX_TTS_LANGUAGES;
}

export class TtsResponseDto {
  audioUrl: string;
  duration: number;
}
