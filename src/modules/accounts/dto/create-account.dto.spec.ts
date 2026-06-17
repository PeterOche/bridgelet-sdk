import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAccountDto } from './create-account.dto.js';

// Precisely sized Stellar public keys: G + 55 uppercase alphanumeric chars = 56 total
const VALID_KEY = 'G' + 'A'.repeat(55); // 56 chars  ✓
const SHORT_KEY = 'G' + 'A'.repeat(54); // 55 chars  ✗
const LONG_KEY = 'G' + 'A'.repeat(56); // 57 chars  ✗

// A fully valid base object — all tests override only the field under test
const validBase = {
  fundingSource: VALID_KEY,
  amount: '100',
  asset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  expiresIn: 3600,
};

function makeDto(overrides: Record<string, unknown>): CreateAccountDto {
  return plainToInstance(CreateAccountDto, { ...validBase, ...overrides });
}

async function errorsFor(
  overrides: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(makeDto(overrides));
  return errors.map((e) => e.property);
}

// ─── fundingSource ────────────────────────────────────────────────────────────

describe('CreateAccountDto — fundingSource', () => {
  it('accepts a valid Stellar public key (56 chars, starts with G, uppercase alphanumeric)', async () => {
    const errors = await errorsFor({ fundingSource: VALID_KEY });
    expect(errors).not.toContain('fundingSource');
  });

  it('rejects a key that is too short (55 chars)', async () => {
    const errors = await errorsFor({ fundingSource: SHORT_KEY });
    expect(errors).toContain('fundingSource');
  });

  it('rejects a key that is too long (57 chars)', async () => {
    const errors = await errorsFor({ fundingSource: LONG_KEY });
    expect(errors).toContain('fundingSource');
  });

  it('rejects a key that starts with a lowercase letter', async () => {
    const errors = await errorsFor({ fundingSource: 'g' + 'A'.repeat(55) });
    expect(errors).toContain('fundingSource');
  });

  it('rejects a key that starts with a non-G uppercase letter (e.g. A)', async () => {
    const errors = await errorsFor({ fundingSource: 'A' + 'A'.repeat(55) });
    expect(errors).toContain('fundingSource');
  });

  it('rejects a key containing a special character', async () => {
    const errors = await errorsFor({
      fundingSource: 'G' + 'A'.repeat(54) + '!',
    });
    expect(errors).toContain('fundingSource');
  });

  it('rejects an empty string', async () => {
    const errors = await errorsFor({ fundingSource: '' });
    expect(errors).toContain('fundingSource');
  });
});

// ─── asset ────────────────────────────────────────────────────────────────────

describe('CreateAccountDto — asset', () => {
  it('accepts a valid issued asset (USDC with full issuer key)', async () => {
    const errors = await errorsFor({
      asset: 'USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    });
    expect(errors).not.toContain('asset');
  });

  it('accepts a valid alphanumeric code with minimal issuer (e.g. USDC1:G...)', async () => {
    const errors = await errorsFor({
      asset: 'USDC1:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    });
    expect(errors).not.toContain('asset');
  });

  it('accepts the special-case string "native"', async () => {
    const errors = await errorsFor({ asset: 'native' });
    expect(errors).not.toContain('asset');
  });

  it('rejects an asset code with no issuer (e.g. "USDC")', async () => {
    const errors = await errorsFor({ asset: 'USDC' });
    expect(errors).toContain('asset');
  });

  it('rejects an asset code that is too long (13 chars before colon)', async () => {
    const errors = await errorsFor({
      asset:
        'TOOLONGCODE1X:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    });
    expect(errors).toContain('asset');
  });

  it('rejects a lowercase asset code (e.g. "usdc:G...")', async () => {
    const errors = await errorsFor({
      asset: 'usdc:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    });
    expect(errors).toContain('asset');
  });

  it('rejects an asset with an invalid issuer (wrong length)', async () => {
    const errors = await errorsFor({ asset: 'USDC:GBADISSUER' });
    expect(errors).toContain('asset');
  });

  it('rejects an asset with an invalid issuer (does not start with G)', async () => {
    const errors = await errorsFor({
      asset: 'USDC:ABBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    });
    expect(errors).toContain('asset');
  });

  it('rejects an empty string', async () => {
    const errors = await errorsFor({ asset: '' });
    expect(errors).toContain('asset');
  });
});
