import { createHash } from "crypto";

export function computeBucket(userId: string, experimentKey: string): number {
  const hash = createHash("sha256")
    .update(`${userId}:${experimentKey}`)
    .digest();
  const value = hash.readUInt32BE(0);
  return value % 100;
}

export function isUserInRollout(
  userId: string,
  experimentKey: string,
  rolloutPercentage: number
): boolean {
  if (rolloutPercentage <= 0) return false;
  if (rolloutPercentage >= 100) return true;
  return computeBucket(userId, experimentKey) < rolloutPercentage;
}
