import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def init_database():
    print("🚀 Starting Database Initialization Process...")
    
    # Fetch the database URL from env variables
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ Error: DATABASE_URL is not set in the environment variables.")
        sys.exit(1)
        
    # 2. Fix Render's default 'postgres://' prefix (SQLAlchemy 2.0+ requires 'postgresql://')
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    # 3. Create the database engine
    print("🔗 Connecting to the database...")
    try:
        engine = create_engine(db_url)
    except Exception as e:
        print(f"❌ ERROR connecting to database: {e}")
        sys.exit(1)

    # 4. Locate and read the SQL file
    sql_file_path = "final_schema.sql"
    if not os.path.exists(sql_file_path):
        print(f"❌ ERROR: Could not find '{sql_file_path}' in the current directory.")
        sys.exit(1)

    print(f"📖 Reading schema from '{sql_file_path}'...")
    with open(sql_file_path, "r", encoding="utf-8") as file:
        sql_script = file.read()

    # 5. Execute the SQL script within a transaction
    print("⚡ Executing schema script. This might take a few seconds...")
    try:
        # engine.begin() automatically commits the transaction if successful, 
        # or rolls it back if it crashes halfway through.
        with engine.begin() as connection:
            connection.execute(text(sql_script))
        print("✅ SUCCESS: Database schema has been initialized perfectly!")
    except Exception as e:
        print(f"❌ FAILED to execute schema: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()