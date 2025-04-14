import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { ConversationException } from './conversation.exception';
import { ApiResponse } from '@/common/response.interface';

@Catch(ConversationException)
export class ConversationExceptionFilter implements ExceptionFilter {
  catch(exception: ConversationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ApiResponse<null>;
    response.status(status).json(exceptionResponse);
  }
}
