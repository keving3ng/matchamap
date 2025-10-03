import { IRequest } from 'itty-router';
import { Env } from '../types';
import { errorResponse } from '../utils/response';

/**
 * HTTPS enforcement middleware
 *
 * Ensures all requests in production are made over HTTPS.
 * Cloudflare Workers run at the edge and handle TLS termination,
 * so we check the X-Forwarded-Proto header.
 */

export function requireHTTPS() {
  return async (request: IRequest, env: Env): Promise<Response | void> => {
    // Only enforce HTTPS in production
    if (env.ENVIRONMENT !== 'production') {
      return undefined; // Allow in development
    }

    const url = new URL(request.url);
    const proto = request.headers.get('X-Forwarded-Proto') || url.protocol.replace(':', '');

    // Check if request is over HTTPS
    if (proto !== 'https') {
      return errorResponse(
        'HTTPS required. Please use https:// instead of http://',
        403,
        request as Request,
        env
      );
    }

    return undefined; // Allow request
  };
}

/**
 * Redirect HTTP to HTTPS (alternative approach)
 *
 * Instead of blocking HTTP requests, redirect them to HTTPS.
 * Use this if you want a more user-friendly experience.
 */
export function redirectToHTTPS() {
  return async (request: IRequest, env: Env): Promise<Response | void> => {
    // Only redirect in production
    if (env.ENVIRONMENT !== 'production') {
      return undefined;
    }

    const url = new URL(request.url);
    const proto = request.headers.get('X-Forwarded-Proto') || url.protocol.replace(':', '');

    if (proto !== 'https') {
      // Construct HTTPS URL
      const httpsUrl = new URL(request.url);
      httpsUrl.protocol = 'https:';

      return Response.redirect(httpsUrl.toString(), 301); // Permanent redirect
    }

    return undefined;
  };
}
