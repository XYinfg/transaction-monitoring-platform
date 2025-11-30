import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getInfo() {
    return {
      name: 'FinTrace API',
      version: '1.0.0',
      description: 'Transaction Monitoring & Insights Platform',
      documentation: '/api',
    };
  }
}
