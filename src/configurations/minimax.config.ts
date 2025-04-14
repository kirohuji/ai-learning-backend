import { registerAs } from '@nestjs/config';

export default registerAs('minimax', () => ({
  apiKey: process.env.MINIMAX_API_KEY,
}));
