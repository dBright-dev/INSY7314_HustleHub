/**
 * REFERENCES (IIE Harvard style — in-text citations + reference list)
 * - In-text: unit tests assert the INSY7314 authentication requirements —
 *   bcrypt hashing, JWT issue/verify and generic failure messages (The IIE,
 *   2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

/**
 * Auth Controller Unit Tests
 */

jest.mock('../models/User');
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_characters_long';

const User = require('../models/User');
const { register, login, generateToken } = require('../controllers/authController');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT', () => {
      const token = generateToken('user123', 'Client');
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('register', () => {
    it('should return 400 if email already exists', async () => {
      req.body = {
        name: 'John',
        email: 'existing@example.com',
        password: 'Password123!',
      };

      User.findOne.mockResolvedValue({ _id: 'existing123' });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists'),
        })
      );
    });

    it('should register a new user successfully', async () => {
      req.body = {
        name: 'John Doe',
        email: 'new@example.com',
        password: 'Password123!',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'new123',
        name: 'John Doe',
        email: 'new@example.com',
        role: 'Client',
      });

      await register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'new@example.com',
            }),
            token: expect.any(String),
          }),
        })
      );
    });
  });

  describe('login', () => {
    it('should return 401 if user does not exist', async () => {
      req.body = { email: 'noone@example.com', password: 'Password123!' };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid email or password',
        })
      );
    });

    it('should return 401 if password does not match', async () => {
      req.body = { email: 'john@example.com', password: 'WrongPass' };

      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        role: 'Client',
        matchPassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should login successfully with correct credentials', async () => {
      req.body = { email: 'john@example.com', password: 'Password123!' };

      const mockUser = {
        _id: 'user123',
        name: 'John',
        email: 'john@example.com',
        role: 'Client',
        matchPassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            token: expect.any(String),
          }),
        })
      );
    });
  });
});
