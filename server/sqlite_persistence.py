#!/usr/bin/env python3
"""
HAZOOM OS - SQLite Database Integration
Enhanced persistence layer with SQLite for robust data storage
"""

import sqlite3
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict

@dataclass
class DatabaseRecord:
    """Database record structure"""
    key: str
    value: str
    namespace: str
    created_at: str
    updated_at: str
    metadata: str
    version: int

class SQLitePersistence:
    """
    SQLite-based persistence layer for HAZOOM OS
    Provides enhanced data storage with ACID compliance
    """
    
    def __init__(self, db_path: str = "/g/hazoom-os/hazoom_data.db"):
        self.db_path = db_path
        self.conn = None
        self.cursor = None
        self._init_database()
    
    def _init_database(self):
        """Initialize database and create tables"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            self.cursor = self.conn.cursor()
            
            # Create main data table
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS hazoom_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT NOT NULL,
                    value TEXT NOT NULL,
                    namespace TEXT DEFAULT 'default',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    metadata TEXT DEFAULT '{}',
                    version INTEGER DEFAULT 1,
                    UNIQUE(key, namespace)
                )
            ''')
            
            # Create index for faster queries
            self.cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_key_namespace 
                ON hazoom_data(key, namespace)
            ''')
            
            # Create index for namespace queries
            self.cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_namespace 
                ON hazoom_data(namespace)
            ''')
            
            # Create audit log table
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action TEXT NOT NULL,
                    key TEXT,
                    namespace TEXT,
                    timestamp TEXT NOT NULL,
                    details TEXT
                )
            ''')
            
            # Create backup metadata table
            self.cursor.execute('''
                CREATE TABLE IF NOT EXISTS backup_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    backup_name TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    record_count INTEGER,
                    size_bytes INTEGER,
                    checksum TEXT
                )
            ''')
            
            self.conn.commit()
            print(f"✅ SQLite database initialized: {self.db_path}")
            
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            raise
    
    def _log_audit(self, action: str, key: str = None, namespace: str = None, details: str = None):
        """Log audit event"""
        try:
            self.cursor.execute('''
                INSERT INTO audit_log (action, key, namespace, timestamp, details)
                VALUES (?, ?, ?, ?, ?)
            ''', (action, key, namespace, datetime.now().isoformat(), details))
            self.conn.commit()
        except Exception as e:
            print(f"Audit log error: {e}")
    
    def set(self, key: str, value: Any, namespace: str = 'default', metadata: Dict = None) -> bool:
        """Set a value in the database"""
        try:
            value_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
            metadata_str = json.dumps(metadata or {})
            timestamp = datetime.now().isoformat()
            
            # Check if key exists
            self.cursor.execute('''
                SELECT version FROM hazoom_data 
                WHERE key = ? AND namespace = ?
            ''', (key, namespace))
            
            existing = self.cursor.fetchone()
            
            if existing:
                # Update existing
                new_version = existing[0] + 1
                self.cursor.execute('''
                    UPDATE hazoom_data 
                    SET value = ?, updated_at = ?, metadata = ?, version = ?
                    WHERE key = ? AND namespace = ?
                ''', (value_str, timestamp, metadata_str, new_version, key, namespace))
                action = 'UPDATE'
            else:
                # Insert new
                self.cursor.execute('''
                    INSERT INTO hazoom_data (key, value, namespace, created_at, updated_at, metadata, version)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (key, value_str, namespace, timestamp, timestamp, metadata_str, 1))
                action = 'CREATE'
            
            self.conn.commit()
            self._log_audit(action, key, namespace, f"Size: {len(value_str)} bytes")
            return True
            
        except Exception as e:
            print(f"Error setting value: {e}")
            return False
    
    def get(self, key: str, namespace: str = 'default', default: Any = None) -> Any:
        """Get a value from the database"""
        try:
            self.cursor.execute('''
                SELECT value FROM hazoom_data 
                WHERE key = ? AND namespace = ?
            ''', (key, namespace))
            
            result = self.cursor.fetchone()
            
            if result:
                value_str = result[0]
                try:
                    return json.loads(value_str)
                except:
                    return value_str
            
            return default
            
        except Exception as e:
            print(f"Error getting value: {e}")
            return default
    
    def get_all(self, namespace: str = None) -> List[Dict]:
        """Get all records, optionally filtered by namespace"""
        try:
            if namespace:
                self.cursor.execute('''
                    SELECT key, value, namespace, created_at, updated_at, metadata, version 
                    FROM hazoom_data WHERE namespace = ?
                ''', (namespace,))
            else:
                self.cursor.execute('''
                    SELECT key, value, namespace, created_at, updated_at, metadata, version 
                    FROM hazoom_data
                ''')
            
            results = []
            for row in self.cursor.fetchall():
                record = dict(row)
                try:
                    record['value'] = json.loads(record['value'])
                except:
                    pass
                try:
                    record['metadata'] = json.loads(record['metadata'])
                except:
                    record['metadata'] = {}
                results.append(record)
            
            return results
            
        except Exception as e:
            print(f"Error getting all records: {e}")
            return []
    
    def remove(self, key: str, namespace: str = 'default') -> bool:
        """Remove a value from the database"""
        try:
            self.cursor.execute('''
                DELETE FROM hazoom_data 
                WHERE key = ? AND namespace = ?
            ''', (key, namespace))
            
            self.conn.commit()
            self._log_audit('DELETE', key, namespace)
            return True
            
        except Exception as e:
            print(f"Error removing value: {e}")
            return False
    
    def clear_namespace(self, namespace: str) -> bool:
        """Clear all records in a namespace"""
        try:
            self.cursor.execute('''
                DELETE FROM hazoom_data 
                WHERE namespace = ?
            ''', (namespace,))
            
            count = self.cursor.rowcount
            self.conn.commit()
            self._log_audit('CLEAR_NAMESPACE', namespace=namespace, details=f"Records cleared: {count}")
            return True
            
        except Exception as e:
            print(f"Error clearing namespace: {e}")
            return False
    
    def search(self, query: str, namespace: str = None) -> List[Dict]:
        """Search for records containing query in key or value"""
        try:
            if namespace:
                self.cursor.execute('''
                    SELECT key, value, namespace, created_at, updated_at, metadata, version 
                    FROM hazoom_data 
                    WHERE namespace = ? AND (key LIKE ? OR value LIKE ?)
                ''', (namespace, f'%{query}%', f'%{query}%'))
            else:
                self.cursor.execute('''
                    SELECT key, value, namespace, created_at, updated_at, metadata, version 
                    FROM hazoom_data 
                    WHERE key LIKE ? OR value LIKE ?
                ''', (f'%{query}%', f'%{query}%'))
            
            results = []
            for row in self.cursor.fetchall():
                record = dict(row)
                try:
                    record['value'] = json.loads(record['value'])
                except:
                    pass
                try:
                    record['metadata'] = json.loads(record['metadata'])
                except:
                    record['metadata'] = {}
                results.append(record)
            
            return results
            
        except Exception as e:
            print(f"Error searching: {e}")
            return []
    
    def backup(self, backup_name: str = None) -> Dict:
        """Create a backup of the database"""
        try:
            if not backup_name:
                backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Get all records
            records = self.get_all()
            
            # Calculate statistics
            record_count = len(records)
            size_bytes = len(json.dumps(records))
            
            # Generate checksum
            import hashlib
            checksum = hashlib.md5(json.dumps(records).encode()).hexdigest()
            
            # Store backup metadata
            self.cursor.execute('''
                INSERT INTO backup_metadata (backup_name, created_at, record_count, size_bytes, checksum)
                VALUES (?, ?, ?, ?, ?)
            ''', (backup_name, datetime.now().isoformat(), record_count, size_bytes, checksum))
            
            self.conn.commit()
            
            result = {
                'backup_name': backup_name,
                'created_at': datetime.now().isoformat(),
                'record_count': record_count,
                'size_bytes': size_bytes,
                'checksum': checksum,
                'records': records
            }
            
            self._log_audit('BACKUP', details=f"Backup: {backup_name}, Records: {record_count}")
            return result
            
        except Exception as e:
            print(f"Error creating backup: {e}")
            return {}
    
    def restore(self, backup_data: Dict) -> bool:
        """Restore from backup data"""
        try:
            records = backup_data.get('records', [])
            
            # Clear existing data first
            self.cursor.execute('DELETE FROM hazoom_data')
            
            # Restore records
            for record in records:
                self.set(
                    key=record['key'],
                    value=record['value'],
                    namespace=record.get('namespace', 'default'),
                    metadata=record.get('metadata', {})
                )
            
            self._log_audit('RESTORE', details=f"Restored {len(records)} records from {backup_data.get('backup_name', 'unknown')}")
            return True
            
        except Exception as e:
            print(f"Error restoring backup: {e}")
            return False
    
    def get_statistics(self) -> Dict:
        """Get database statistics"""
        try:
            # Total records
            self.cursor.execute('SELECT COUNT(*) FROM hazoom_data')
            total_records = self.cursor.fetchone()[0]
            
            # Records by namespace
            self.cursor.execute('''
                SELECT namespace, COUNT(*) as count 
                FROM hazoom_data 
                GROUP BY namespace
            ''')
            namespace_stats = {row[0]: row[1] for row in self.cursor.fetchall()}
            
            # Total size
            self.cursor.execute('SELECT SUM(LENGTH(value)) FROM hazoom_data')
            total_size = self.cursor.fetchone()[0] or 0
            
            # Backups
            self.cursor.execute('SELECT COUNT(*) FROM backup_metadata')
            backup_count = self.cursor.fetchone()[0]
            
            # Recent activity
            self.cursor.execute('''
                SELECT action, COUNT(*) as count 
                FROM audit_log 
                WHERE timestamp > datetime('now', '-1 day')
                GROUP BY action
            ''')
            recent_activity = {row[0]: row[1] for row in self.cursor.fetchall()}
            
            return {
                'total_records': total_records,
                'namespace_stats': namespace_stats,
                'total_size_bytes': total_size,
                'backup_count': backup_count,
                'recent_activity': recent_activity,
                'database_path': self.db_path
            }
            
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {}
    
    def get_audit_log(self, limit: int = 50) -> List[Dict]:
        """Get audit log entries"""
        try:
            self.cursor.execute('''
                SELECT * FROM audit_log 
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (limit,))
            
            return [dict(row) for row in self.cursor.fetchall()]
            
        except Exception as e:
            print(f"Error getting audit log: {e}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("✅ Database connection closed")
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


# Integration with HAZOOM OS localStorage system
class HAZOOMSQLiteBridge:
    """
    Bridge between HAZOOM OS localStorage and SQLite
    Provides seamless integration with existing code
    """
    
    def __init__(self):
        self.sqlite = SQLitePersistence()
        self.backup_interval = 300  # 5 minutes
        self.last_backup = time.time()
    
    def sync_from_localStorage(self, localStorage_data: Dict):
        """Sync data from localStorage to SQLite"""
        print("🔄 Syncing from localStorage to SQLite...")
        
        for key, value in localStorage_data.items():
            # Determine namespace from key pattern
            if ':' in key:
                namespace, clean_key = key.split(':', 1)
            else:
                namespace = 'default'
                clean_key = key
            
            self.sqlite.set(clean_key, value, namespace)
        
        print(f"✅ Synced {len(localStorage_data)} records")
    
    def sync_to_localStorage(self) -> Dict:
        """Sync data from SQLite to localStorage format"""
        print("🔄 Syncing from SQLite to localStorage...")
        
        records = self.sqlite.get_all()
        localStorage_data = {}
        
        for record in records:
            key = f"{record['namespace']}:{record['key']}" if record['namespace'] != 'default' else record['key']
            localStorage_data[key] = record['value']
        
        print(f"✅ Synced {len(localStorage_data)} records")
        return localStorage_data
    
    def auto_backup(self):
        """Perform automatic backup if interval has passed"""
        if time.time() - self.last_backup > self.backup_interval:
            backup = self.sqlite.backup()
            if backup:
                self.last_backup = time.time()
                print(f"💾 Auto-backup created: {backup['backup_name']} ({backup['record_count']} records)")
            return backup
        return None
    
    def get_health_status(self) -> Dict:
        """Get health status of the persistence system"""
        stats = self.sqlite.get_statistics()
        
        return {
            'status': 'healthy',
            'database_path': self.sqlite.db_path,
            'total_records': stats.get('total_records', 0),
            'total_size_mb': round(stats.get('total_size_bytes', 0) / (1024 * 1024), 2),
            'backup_count': stats.get('backup_count', 0),
            'last_backup_age_seconds': round(time.time() - self.last_backup, 1),
            'namespaces': stats.get('namespace_stats', {}),
            'recent_activity': stats.get('recent_activity', {})
        }


if __name__ == "__main__":
    # Test the SQLite persistence
    print("🧪 Testing HAZOOM SQLite Persistence...")
    
    with SQLitePersistence() as db:
        # Test basic operations
        db.set("test_key", {"message": "Hello HAZOOM", "value": 42}, "system")
        db.set("user:profile", {"name": "Hazem", "role": "admin"}, "users")
        
        # Retrieve
        test_data = db.get("test_key", "system")
        print(f"Retrieved: {test_data}")
        
        # Search
        results = db.search("HAZOOM")
        print(f"Search results: {len(results)}")
        
        # Statistics
        stats = db.get_statistics()
        print(f"Statistics: {json.dumps(stats, indent=2)}")
        
        # Backup
        backup = db.backup("manual_test")
        print(f"Backup created: {backup.get('backup_name')}")
        
        # Audit log
        audit = db.get_audit_log(5)
        print(f"Audit entries: {len(audit)}")
    
    print("\n✅ All tests completed successfully!")