import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import crypto from 'crypto';

export const checkIdempotency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate a hash of the request body to serve as the deduplication key
    const payloadString = JSON.stringify(req.body);
    const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
    const dedupKey = `dedup:webhook:${hash}`;

    // Try to set the key with a 5-minute (300 seconds) TTL.
    // 'NX' means set only if it does not exist.
    const isNew = await redis.set(dedupKey, 'locked', 'EX', 300, 'NX');

    if (!isNew) {
      console.log(`[Idempotency] Duplicate webhook intercepted. Hash: ${hash}`);
      return res.status(200).json({ status: 'ignored', message: 'Duplicate event suppressed' });
    }

    // Pass the hash to the controller so it can be saved in the database
    req.body._dedupKey = hash;
    next();
  } catch (error) {
    console.error('Idempotency check failed:', error);
    // On redis failure, allow the request to proceed to avoid dropping alerts
    next();
  }
};
