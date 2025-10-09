import { getDb, adminAuditLog } from '../db';
import { Env } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export interface AuditLogParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: 'cafe' | 'drink' | 'event' | 'feed_item' | 'user' | 'user_role';
  resourceId: number;
  changesSummary?: string;
  beforeState?: any;
  afterState?: any;
}

/**
 * Log an admin action to the audit log
 * This function is fire-and-forget - it won't fail the request if logging fails
 */
export async function logAdminAction(
  request: AuthenticatedRequest,
  env: Env,
  params: AuditLogParams
): Promise<void> {
  try {
    const db = getDb(env.DB);
    
    // Extract IP and user agent from request
    const ipAddress = request.headers.get('CF-Connecting-IP') || 
                      request.headers.get('X-Forwarded-For') || 
                      'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    
    await db.insert(adminAuditLog).values({
      adminUserId: request.user!.userId,
      adminUsername: request.user!.username,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      changesSummary: params.changesSummary || null,
      beforeState: params.beforeState ? JSON.stringify(params.beforeState) : null,
      afterState: params.afterState ? JSON.stringify(params.afterState) : null,
      ipAddress,
      userAgent,
    }).run();
  } catch (error) {
    // Don't fail the request if audit logging fails - just log the error
    console.error('Failed to write audit log:', error);
  }
}

/**
 * Generate a human-readable summary of changes
 */
export function generateChangesSummary(
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resourceType: string,
  resourceName?: string,
  beforeState?: any,
  afterState?: any
): string {
  const resourceDisplay = resourceName || `${resourceType} #${afterState?.id || beforeState?.id}`;
  
  switch (action) {
    case 'CREATE':
      return `Created ${resourceType} "${resourceDisplay}"`;
    
    case 'DELETE':
      return `Deleted ${resourceType} "${resourceDisplay}"`;
    
    case 'UPDATE':
      if (beforeState && afterState) {
        // Try to identify key changes
        const keyChanges: string[] = [];
        
        // Common fields to highlight in change summaries
        const importantFields = ['name', 'title', 'email', 'username', 'role', 'score', 'published'];
        
        for (const field of importantFields) {
          if (beforeState[field] !== afterState[field]) {
            keyChanges.push(`${field} from "${beforeState[field]}" to "${afterState[field]}"`);
          }
        }
        
        if (keyChanges.length > 0) {
          return `Updated ${resourceType} "${resourceDisplay}": ${keyChanges.join(', ')}`;
        }
      }
      
      return `Updated ${resourceType} "${resourceDisplay}"`;
    
    default:
      return `${action} ${resourceType} "${resourceDisplay}"`;
  }
}