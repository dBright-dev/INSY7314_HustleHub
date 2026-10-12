/**
 * REFERENCES (IIE Harvard style)
 * - In-text: schema-level validation plus pre-save bcrypt hashing follows
 *   the INSY7314 data-layer security guidance (The IIE, 2026).
 * - Reference list:
 *   The Independent Institute of Education (IIE), 2026. Information Systems 3D
 *   [INSY7314 Module Manual]. Unpublished manuscript. [Confirm LU/page no. in
 *   printed MM.]
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Excluded from queries by default (security)
    },
    role: {
      type: String,
      enum: {
        values: ['Client', 'Freelancer', 'Admin'],
        message: 'Role must be Client, Freelancer, or Admin',
      },
      default: 'Client',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: {
      // Remove sensitive fields when converting to JSON
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Pre-save middleware: Hash password before saving
 * Only hashes if password field was modified
 */
userSchema.pre('save', async function () {
  // Only hash if password field is new or modified
  if (!this.isModified('passwordHash')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

/**
 * Instance method: Compare plain password with stored hash
 * @param {string} enteredPassword - Plain text password to verify
 * @returns {Promise<boolean>} True if matches, false otherwise
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);