import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import { getUserFromSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const db = await getDb();
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const user = await getUserFromSession(sessionCookie);

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const questionId = parseInt(params.id);
    
    // Get question points and check if already unlocked
    const [question, hintUnlocked] = await Promise.all([
      db.get('SELECT points FROM questions WHERE id = ?', [questionId]),
      db.get(
        'SELECT 1 FROM unlocked_hints WHERE user_id = ? AND question_id = ?',
        [user.id, questionId]
      )
    ]);

    if (!question) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question not found' 
      });
    }

    if (hintUnlocked) {
      return NextResponse.json({ 
        success: true,
        alreadyUnlocked: true 
      });
    }

    // Calculate hint cost as half of question points
    const hintCost = Math.floor(question.points / 2);
    const currentPoints = user.points;

    // Check if user has enough points
    if (currentPoints < hintCost) {
      return NextResponse.json({ 
        success: false, 
        error: `Not enough points. Need ${hintCost} points, you have ${currentPoints}.` 
      });
    }

    // Begin transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Deduct HALF of the points
      await db.run(
        'UPDATE users SET points = points - ? WHERE id = ?',
        [hintCost, user.id]
      );

      // Record hint unlock
      await db.run(
        'INSERT INTO unlocked_hints (user_id, question_id) VALUES (?, ?)',
        [user.id, questionId]
      );

      await db.run('COMMIT');

      return NextResponse.json({ 
        success: true,
        pointsDeducted: hintCost,
        remainingPoints: currentPoints - hintCost
      });
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Hint unlock error:', error);
    await db.run('ROLLBACK');
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to unlock hint' 
    });
  }
} 