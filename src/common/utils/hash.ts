import argon2 from 'argon2';

export class HashUtil {
  public static async hash(plainText: string): Promise<string> {
    return argon2.hash(plainText, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  public static async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch {
      return false;
    }
  }
}

