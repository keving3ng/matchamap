import { IRequest } from 'itty-router';
import { eq, desc, count, gte } from 'drizzle-orm';
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

// GET /api/admin/waitlist - Get all waitlist entries (admin only)
export async function getWaitlistAdmin(request: IRequest, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const db = drizzle(env.DB);

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(waitlist)
      .get();
    
    const total = totalResult?.count || 0;

    // Get waitlist entries with pagination and sorting
    let query = db.select().from(waitlist);

    // Apply sorting
    if (sortBy === 'email') {
      // @ts-expect-error - Drizzle ORM query builder type narrowing issue
      query = sortOrder === 'desc'
        ? query.orderBy(desc(waitlist.email))
        : query.orderBy(waitlist.email);
    } else {
      // Default to created_at
      // @ts-expect-error - Drizzle ORM query builder type narrowing issue
      query = sortOrder === 'desc'
        ? query.orderBy(desc(waitlist.createdAt))
        : query.orderBy(waitlist.createdAt);
    }

    const results = await query
      .limit(limit + 1)
      .offset(offset);

    const hasMore = results.length > limit;
    const entries = hasMore ? results.slice(0, limit) : results;

    // Calculate analytics
    const now = new Date();
    
    // Helper function to format dates for SQLite (YYYY-MM-DD HH:MM:SS)
    const toSQLiteDateTime = (date: Date): string => {
      return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    };
    
    // Daily signups: last 24 hours
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dailySignupsResult = await db
      .select({ count: count() })
      .from(waitlist)
      .where(gte(waitlist.createdAt, toSQLiteDateTime(oneDayAgo)))
      .get();

    // Weekly signups: last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklySignupsResult = await db
      .select({ count: count() })
      .from(waitlist)
      .where(gte(waitlist.createdAt, toSQLiteDateTime(sevenDaysAgo)))
      .get();

    const analytics = {
      totalSignups: total,
      dailySignups: dailySignupsResult?.count || 0,
      weeklySignups: weeklySignupsResult?.count || 0,
      conversionRate: total > 0 ? Math.round((entries.filter(e => e.converted).length / total) * 100) : 0
    };

    return jsonResponse(
      { 
        waitlist: entries, 
        total, 
        hasMore,
        analytics 
      },
      200,
      request as Request,
      env,
      'no-store' // Don't cache admin data
    );
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return errorResponse('Failed to fetch waitlist', 500, request as Request, env);
  }
}
