import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import { getUserFromSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const db = await getDb();
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const user = await getUserFromSession(sessionCookie);

    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { flag } = await request.json();
    const { id } = context.params;
    const questionId = parseInt(id);

    if (isNaN(questionId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid question ID' 
      });
    }

    // Get question with points
    const question = await db.get(
      'SELECT flag, points FROM questions WHERE id = ?',
      [questionId]
    );

    if (!question) {
      return NextResponse.json({ success: false });
    }

    // Check if already solved
    const solved = await db.get(
      'SELECT 1 FROM solved_questions WHERE user_id = ? AND question_id = ?',
      [user.id, questionId]
    );

    if (solved) {
      return NextResponse.json({ success: false, error: 'Already solved' });
    }

    const flagMatches = await bcrypt.compare(flag, question.flag);
    
    if (flagMatches) {
      // Begin transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        // Add to solved_questions
        await db.run(
          'INSERT INTO solved_questions (user_id, question_id) VALUES (?, ?)',
          [user.id, questionId]
        );

        // Update user points
        await db.run(
          'UPDATE users SET points = points + ? WHERE id = ?',
          [question.points, user.id]
        );

        await db.run('COMMIT');
        return NextResponse.json({ 
          success: true,
          points: question.points 
        });
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
    }

    return NextResponse.json({ success: false });

  } catch (error) {
    console.error('Flag check error:', error);
    await db.run('ROLLBACK');
    return NextResponse.json({ success: false });
  }
} 