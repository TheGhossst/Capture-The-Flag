import { NextResponse } from 'next/server'
import { getUserFromSession } from '@/app/lib/auth'
import { cookies } from 'next/headers'
import { getDb } from '@/app/lib/db'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')?.value
    
    const user = await getUserFromSession(sessionCookie)
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false 
      })
    }

    const db = await getDb()

    // Get total participants
    const { total } = await db.get('SELECT COUNT(*) as total FROM users')

    // Get user's rank (based on points)
    const { rank } = await db.get(`
      SELECT (
        SELECT COUNT(*) + 1 
        FROM users 
        WHERE points > (SELECT points FROM users WHERE id = ?)
      ) as rank 
      FROM users 
      WHERE id = ?
    `, [user.id, user.id])

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        points: user.points,
        rank: rank
      },
      totalParticipants: total
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ 
      authenticated: false 
    })
  }
} 