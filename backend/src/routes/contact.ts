import { IRequest } from 'itty-router';
import { drizzle } from 'drizzle-orm/d1';
import { contactSubmissions } from '../../drizzle/schema';
import { Env } from '../types';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { safeValidate, contactSchema } from '../validators';
import { HTTP_STATUS } from '../constants';

export async function submitContact(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json?.();
    const validation = safeValidate(contactSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const { name, email, subject, message } = validation.data;
    const ip = request.headers.get('CF-Connecting-IP') ?? undefined;

    const db = drizzle(env.DB);
    await db.insert(contactSubmissions).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject,
      message: message.trim(),
      signupIp: ip,
    });

    return jsonResponse({ success: true }, HTTP_STATUS.CREATED, request as Request, env);
  } catch (error) {
    console.error('Contact submission error:', error);
    return errorResponse('Failed to send message', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
