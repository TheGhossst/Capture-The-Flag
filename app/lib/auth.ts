import { hash, compare } from 'bcryptjs';
import { getDb } from './db';

export async function hashPassword(password: string) {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await compare(password, hashedPassword);
}

export async function createUser(username: string, password: string) {
  const db = await getDb();
  const hashedPassword = await hashPassword(password);
  
  try {
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to create user:', error);
    return { success: false, error: 'Username already exists' };
  }
}

export async function validateUser(username: string, password: string) {
  const db = await getDb();
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  
  if (!user) {
    return null;
  }
  
  const isValid = await compare(password, user.password);
  if (!isValid) {
    return null;
  }
  
  return { id: user.id, username: user.username, points: user.points };
}

export async function getUserFromSession(sessionData: string | undefined) {
  if (!sessionData) return null;
  
  try {
    // Parse the session data directly since it's already a JSON string
    const user = JSON.parse(sessionData);
    const db = await getDb();
    
    // Verify user exists in database
    const dbUser = await db.get('SELECT id, username, points FROM users WHERE id = ?', [user.id]);
    if (!dbUser) return null;
    
    return dbUser;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
} 