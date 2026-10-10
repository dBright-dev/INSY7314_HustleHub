/*
 * Password Hashing Unit Tests
 */

const bcrypt = require('bcryptjs');

describe('Password Hashing (bcrypt)', () => {
  const plainPassword = 'TestPass123!';

  it('should hash a password and produce a different string', async () => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(plainPassword, salt);

    expect(hashed).toBeDefined();
    expect(hashed).not.toBe(plainPassword);
    expect(hashed.length).toBeGreaterThan(20);
  });

  it('should verify a correct password against its hash', async () => {
    const hashed = await bcrypt.hash(plainPassword, 10);
    const isValid = await bcrypt.compare(plainPassword, hashed);

    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hashed = await bcrypt.hash(plainPassword, 10);
    const isValid = await bcrypt.compare('WrongPassword123!', hashed);

    expect(isValid).toBe(false);
  });

  it('should produce different hashes for the same password (salt randomness)', async () => {
    const hash1 = await bcrypt.hash(plainPassword, 10);
    const hash2 = await bcrypt.hash(plainPassword, 10);

    expect(hash1).not.toBe(hash2);
    // But both should verify
    expect(await bcrypt.compare(plainPassword, hash1)).toBe(true);
    expect(await bcrypt.compare(plainPassword, hash2)).toBe(true);
  });

  it('should use 10 salt rounds (INSY714 requirement)', async () => {
    const hashed = await bcrypt.hash(plainPassword, 10);
    // bcrypt hash format: $2a$10$... (10 is the cost factor)
    expect(hashed).toMatch(/^\$2[aby]?\$10\$/);
  });
});
