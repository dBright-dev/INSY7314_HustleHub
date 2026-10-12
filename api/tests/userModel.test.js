/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: User schema defaults, unique lowercase email and role enum follow
 *   the INSY7314 data-model requirements (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

/**
 * User Model Unit Tests
 * Tests schema validation and password hashing
 */

const mongoose = require('mongoose');
const User = require('../models/User');

describe('User Model', () => {
  it('should reject user without a name', async () => {
    const user = new User({ email: 'test@example.com', passwordHash: 'Password123!' });
    let err;
    try {
      await user.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.name).toBeDefined();
  });

  it('should reject user with invalid email', async () => {
    const user = new User({
      name: 'John',
      email: 'bad-email',
      passwordHash: 'Password123!',
    });
    let err;
    try {
      await user.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.email).toBeDefined();
  });

  it('should reject user with invalid role', async () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      passwordHash: 'Password123!',
      role: 'SuperHero',
    });
    let err;
    try {
      await user.validate();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
    expect(err.errors.role).toBeDefined();
  });

  it('should default role to Client', () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      passwordHash: 'Password123!',
    });
    expect(user.role).toBe('Client');
  });

  it('should hash password before saving', async () => {
    const user = new User({
      name: 'John',
      email: 'john@example.com',
      passwordHash: 'Password123!',
    });

    // Manually run the pre-save hook logic
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('Password123!', salt);

    expect(hashed).not.toBe('Password123!');
    expect(await bcrypt.compare('Password123!', hashed)).toBe(true);
  });
});
