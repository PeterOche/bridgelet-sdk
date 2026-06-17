import * as crypto from 'crypto';

/**
 * SecretEncryptionUtil
 *
 * Shared AES-256-GCM encryption utility for ephemeral account secret keys.
 * Used by AccountsService (encrypt on creation) and ClaimRedemptionProvider
 * (decrypt on claim redemption). Both must always use this single implementation
 * - never inline encrypt/decrypt logic elsewhere.
 *
 * Encrypted format (colon-separated hex strings):
 *   iv:authTag:encryptedData
 *
 * The IV is randomly generated per call - never reused.
 * The GCM auth tag detects any tampering with the ciphertext.
 *
 * Key requirements:
 * - Must be a 32-byte value provided as a 64-character hex string
 * - Sourced from ENCRYPTION_KEY environment variable
 * - Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */
export class SecretEncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;

  static encrypt(plaintext: string, encryptionKey: string): string {
    const key = SecretEncryptionUtil.parseKey(encryptionKey);
    const iv = crypto.randomBytes(SecretEncryptionUtil.IV_LENGTH);
    const cipher = crypto.createCipheriv(
      SecretEncryptionUtil.ALGORITHM,
      key,
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('hex'),
      authTag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  }

  static decrypt(encryptedString: string, encryptionKey: string): string {
    const key = SecretEncryptionUtil.parseKey(encryptionKey);
    const parts = encryptedString.split(':');
    if (parts.length !== 3) {
      throw new Error(
        'Invalid encrypted format. Expected iv:authTag:encryptedData. ' +
          'This may be a legacy base64-encoded secret that has not been migrated.',
      );
    }
    const [ivHex, authTagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(
      SecretEncryptionUtil.ALGORITHM,
      key,
      iv,
    );
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      'utf8',
    );
  }

  private static parseKey(hexKey: string): Buffer {
    const key = Buffer.from(hexKey, 'hex');
    if (key.length !== 32) {
      throw new Error(
        `Encryption key must be 32 bytes (64 hex characters). Got ${key.length} bytes. ` +
          "Generate a valid key with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
    return key;
  }
}
