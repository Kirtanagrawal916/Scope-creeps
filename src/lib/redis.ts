// Redis Connection Manager with fallback in-memory store
// Ensures full functionality both with Redis container and standalone local dev

interface CacheStore {
  [key: string]: { value: string; expiresAt?: number };
}

class InMemoryRedisMock {
  private store: CacheStore = {};

  async get(key: string): Promise<string | null> {
    const item = this.store[key];
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      delete this.store[key];
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<"OK"> {
    let expiresAt: number | undefined = undefined;
    if (mode === "EX" && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.store[key] = { value, expiresAt };
    return "OK";
  }

  async del(key: string): Promise<number> {
    if (this.store[key]) {
      delete this.store[key];
      return 1;
    }
    return 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace("*", "");
    return Object.keys(this.store).filter((k) => k.startsWith(prefix));
  }

  async ping(): Promise<"PONG"> {
    return "PONG";
  }

  get isConnected(): boolean {
    return true;
  }

  get mode(): string {
    return "In-Memory Fallback (Dev)";
  }
}

class RedisManager {
  private mock = new InMemoryRedisMock();
  private redisClient: unknown = null;
  private connected = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        // @ts-expect-error - ioredis optional dependency
        const { default: Redis } = await import("ioredis");
        this.redisClient = new Redis(
          process.env.REDIS_URL || {
            host: process.env.REDIS_HOST || "localhost",
            port: Number(process.env.REDIS_PORT) || 6379,
            retryStrategy: (times: number) => Math.min(times * 100, 3000),
          },
        );
        this.redisClient.on("connect", () => {
          this.connected = true;
          console.log("[Redis] Connected successfully to Redis server.");
        });
        this.redisClient.on("error", (err: Error) => {
          this.connected = false;
          console.warn("[Redis] Redis error, using memory fallback:", err.message);
        });
      } catch (err) {
        console.log("[Redis] ioredis module not found or failed, using in-memory store.");
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.connected && this.redisClient) {
      try {
        return await (this.redisClient as Record<string, (...args: unknown[]) => unknown>).get(key);
      } catch {
        return this.mock.get(key);
      }
    }
    return this.mock.get(key);
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string> {
    if (this.connected && this.redisClient) {
      try {
        const client = this.redisClient as Record<string, (...args: unknown[]) => unknown>;
        if (mode === "EX" && duration) {
          return await client.set(key, value, "EX", duration);
        }
        return await client.set(key, value);
      } catch {
        return this.mock.set(key, value, mode, duration);
      }
    }
    return this.mock.set(key, value, mode, duration);
  }

  async del(key: string): Promise<number> {
    if (this.connected && this.redisClient) {
      try {
        return await (this.redisClient as Record<string, (...args: unknown[]) => unknown>).del(key);
      } catch {
        return this.mock.del(key);
      }
    }
    return this.mock.del(key);
  }

  async getStatus() {
    return {
      connected: this.connected,
      mode: this.connected ? "Redis Server" : this.mock.mode,
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: process.env.REDIS_PORT || 6379,
    };
  }
}

export const redis = new RedisManager();
