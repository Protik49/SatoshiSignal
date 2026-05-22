import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "satoshisignal.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            timeframe TEXT NOT NULL,
            bullish_pct REAL NOT NULL,
            bearish_pct REAL NOT NULL,
            confidence TEXT NOT NULL,
            predicted_direction TEXT NOT NULL,
            reasoning TEXT,
            key_drivers TEXT,
            entry_price REAL,
            actual_outcome TEXT,
            was_correct INTEGER,
            resolved_at TEXT
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS market_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            price REAL NOT NULL,
            volume REAL NOT NULL,
            indicators_json TEXT
        )
        """
    )
    conn.commit()
    conn.close()


class Database:
    @staticmethod
    def save_prediction(record: dict):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO predictions (timestamp, timeframe, bullish_pct, bearish_pct,
                confidence, predicted_direction, reasoning, key_drivers, entry_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.get("timestamp", datetime.utcnow().isoformat()),
                record.get("timeframe", "15m"),
                record.get("bullish_pct", 0),
                record.get("bearish_pct", 0),
                record.get("confidence", "Medium"),
                record.get("predicted_direction", "neutral"),
                record.get("reasoning", ""),
                ",".join(record.get("key_drivers", [])),
                record.get("entry_price", 0),
            ),
        )
        conn.commit()
        last_id = cursor.lastrowid
        conn.close()
        return last_id

    @staticmethod
    def resolve_prediction(prediction_id: int, actual_direction: str, was_correct: bool):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE predictions SET actual_outcome = ?, was_correct = ?, resolved_at = ?
            WHERE id = ?
            """,
            (actual_direction, 1 if was_correct else 0, datetime.utcnow().isoformat(), prediction_id),
        )
        conn.commit()
        conn.close()

    @staticmethod
    def get_predictions(limit: int = 50):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def get_accuracy_stats():
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT COUNT(*) as total FROM predictions WHERE was_correct IS NOT NULL"
        )
        total_resolved = cursor.fetchone()["total"]
        cursor.execute(
            "SELECT COUNT(*) as wins FROM predictions WHERE was_correct = 1"
        )
        wins = cursor.fetchone()["wins"]

        cursor.execute(
            """
            SELECT timeframe, COUNT(*) as total,
                SUM(CASE WHEN was_correct = 1 THEN 1 ELSE 0 END) as wins
            FROM predictions WHERE was_correct IS NOT NULL
            GROUP BY timeframe
            """
        )
        by_timeframe = [
            {"timeframe": row["timeframe"], "total": row["total"], "wins": row["wins"]}
            for row in cursor.fetchall()
        ]

        conn.close()
        win_rate = round((wins / total_resolved * 100), 2) if total_resolved > 0 else 0
        return {
            "win_rate": win_rate,
            "total_predictions": total_resolved,
            "wins": wins,
            "by_timeframe": by_timeframe,
        }
