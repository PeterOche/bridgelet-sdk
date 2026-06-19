import { SecretEncryptionUtil } from './secret-encryption.util.js';
import * as crypto from 'crypto';

describe('SecretEncryptionUtil', () => {
  const validKey = crypto.randomBytes(32).toString('hex');
  const plaintext = 'SCZANGBA5YHTNYVSKOP3SJ2CAANRL5ZVTTHLQPTU26HQZQVTYVKBMCR';

  describe('encrypt', () => {
    it('produces a colon-separated string with three parts', () => {
      const result = SecretEncryptionUtil.encrypt(plaintext, validKey);
      expect(result.split(':').length).toBe(3);
    });

    it('produces a different output each call due to random IV', () => {
      const first = SecretEncryptionUtil.encrypt(plaintext, validKey);
      const second = SecretEncryptionUtil.encrypt(plaintext, validKey);
      expect(first).not.toBe(second);
    });
  });

  describe('decrypt', () => {
    it('round-trips correctly', () => {
      const encrypted = SecretEncryptionUtil.encrypt(plaintext, validKey);
      const decrypted = SecretEncryptionUtil.decrypt(encrypted, validKey);
      expect(decrypted).toBe(plaintext);
    });

    it('throws when the wrong key is used', () => {
      const encrypted = SecretEncryptionUtil.encrypt(plaintext, validKey);
      const wrongKey = crypto.randomBytes(32).toString('hex');
      expect(() => SecretEncryptionUtil.decrypt(encrypted, wrongKey)).toThrow();
    });

    it('throws when the ciphertext is tampered with', () => {
      const encrypted = SecretEncryptionUtil.encrypt(plaintext, validKey);
      const parts = encrypted.split(':');
      parts[2] = 'aabbccdd'; // corrupt the ciphertext
      expect(() =>
        SecretEncryptionUtil.decrypt(parts.join(':'), validKey),
      ).toThrow();
    });

    it('throws a descriptive error for legacy base64 format', () => {
      const base64Secret = Buffer.from(plaintext).toString('base64');
      expect(() =>
        SecretEncryptionUtil.decrypt(base64Secret, validKey),
      ).toThrow('Invalid encrypted format');
    });
  });

  describe('key validation', () => {
    it('throws when key is wrong length', () => {
      const shortKey = 'abc123';
      expect(() => SecretEncryptionUtil.encrypt(plaintext, shortKey)).toThrow(
        'Encryption key must be 32 bytes',
      );
    });
  });
});
