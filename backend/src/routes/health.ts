import { IRequest } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, serverErrorResponse } from '../utils/response';
import { HTTP_STATUS, CACHE_CONSTANTS, APP_CONSTANTS } from '../constants';

export async function handleHealth(request: IRequest, env: Env): Promise<Response> {
  try {
    // Test database connection
    const result = await env.DB.prepare('SELECT 1').first();
    const isDbConnected = result !== null;

    const healthData = {
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      version: APP_CONSTANTS.VERSION,
    };

    const status = isDbConnected ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    return jsonResponse(healthData, status, request as Request, env, CACHE_CONSTANTS.NO_STORE);
  } catch (error) {
    return serverErrorResponse(request as Request, env);
  }
}
