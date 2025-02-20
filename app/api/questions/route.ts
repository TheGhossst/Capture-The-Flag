import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Get all questions (without flags)
    const questions = await db.all(`
      SELECT 
        id, title, description, category, 
        difficulty, points, hint, link
      FROM questions
      ORDER BY category, difficulty, points
    `);

    // Group questions by category
    const groupedQuestions = questions.reduce((acc: any, q: any) => {
      const category = acc.find((c: any) => c.category === q.category);
      if (category) {
        category.challenges.push({
          id: q.id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          points: q.points,
          hint: q.hint,
          link: q.link,
          solved: false // Will be updated from solved_questions table
        });
      } else {
        acc.push({
          id: `cat-${acc.length + 1}`,
          category: q.category,
          challenges: [{
            id: q.id,
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            points: q.points,
            hint: q.hint,
            link: q.link,
            solved: false
          }]
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