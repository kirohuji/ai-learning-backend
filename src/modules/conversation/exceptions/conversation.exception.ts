import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@/common/response.interface';

export class ConversationException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    errorCode: string,
  ) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: `HTTP_${status}`,
        message,
        errorCode,
        details: {
          timestamp: new Date().toISOString(),
        },
      },
    };
    super(response, status);
  }
}
