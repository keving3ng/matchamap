import { SignJWT, jwtVerify } from 'jose';
import { AUTH_CONSTANTS } from '../constants';

/**
 * Authentication utilities for password hashing and JWT management
 *
 * Uses Web Crypto API for password hashing (works in Cloudflare Workers)
 * Uses jose library for JWT signing/verification (Cloudflare Workers compatible)
 */

// Password hashing using PBKDF2 (Web Crypto API)
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const HASH_ALGORITHM = 'SHA-256';
const SALT_LENGTH = 16;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_MAX_LENGTH = 255;
const USERNAME_MAX_LENGTH = 30;
const SESSION_TOKEN_LENGTH = 32;

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Encode the password
  const passwordBuffer = new TextEncoder().encode(password);

  // Import the password as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Decode the combined salt+hash
    const combined = Uint8Array.from(atob(hashedPassword), c => c.charCodeAt(0));

    // Extract salt (first 16 bytes) and hash
    const salt = combined.slice(0, SALT_LENGTH);
    const originalHash = combined.slice(SALT_LENGTH);

    // Hash the input password with the same salt
    const passwordBuffer = new TextEncoder().encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: HASH_ALGORITHM,
      },
      keyMaterial,
      KEY_LENGTH * 8
    );

    const newHash = new Uint8Array(hashBuffer);

    // Compare hashes (constant time comparison)
    if (newHash.length !== originalHash.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < newHash.length; i++) {
      mismatch |= newHash[i] ^ originalHash[i];
    }

    return mismatch === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Password validation rules
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long` };
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: `Password must be less than ${PASSWORD_MAX_LENGTH} characters` };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }

  return { valid: true };
}

/**
 * Email validation
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= EMAIL_MAX_LENGTH;
}

/**
 * Username validation
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < AUTH_CONSTANTS.USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${AUTH_CONSTANTS.USERNAME_MIN_LENGTH} characters long` };
  }

  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username must be less than ${USERNAME_MAX_LENGTH} characters` };
  }

  // Allow alphanumeric, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  return { valid: true };
}

// JWT token management
export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: JWTPayload, secret: string, expiresIn: string = '1h'): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);

  return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jwtVerify(token, secretKey);

    return {
      userId: payload.userId as number,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as 'admin' | 'user',
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Generate a secure random token for sessions
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(SESSION_TOKEN_LENGTH);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
