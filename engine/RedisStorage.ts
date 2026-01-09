import Redis from 'ioredis';
import { StorageAdapter } from './Storage';
import { StepContext } from './Transaction';

export class RedisStorage implements StorageAdapter {
  private redis: Redis;
  private ttlSeconds: number;

  /**
   * @param connectionString Redis connection URL (e.g., "redis://localhost:6379")
   * @param ttlSeconds How long to keep logs (default: 1 hour)
   */
  constructor(connectionString: string, ttlSeconds = 3600) {
    this.redis = new Redis(connectionString);
    this.ttlSeconds = ttlSeconds;
  }

  async save(txId: string, state: StepContext[]): Promise<void> {
    const key = `tx:${txId}`;
    await this.redis.set(key, JSON.stringify(state));
    // Reset expiration timer on every update so active transactions don't expire
    await this.redis.expire(key, this.ttlSeconds); 
  }

  async load(txId: string): Promise<StepContext[] | null> {
    const data = await this.redis.get(`tx:${txId}`);
    return data ? JSON.parse(data) : null;
  }

  async clear(txId: string): Promise<void> {
    await this.redis.del(`tx:${txId}`);
  }

  // Helper to close connection when app shuts down
  async disconnect() {
    await this.redis.quit();
  }
}
