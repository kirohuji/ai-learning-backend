import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { FileException } from './file.exception';
import { ApiResponse } from '@/common/response.interface';

@Catch(FileException)
export class FileExceptionFilter implements ExceptionFilter {
  catch(exception: FileException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ApiResponse<null>;
    response.status(status).json(exceptionResponse);
  }
}
