import { IRequest } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, serverErrorResponse } from '../utils/response';

export async function handleHealth(request: IRequest, env: Env): Promise<Response> {
  try {
    // Test database connection
    const result = await env.DB.prepare('SELECT 1').first();
    const isDbConnected = result !== null;

    const healthData = {
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    const status = isDbConnected ? 200 : 503;
    return jsonResponse(healthData, status, request as Request, env, 'no-store');
  } catch (error) {
    return serverErrorResponse(request as Request, env);
  }
}
