/**
 * Date formatting utilities for MatchaMap admin panels
 * 
 * Handles proper UTC timestamp conversion for database timestamps
 * that are stored in SQLite CURRENT_TIMESTAMP format (YYYY-MM-DD HH:MM:SS)
 */

import { COPY } from '../constants/copy'

/**
 * Formats a UTC timestamp from the database to local time
 * Handles SQLite's CURRENT_TIMESTAMP format (YYYY-MM-DD HH:MM:SS)
 * 
 * @param dateString - UTC timestamp from database
 * @param options - Intl.DateTimeFormatOptions for custom formatting
 * @returns Formatted date string in user's local timezone
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  // Ensure the date string is treated as UTC
  // SQLite returns: "2025-10-09 19:00:00" (no 'T', no 'Z')
  // Convert to ISO 8601 UTC format: "2025-10-09T19:00:00Z"
  const isoDate = dateString.replace(' ', 'T') + (dateString.endsWith('Z') ? '' : 'Z')
  const date = new Date(isoDate)
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }
  
  return date.toLocaleString('en-US', defaultOptions)
}

/**
 * Formats a date as a relative time (e.g., "2 hours ago", "Yesterday")
 * Falls back to formatDate() for older dates
 * 
 * @param dateString - UTC timestamp from database (can be null/undefined)
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return COPY.admin.userManagement.never
  
  const isoDate = dateString.replace(' ', 'T') + (dateString.endsWith('Z') ? '' : 'Z')
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return COPY.admin.dateTime.justNow
  if (diffMinutes < 60) return COPY.admin.dateTime.minutesAgo(diffMinutes)
  if (diffHours < 24) return COPY.admin.dateTime.hoursAgo(diffHours)
  if (diffDays === 0) return COPY.admin.userManagement.today
  if (diffDays === 1) return COPY.admin.userManagement.yesterday
  if (diffDays < 7) return COPY.admin.userManagement.daysAgo(diffDays)
  if (diffDays < 30) return COPY.admin.userManagement.weeksAgo(Math.floor(diffDays / 7))
  
  return formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Formats a date for CSV export with timezone information
 * 
 * @param dateString - UTC timestamp from database
 * @returns Formatted date string with timezone for CSV export
 */
export function formatDateForCSV(dateString: string): string {
  const isoDate = dateString.replace(' ', 'T') + (dateString.endsWith('Z') ? '' : 'Z')
  const date = new Date(isoDate)
  
  return date.toLocaleString('en-US', { 
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })
}