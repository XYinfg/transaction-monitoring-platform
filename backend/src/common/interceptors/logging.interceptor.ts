import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const requestId = uuidv4();

    // Attach request ID for tracing
    request.id = requestId;

    const now = Date.now();

    this.logger.log({
      type: 'REQUEST',
      requestId,
      method,
      url,
      body: this.sanitizeBody(body),
      userAgent: headers['user-agent'],
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          this.logger.log({
            type: 'RESPONSE',
            requestId,
            method,
            url,
            statusCode: context.switchToHttp().getResponse().statusCode,
            responseTime: `${responseTime}ms`,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error({
            type: 'ERROR',
            requestId,
            method,
            url,
            error: error.message,
            responseTime: `${responseTime}ms`,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
