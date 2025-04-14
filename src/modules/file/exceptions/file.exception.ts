import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@/common/response.interface';

export class FileException extends HttpException {
  constructor(message: string, status: HttpStatus, errorCode: string) {
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
