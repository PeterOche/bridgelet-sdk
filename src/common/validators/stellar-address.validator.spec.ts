import { BadRequestException } from '@nestjs/common';
import { StellarAddressValidator } from './stellar-address.validator.js';

describe('StellarAddressValidator', () => {
  const validAddress =
    'GBBD47UZQ5YLQYYTWTCB7X3DUEEVZMDVGFBRNZPMZDWQWKCFN3EOZQKQ';
  const wrongPrefix =
    'ABBD47UZQ5YLQYYTWTCB7X3DUEEVZMDVGFBRNZPMZDWQWKCFN3EOZQKQ';
  const wrongLength =
    'GBBD47UZQ5YLQYYTWTCB7X3DUEEVZMDVGFBRNZPMZDWQWKCFN3EOZQ'; // Too short
  const invalidChecksum =
    'GBBD47UZQ5YLQYYTWTCB7X3DUEEVZMDVGFBRNZPMZDWQWKCFN3EOZQKZ'; // Tampered last char

  describe('isValid', () => {
    it('should return true for a valid address', () => {
      expect(StellarAddressValidator.isValid(validAddress)).toBe(true);
    });

    it('should return false for an address with wrong prefix', () => {
      expect(StellarAddressValidator.isValid(wrongPrefix)).toBe(false);
    });

    it('should return false for an address with wrong length', () => {
      expect(StellarAddressValidator.isValid(wrongLength)).toBe(false);
    });

    it('should return false for an address with an invalid checksum', () => {
      expect(StellarAddressValidator.isValid(invalidChecksum)).toBe(false);
    });

    it('should return false for an empty string', () => {
      expect(StellarAddressValidator.isValid('')).toBe(false);
    });

    it('should return false for undefined or null inputs', () => {
      expect(StellarAddressValidator.isValid(undefined as any)).toBe(false);
      expect(StellarAddressValidator.isValid(null as any)).toBe(false);
    });
  });

  describe('assertValid', () => {
    it('should not throw for a valid address', () => {
      expect(() => StellarAddressValidator.assertValid(validAddress)).not.toThrow();
    });

    it('should throw BadRequestException for invalid addresses', () => {
      const invalidAddresses = [wrongPrefix, wrongLength, invalidChecksum, ''];

      invalidAddresses.forEach((address) => {
        expect(() => StellarAddressValidator.assertValid(address)).toThrow(
          BadRequestException,
        );
        expect(() => StellarAddressValidator.assertValid(address)).toThrow(
          `Invalid Stellar address: ${address}`,
        );
      });
    });
  });
});
