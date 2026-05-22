import threading
import time
from typing import Any, Optional


class TTLCache:
    def __init__(self):
        self._store: dict = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl: int = 60):
        with self._lock:
            self._store[key] = (value, time.time() + ttl)

    def delete(self, key: str):
        with self._lock:
            self._store.pop(key, None)

    def clear(self):
        with self._lock:
            self._store.clear()

    def cleanup_expired(self):
        with self._lock:
            now = time.time()
            expired = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired:
                del self._store[k]

    def __len__(self):
        with self._lock:
            return len(self._store)


_cache_instance = TTLCache()


def cache_get(key: str) -> Optional[Any]:
    return _cache_instance.get(key)


def cache_set(key: str, value: Any, ttl: int = 60):
    _cache_instance.set(key, value, ttl)


def cache_delete(key: str):
    _cache_instance.delete(key)
