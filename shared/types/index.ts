/**
 * Shared TypeScript types for MatchaMap
 *
 * These types are used across both frontend and backend to ensure
 * type safety and consistency in the API contract.
 */

// Cafe Types
export interface Cafe {
  id: number;
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  website?: string;
  primaryScore: number;
  secondaryScore: number;
  overallRating: number;
  reviewSummary: string;
  detailedReview: string;
  photos: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CafeWithDistance extends Cafe {
  distance?: number; // Distance in kilometers from user's location
}

// Feed/News Types
export interface FeedItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage?: string;
  publishedAt: string;
  tags: string[];
}

// Event Types
export interface Event {
  id: number;
  title: string;
  description: string;
  cafeId: number;
  eventDate: string;
  eventUrl?: string;
  createdAt: string;
}

// Analytics Types
export type CafeStat = 'view' | 'directions' | 'passport' | 'instagram' | 'tiktok';

export interface CafeStats {
  cafeId: number;
  views: number;
  directions: number;
  passportMarks: number;
  instagramClicks: number;
  tiktokClicks: number;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Admin Types
export interface CafeFormData extends Omit<Cafe, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number;
}

export interface FeedItemFormData extends Omit<FeedItem, 'id' | 'publishedAt'> {
  id?: number;
}

// Auth Types
export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role?: UserRole;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface AuthError {
  error: string;
}
