import os
import json
import redis

# Use an environment variable or default to localhost
REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", 6379))
REDIS_DB = int(os.environ.get("REDIS_DB", 0))

# Fallback in-memory cache
_in_memory_cache = {}

# Create a connection pool to avoid recreating connections on every request
try:
    redis_pool = redis.ConnectionPool(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)
    r = redis.Redis(connection_pool=redis_pool)
    # Ping to test connection
    r.ping()
except Exception as e:
    print(f"Warning: Failed to connect to Redis at {REDIS_HOST}:{REDIS_PORT}. Error: {e}")
    r = None

def get_cache(key: str):
    """Retrieve an item from the cache with in-memory fallback."""
    if r is not None:
        try:
            val = r.get(key)
            if val:
                return json.loads(val)
            return None
        except Exception as e:
            print(f"Redis get error for {key}, falling back to memory: {e}")
    
    # Fallback
    return _in_memory_cache.get(key)

def set_cache(key: str, value: dict, expire_seconds: int = 300):
    """Set an item in the cache with in-memory fallback."""
    if r is not None:
        try:
            r.setex(key, expire_seconds, json.dumps(value))
            return True
        except Exception as e:
            print(f"Redis set error for {key}, falling back to memory: {e}")
            
    # Fallback (note: this simple memory cache doesn't implement expiration for brevity)
    _in_memory_cache[key] = value
    return True

