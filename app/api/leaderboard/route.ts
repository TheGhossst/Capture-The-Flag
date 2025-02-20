import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/app/lib/auth';

interface LeaderboardUser {
  id: number;
  username: string;
  points: number;
  solved: number;
  lastActive: string;
  rank: number;
}

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Get current user from session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const currentUser = await getUserFromSession(sessionCookie);

    // Get total count
    const { total } = await db.get(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE username LIKE ?
    `, [`%${search}%`]);

    // Get paginated users with their stats
    const users = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.points,
        (SELECT COUNT(*) FROM solved_questions WHERE user_id = u.id) as solved,
        u.created_at as lastActive,
        (SELECT COUNT(*) + 1 FROM users WHERE points > u.points) as rank
      FROM users u
      WHERE u.username LIKE ?
      ORDER BY u.points DESC, u.created_at ASC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, limit, offset]);

    return NextResponse.json({
      users: users.map((user: LeaderboardUser) => ({
        ...user,
        isCurrentUser: currentUser?.id === user.id
      })),
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 