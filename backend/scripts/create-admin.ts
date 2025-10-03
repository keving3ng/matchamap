/**
 * Script to create an initial admin user
 * Usage: npm run create-admin
 */

import { pbkdf2, randomBytes } from 'crypto';
import { createInterface } from 'readline';

// Password hashing using Node.js crypto (PBKDF2)
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const HASH_ALGORITHM = 'sha256';

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16);

    pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);

      // Combine salt and hash
      const combined = Buffer.concat([salt, derivedKey]);
      resolve(combined.toString('base64'));
    });
  });
}

async function main() {
  console.log('Creating admin user...\n');

  // Check if command line arguments provided
  const args = process.argv.slice(2);
  let email: string;
  let username: string;
  let password: string;

  if (args.length === 3) {
    // Use command line arguments
    [email, username, password] = args;
    console.log(`Using provided credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${'*'.repeat(password.length)}\n`);
  } else if (args.length === 0) {
    // Interactive mode
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query: string): Promise<string> => {
      return new Promise(resolve => {
        readline.question(query, resolve);
      });
    };

    email = await question('Admin email: ');
    username = await question('Admin username: ');
    password = await question('Admin password (min 8 chars): ');
    readline.close();
  } else {
    console.error('Usage: npm run create-admin [email] [username] [password]');
    console.error('Or run without arguments for interactive mode');
    process.exit(1);
  }

  try {

    // Validate input
    if (!email || !username || !password) {
      console.error('\nError: All fields are required');
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\nError: Password must be at least 8 characters');
      process.exit(1);
    }

    // Hash password
    console.log('\nHashing password...');
    const passwordHash = await hashPassword(password);

    // Generate SQL
    const sql = `
INSERT INTO users (email, username, password_hash, role, created_at, updated_at)
VALUES (
  '${email.toLowerCase()}',
  '${username}',
  '${passwordHash}',
  'admin',
  datetime('now'),
  datetime('now')
);
`;

    console.log('\n=== Run this SQL command in your database ===\n');
    console.log(sql);
    console.log('\n=== For local development ===');
    console.log('npx wrangler d1 execute matchamap-db --local --command "' + sql.replace(/\n/g, ' ').trim() + '"');
    console.log('\n=== For production ===');
    console.log('npx wrangler d1 execute matchamap-db --remote --command "' + sql.replace(/\n/g, ' ').trim() + '"');
    console.log('\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
