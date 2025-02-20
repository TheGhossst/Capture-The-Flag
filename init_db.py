import sqlite3
import bcrypt

def init_db():
    # Connect to SQLite database (creates it if it doesn't exist)
    conn = sqlite3.connect('ctf.db')
    cursor = conn.cursor()

    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            points INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create questions table
    cursor.execute('''
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
    ''')

    # Create solved_questions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS solved_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (question_id) REFERENCES questions(id),
            UNIQUE(user_id, question_id)
        )
    ''')
    
    cursor.execute('''CREATE TABLE IF NOT EXISTS unlocked_hints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  UNIQUE(user_id, question_id)
);''')

    # Create test users
    test_users = [
        ('admin', 'admin123', 0),
        ('test', 'test123', 0)
    ]

    for username, password, points in test_users:
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        try:
            cursor.execute(
                'INSERT INTO users (username, password, points) VALUES (?, ?, ?)',
                (username, hashed.decode('utf-8'), points)
            )
            print(f"Created user: {username}")
        except sqlite3.IntegrityError:
            print(f"User {username} already exists")

    # Sample questions
    questions = [
        {
            'title': 'Hidden in Plain Sight',
            'description': 'Find the hidden flag. Remember, not everything is as it seems.',
            'category': 'Steganography',
            'difficulty': 'Easy',
            'points': 100,
            'flag': 'flag{steg0_b3ginner}',
            'hint': 'The answer is right there'
        },
        {
            'title': 'SQL Injection Basics',
            'description': 'Find the flag by exploiting a basic SQL injection vulnerability.',
            'category': 'Web Exploitation',
            'difficulty': 'Easy',
            'points': 100,
            'flag': 'flag{sql_injection_101}',
            'hint': 'Try using single quotes in the input field'
        },
        {
            'title': 'Basic Encryption',
            'description': 'Decrypt this basic cipher to find the flag.',
            'category': 'Cryptography',
            'difficulty': 'Easy',
            'points': 150,
            'flag': 'flag{crypto_beginner}',
            'hint': 'Look up Caesar cipher'
        },
        {
            'title': 'Memory Analysis',
            'description': 'Analyze this memory dump to find the flag.',
            'category': 'Forensics',
            'difficulty': 'Medium',
            'points': 200,
            'flag': 'flag{memory_hunter}',
            'hint': 'Check the process memory regions'
        }
    ]

    # Insert questions
    for q in questions:
        hashed_flag = bcrypt.hashpw(q['flag'].encode('utf-8'), bcrypt.gensalt())
        try:
            cursor.execute('''
                INSERT INTO questions (
                    title, description, category, difficulty,
                    points, flag, hint
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                q['title'], q['description'], q['category'],
                q['difficulty'], q['points'], hashed_flag.decode('utf-8'),
                q['hint']
            ))
            print(f"Created question: {q['title']}")
        except sqlite3.IntegrityError:
            print(f"Question {q['title']} already exists")

    # Commit changes and close connection
    conn.commit()
    conn.close()
    print("Database initialized successfully")

if __name__ == "__main__":
    init_db()