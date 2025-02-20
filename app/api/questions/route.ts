import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import { getUserFromSession } from '@/app/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const user = await getUserFromSession(sessionCookie);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();

    // Get all questions (without flags)
    const questions = await db.all(`
      SELECT 
        q.id,
        q.title,
        q.description,
        q.category,
        q.difficulty,
        q.points,
        q.hint,
        q.link,
        CASE WHEN sq.id IS NOT NULL THEN 1 ELSE 0 END as solved,
        CASE WHEN uh.id IS NOT NULL THEN 1 ELSE 0 END as hintUnlocked
      FROM questions q
      LEFT JOIN solved_questions sq ON sq.question_id = q.id AND sq.user_id = ?
      LEFT JOIN unlocked_hints uh ON uh.question_id = q.id AND uh.user_id = ?
      ORDER BY q.category, q.difficulty, q.points
    `, [user.id, user.id]);

    // Group questions by category
    const groupedQuestions = questions.reduce((acc: any[], q: any) => {
      const category = acc.find(c => c.category === q.category);
      const challenge = {
        id: q.id,
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        points: q.points,
        hint: q.hint,
        link: q.link,
        solved: Boolean(q.solved),
        hintUnlocked: Boolean(q.hintUnlocked)
      };

      if (category) {
        category.challenges.push(challenge);
      } else {
        acc.push({
          id: `cat-${acc.length + 1}`,
          category: q.category,
          challenges: [challenge]
        });
      }
      return acc;
    }, []);

    return NextResponse.json(groupedQuestions);
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 