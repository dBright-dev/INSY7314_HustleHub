/**
 * JWT Unit Tests
 */

const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test_secret_key_at_least_32_characters_long_for_testing';

describe('JWT Signing and Verification', () => {
  const payload = { id: 'user123', role: 'Client' };

  it('should sign a token and decode it correctly', () => {
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // header.payload.signature

    const decoded = jwt.verify(token, TEST_SECRET);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
  });

  it('should reject a tampered token', () => {
    const token = jwt.sign(payload, TEST_SECRET);
    const tampered = token.slice(0, -3) + 'xxx';

    expect(() => jwt.verify(tampered, TEST_SECRET)).toThrow();
  });

  it('should reject an expired token', () => {
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });

    expect(() => jwt.verify(token, TEST_SECRET)).toThrow(/jwt expired/);
  });

  it('should reject a token signed with a different secret', () => {
    const token = jwt.sign(payload, 'different_secret');

    expect(() => jwt.verify(token, TEST_SECRET)).toThrow();
  });

  it('should reject an unsigned/invalid token string', () => {
    expect(() => jwt.verify('not.a.jwt', TEST_SECRET)).toThrow();
  });
});
