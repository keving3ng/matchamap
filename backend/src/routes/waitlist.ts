import { IRequest } from 'itty-router';
import { eq } from 'drizzle-orm';
import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { drizzle } from 'drizzle-orm/d1';
import { waitlist } from '../../drizzle/schema';

export async function joinWaitlist(request: IRequest, env: Env): Promise<Response> {
  try {
    const body = await request.json?.() as { email?: string; referralSource?: string };

    if (!body || !body.email) {
      return errorResponse('Email is required', 400, request as Request, env);
    }

    const email = body.email.toLowerCase().trim();

    // Basic email validation
    if (!email.includes('@') || email.length < 5) {
      return errorResponse('Invalid email address', 400, request as Request, env);
    }

    const db = drizzle(env.DB);

    // Check if email already exists
    const existingEntry = await db
      .select()
      .from(waitlist)
      .where(eq(waitlist.email, email))
      .get();

    if (existingEntry) {
      // Already in waitlist - return success anyway (don't reveal this info)
      return jsonResponse(
        {
          success: true,
          message: 'You\'re on the waitlist!'
        },
        200,
        request as Request,
        env
      );
    }

    // Insert new waitlist entry
    await db.insert(waitlist).values({
      email,
      referralSource: body.referralSource || null,
    });

    return jsonResponse(
      {
        success: true,
        message: 'You\'re on the waitlist!'
      },
      201,
      request as Request,
      env
    );
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    return errorResponse('Failed to join waitlist', 500, request as Request, env);
  }
}
