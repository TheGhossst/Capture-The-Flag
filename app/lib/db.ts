import { Database } from 'sqlite3';
import { open } from 'sqlite';
import { hash } from 'bcryptjs';

let db: any = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: './ctf.db',
      driver: Database
    });

    await initDb();
  }
  return db;
}

async function initDb() {
  const db = await getDb();

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create questions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      points INTEGER NOT NULL,
      flag TEXT NOT NULL,
      hint TEXT,
      link TEXT GENERATED ALWAYS AS ('/question/' || id) VIRTUAL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create solved_questions table for tracking user progress
  await db.exec(`
    CREATE TABLE IF NOT EXISTS solved_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (question_id) REFERENCES questions(id),
      UNIQUE(user_id, question_id)
    )
  `);

  await db.exec(`CREATE TABLE IF NOT EXISTS unlocked_hints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    UNIQUE(user_id, question_id)
  )`
  );

  // Insert initial questions if none exist
  const count = await db.get('SELECT COUNT(*) as count FROM questions');
  if (count.count === 0) {
    const questions = [
      {
        title: 'SQL Injection Basics',
        description: 'Find the flag by exploiting a basic SQL injection vulnerability.',
        category: 'Web Exploitation',
        difficulty: 'Easy',
        points: 100,
        flag: 'flag{sql_injection_101}',
        hint: 'Try using single quotes in the input field'
      },
      {
        title: 'Basic Encryption',
        description: 'Decrypt this basic cipher to find the flag.',
        category: 'Cryptography',
        difficulty: 'Easy',
        points: 150,
        flag: 'flag{crypto_beginner}',
        hint: 'Look up Caesar cipher'
      },
      // Add more questions as needed
    ];

    for (const q of questions) {
      const hashedFlag = await hash(q.flag, 12);
      await db.run(`
        INSERT INTO questions (
          title, description, category, difficulty, 
          points, flag, hint
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        q.title, q.description, q.category,
        q.difficulty, q.points, hashedFlag, q.hint
      ]);
    }
  }
} 