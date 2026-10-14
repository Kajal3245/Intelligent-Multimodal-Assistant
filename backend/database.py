
import sqlite3
from pathlib import Path

DATABASE_PATH = Path(__file__).resolve().parent / "history.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            history_type TEXT NOT NULL,
            title TEXT NOT NULL,
            details TEXT NOT NULL,
            created_at TEXT NOT NULL,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            deleted_at TEXT
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT 'New chat',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            deleted_at TEXT
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        )
    """)

    # Add missing columns to older databases.
    history_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(history)")
    }

    if "is_deleted" not in history_columns:
        connection.execute(
            "ALTER TABLE history ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0"
        )

    if "deleted_at" not in history_columns:
        connection.execute(
            "ALTER TABLE history ADD COLUMN deleted_at TEXT"
        )

    conversation_columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(conversations)")
    }

    if "is_deleted" not in conversation_columns:
        connection.execute(
            "ALTER TABLE conversations ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0"
        )

    if "deleted_at" not in conversation_columns:
        connection.execute(
            "ALTER TABLE conversations ADD COLUMN deleted_at TEXT"
        )

    connection.commit()
    connection.close()


# ---------------- CONVERSATIONS ----------------

def create_conversation(title="New chat"):
    connection = get_connection()
    cursor = connection.execute(
        "INSERT INTO conversations (title) VALUES (?)",
        (title,),
    )
    connection.commit()
    conversation_id = cursor.lastrowid
    connection.close()
    return conversation_id


def save_message(conversation_id, role, content):
    connection = get_connection()
    connection.execute("""
        INSERT INTO messages (conversation_id, role, content)
        VALUES (?, ?, ?)
    """, (conversation_id, role, content))
    connection.commit()
    connection.close()


def move_conversation_to_trash(conversation_id):
    connection = get_connection()
    cursor = connection.execute("""
        UPDATE conversations
        SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_deleted = 0
    """, (conversation_id,))
    connection.commit()
    updated = cursor.rowcount
    connection.close()
    return updated > 0


def get_deleted_conversations():
    connection = get_connection()
    rows = connection.execute("""
        SELECT id, title, created_at, deleted_at
        FROM conversations
        WHERE is_deleted = 1
        ORDER BY deleted_at DESC
    """).fetchall()
    connection.close()
    return [dict(row) for row in rows]


def restore_conversation(conversation_id):
    connection = get_connection()
    cursor = connection.execute("""
        UPDATE conversations
        SET is_deleted = 0, deleted_at = NULL
        WHERE id = ? AND is_deleted = 1
    """, (conversation_id,))
    connection.commit()
    updated = cursor.rowcount
    connection.close()
    return updated > 0


def permanently_delete_conversation(conversation_id):
    connection = get_connection()
    connection.execute(
        "DELETE FROM messages WHERE conversation_id = ?",
        (conversation_id,),
    )
    cursor = connection.execute("""
        DELETE FROM conversations
        WHERE id = ? AND is_deleted = 1
    """, (conversation_id,))
    connection.commit()
    deleted = cursor.rowcount
    connection.close()
    return deleted > 0


# ---------------- DETECTION HISTORY TRASH ----------------

def move_history_to_trash(history_id):
    connection = get_connection()
    cursor = connection.execute("""
        UPDATE history
        SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_deleted = 0
    """, (history_id,))
    connection.commit()
    updated = cursor.rowcount
    connection.close()
    return updated > 0


def get_deleted_history():
    connection = get_connection()
    rows = connection.execute("""
        SELECT id, history_type, title, details, created_at, deleted_at
        FROM history
        WHERE is_deleted = 1
        ORDER BY deleted_at DESC
    """).fetchall()
    connection.close()
    return [dict(row) for row in rows]


def restore_history(history_id):
    connection = get_connection()
    cursor = connection.execute("""
        UPDATE history
        SET is_deleted = 0, deleted_at = NULL
        WHERE id = ? AND is_deleted = 1
    """, (history_id,))
    connection.commit()
    updated = cursor.rowcount
    connection.close()
    return updated > 0


def permanently_delete_history(history_id):
    connection = get_connection()
    cursor = connection.execute("""
        DELETE FROM history
        WHERE id = ? AND is_deleted = 1
    """, (history_id,))
    connection.commit()
    deleted = cursor.rowcount
    connection.close()
    return deleted > 0
