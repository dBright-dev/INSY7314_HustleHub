/**
 * Input Validation Unit Tests
 */

const { body, validationResult } = require('express-validator');

// Recreate the validation chains for isolated testing
const buildRegisterChain = () => [
  body('name').trim().notEmpty().isLength({ min: 2, max: 50 }),
  body('email').trim().notEmpty().isEmail().normalizeEmail(),
  body('password')
    .notEmpty()
    .isLength({ min: 8 })
    .matches(/[a-z]/)
    .matches(/[A-Z]/)
    .matches(/\d/)
    .matches(/[@$!%*?&#^()_\-+=[\]{};:'",.<>/?\\|`~]/),
];

const buildLoginChain = () => [
  body('email').trim().notEmpty().isEmail(),
  body('password').notEmpty(),
];

// Helper to run validation chain
const runChain = async (chain, data) => {
  const req = { body: data };
  for (const validator of chain) {
    await validator.run(req);
  }
  return validationResult(req);
};

describe('Auth Input Validation', () => {
  describe('Registration Validation', () => {
    it('should fail when all fields are missing', async () => {
      const result = await runChain(buildRegisterChain(), {});
      expect(result.isEmpty()).toBe(false);
      expect(result.array().length).toBeGreaterThanOrEqual(3);
    });

    it('should fail with invalid email format', async () => {
      const result = await runChain(buildRegisterChain(), {
        name: 'John Doe',
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with weak password (no uppercase)', async () => {
      const result = await runChain(buildRegisterChain(), {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123!',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with weak password (too short)', async () => {
      const result = await runChain(buildRegisterChain(), {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pa1!',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with weak password (no special character)', async () => {
      const result = await runChain(buildRegisterChain(), {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should pass with fully valid input', async () => {
      const result = await runChain(buildRegisterChain(), {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });
      expect(result.isEmpty()).toBe(true);
    });
  });

  describe('Login Validation', () => {
    it('should fail with missing password', async () => {
      const result = await runChain(buildLoginChain(), {
        email: 'john@example.com',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const result = await runChain(buildLoginChain(), {
        email: 'bad-email',
        password: 'Password123!',
      });
      expect(result.isEmpty()).toBe(false);
    });

    it('should pass with valid login data', async () => {
      const result = await runChain(buildLoginChain(), {
        email: 'john@example.com',
        password: 'Password123!',
      });
      expect(result.isEmpty()).toBe(true);
    });
  });
});
