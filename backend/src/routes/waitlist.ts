import { IRequest } from 'itty-router';
import { eq } from 'drizzle-orm';
import { Env } from '../types';
import { jsonResponse, errorResponse, badRequestResponse } from '../utils/response';
import { drizzle } from 'drizzle-orm/d1';
import { waitlist } from '../../drizzle/schema';
import { safeValidate, waitlistSchema } from '../validators';
import { HTTP_STATUS } from '../constants';

export async function joinWaitlist(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json?.();

    // Validate input using Zod schema
    const validation = safeValidate(waitlistSchema, body);
    if (!validation.success) {
      return badRequestResponse(validation.error, request as Request, env);
    }

    const { email, referralSource } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    const db = drizzle(env.DB);

    // Check if email already exists
    const existingEntry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, normalizedEmail))
      .get();

    if (existingEntry) {
      // Already in waitlist - return success anyway (don't reveal this info)
      return jsonResponse(
        {
          success: true,
          message: 'You\'re on the waitlist!'
        },
        HTTP_STATUS.OK,
        request as Request,
        env
      );
    }

    // Insert new waitlist entry
    await db.insert(waitlist).values({
      email: normalizedEmail,
      referralSource: referralSource || null,
    });

    return jsonResponse(
      {
        success: true,
        message: 'You\'re on the waitlist!'
      },
      HTTP_STATUS.CREATED,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return errorResponse('Failed to join waitlist', HTTP_STATUS.INTERNAL_SERVER_ERROR, request as Request, env);
  }
}
