import sqlite3
import hashlib
import secrets
from datetime import datetime
from typing import Optional, List, Dict, Any
import os

# Import SUPPORTED_DATA from api.py
try:
    from api import SUPPORTED_DATA
except ImportError:
    # Fallback if api.py not available
    SUPPORTED_DATA = [
        "rpm", "speed", "cool_temp", "throttle_pos", "intake_mani_pres",
        "intake_air_temp", "maf_air_flow_rate", "run_time", "baro_pressure",
        "catalyst_temp", "control_module_voltage"
    ]

DATABASE_PATH = os.environ.get('DATABASE_PATH', 'obd_dashboard.db')

class DataStore:
    def __init__(self):
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with required tables"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Create devices table for device tokens
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                device_token TEXT UNIQUE NOT NULL,
                name TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create obd_data table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS obd_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                rpm REAL,
                speed REAL,
                cool_temp REAL,
                throttle_pos REAL,
                intake_mani_pres REAL,
                intake_air_temp REAL,
                maf_air_flow_rate REAL,
                run_time REAL,
                baro_pressure REAL,
                catalyst_temp REAL,
                control_module_voltage REAL,
                engine_load REAL,
                fuel_level REAL,
                fuel_pressure REAL,
                ambient_air_temp REAL,
                timing_advance REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_obd_data_user_timestamp ON obd_data(user_id, timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(device_token)')

        # Backfill migration: add new columns if missing
        existing_cols = [row[1] for row in cursor.execute('PRAGMA table_info(obd_data)').fetchall()]
        new_cols = {
            'engine_load': 'REAL',
            'fuel_level': 'REAL',
            'fuel_pressure': 'REAL',
            'ambient_air_temp': 'REAL',
            'timing_advance': 'REAL'
        }
        for col, col_type in new_cols.items():
            if col not in existing_cols:
                cursor.execute(f'ALTER TABLE obd_data ADD COLUMN {col} {col_type}')
        
        conn.commit()
        conn.close()
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256 with salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}:{password_hash}"
    
    def verify_password(self, password: str, stored_hash: str) -> bool:
        """Verify password against stored hash"""
        try:
            salt, password_hash = stored_hash.split(':')
            return hashlib.sha256((password + salt).encode()).hexdigest() == password_hash
        except ValueError:
            return False
    
    def create_user(self, email: str, password: str) -> bool:
        """Create a new user"""
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            password_hash = self.hash_password(password)
            cursor.execute(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                (email, password_hash)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            return False  # Email already exists
    
    def authenticate_user(self, email: str, password: str) -> Optional[int]:
        """Authenticate user and return user_id if successful"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, password_hash FROM users WHERE email = ?', (email,))
        result = cursor.fetchone()
        conn.close()
        
        if result and self.verify_password(password, result[1]):
            return result[0]
        return None
    
    def create_session(self, user_id: int) -> str:
        """Create a new session for user"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Clean up expired sessions (compare using unix epoch seconds)
        cursor.execute("DELETE FROM sessions WHERE expires_at < strftime('%s','now')")
        
        # Create new session
        session_token = secrets.token_urlsafe(32)
        # Store expires_at as unix epoch seconds (int)
        expires_at = int(datetime.now().timestamp()) + (7 * 24 * 60 * 60)  # 7 days
        
        cursor.execute(
            'INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
            (user_id, session_token, expires_at)
        )
        conn.commit()
        conn.close()
        
        return session_token
    
    def validate_session(self, session_token: str) -> Optional[int]:
        """Validate session token and return user_id if valid"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # Compare expires_at against current unix epoch seconds
        cursor.execute(
            "SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > strftime('%s','now')",
            (session_token,)
        )
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else None
    
    def logout_user(self, session_token: str) -> bool:
        """Logout user by removing session"""
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM sessions WHERE session_token = ?', (session_token,))
        affected_rows = cursor.rowcount
        conn.commit()
        conn.close()
        
        return affected_rows > 0
    
    def insert_obd_data(self, user_id: int, data_entries: List[Dict[str, Any]]) -> bool:
        """Insert OBD data entries for a user"""
        try:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            for entry in data_entries:
                cursor.execute('''
                    INSERT INTO obd_data (
                        user_id, timestamp, rpm, speed, cool_temp, throttle_pos,
                        intake_mani_pres, intake_air_temp, maf_air_flow_rate,
                        run_time, baro_pressure, catalyst_temp, control_module_voltage,
                        engine_load, fuel_level, fuel_pressure, ambient_air_temp, timing_advance
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    entry.get('timestamp'),
                    entry.get('rpm'),
                    entry.get('speed'),
                    entry.get('cool_temp'),
                    entry.get('throttle_pos'),
                    entry.get('intake_mani_pres'),
                    entry.get('intake_air_temp'),
                    entry.get('maf_air_flow_rate'),
                    entry.get('run_time'),
                    entry.get('baro_pressure'),
                    entry.get('catalyst_temp'),
                    entry.get('control_module_voltage'),
                    entry.get('engine_load'),
                    entry.get('fuel_level'),
                    entry.get('fuel_pressure'),
                    entry.get('ambient_air_temp'),
                    entry.get('timing_advance')
                ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error inserting OBD data: {e}")
            return False

    def create_device(self, user_id: int, name: Optional[str] = None) -> str:
        token = secrets.token_urlsafe(24)
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('INSERT INTO devices (user_id, device_token, name) VALUES (?, ?, ?)', (user_id, token, name))
        conn.commit()
        conn.close()
        return token

    def validate_device(self, device_token: str) -> Optional[int]:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT user_id FROM devices WHERE device_token = ?', (device_token,))
        row = cursor.fetchone()
        if row:
            cursor.execute('UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE device_token = ?', (device_token,))
            conn.commit()
            conn.close()
            return row[0]
        conn.close()
        return None
    
    def get_obd_data(self, user_id: int, date: Optional[str] = None, data_types: Optional[List[str]] = None, limit: int = 1000) -> List[Dict[str, Any]]:
        """Retrieve OBD data for a user, optionally filtered by date and data types"""
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build query - only select needed columns for better performance
        if data_types:
            # Only select requested columns + required fields
            columns = ['id', 'timestamp'] + [col for col in data_types if col in SUPPORTED_DATA]
            select_clause = ', '.join(columns)
        else:
            select_clause = '*'
        
        query = f'SELECT {select_clause} FROM obd_data WHERE user_id = ?'
        params = [user_id]
        
        if date:
            # Convert dd-mm-yyyy to yyyy-mm-dd for SQLite
            try:
                date_obj = datetime.strptime(date, '%d-%m-%Y')
                formatted_date = date_obj.strftime('%Y-%m-%d')
                query += ' AND DATE(timestamp) = ?'
                params.append(formatted_date)
            except ValueError:
                pass  # Invalid date format, ignore filter
        
        query += f' ORDER BY timestamp DESC LIMIT {limit}'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        # Optimized conversion to list of dictionaries
        if data_types:
            # Build entries including only requested columns when present
            data = []
            for row in rows:
                entry = {'id': row['id'], 'timestamp': row['timestamp']}
                row_keys = row.keys()
                for data_type in data_types:
                    if data_type in row_keys:
                        value = row[data_type]
                        if value is not None:
                            entry[data_type] = value
                data.append(entry)
        else:
            # Use list comprehension for better performance
            data = [dict(row) for row in rows]
        
        return data

    def delete_obd_data_for_date(self, user_id: int, date_str: str) -> int:
        """Delete all OBD data rows for a user on a given date (dd-mm-YYYY). Returns number of rows deleted."""
        try:
            # Convert dd-mm-YYYY to YYYY-mm-dd for SQLite DATE()
            try:
                date_obj = datetime.strptime(date_str, '%d-%m-%Y')
                formatted_date = date_obj.strftime('%Y-%m-%d')
            except ValueError:
                return 0

            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM obd_data WHERE user_id = ? AND DATE(timestamp) = ?', (user_id, formatted_date))
            affected = cursor.rowcount
            conn.commit()
            conn.close()
            return affected if affected is not None else 0
        except Exception as e:
            print(f"Error deleting OBD data: {e}")
            return 0

# Global datastore instance
datastore = DataStore()
