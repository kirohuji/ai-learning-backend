import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@/common/response.interface';
import { Response, Request } from 'express';

@Injectable()
export class SuccessResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();
    const method = request.method;

    // 根据请求方法设置状态码
    let statusCode = response.statusCode;
    if (statusCode === 200) {
      switch (method) {
        case 'POST':
        case 'PUT':
        case 'PATCH':
          statusCode = 200; // 更新成功
          break;
        case 'DELETE':
          statusCode = 204; // 删除成功
          break;
        case 'GET':
        default:
          statusCode = 200; // 获取成功
          break;
      }
    }

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        code: `HTTP_${statusCode}`,
        data,
      })),
    );
  }
}
