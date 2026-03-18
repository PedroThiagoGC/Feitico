import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  message?: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        const apiResponse: ApiResponse = {
          success: statusCode >= 200 && statusCode < 300,
          statusCode,
          data,
          timestamp: new Date().toISOString(),
        };

        this.logger.debug(
          `${request.method} ${request.path} - ${statusCode} - ${duration}ms`,
        );

        return apiResponse;
      }),
    );
  }
}
