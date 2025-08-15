const express = require('express');
const {
  register,
  login,
  logout,
  refreshTokens,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
} = require('../controllers/authController');
const { authenticate, refreshToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  passwordChangeSchema
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(userRegistrationSchema), register);
router.post('/login', validate(userLoginSchema), login);
router.post('/refresh', refreshToken, refreshTokens);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', validate(userUpdateSchema), updateProfile);
router.put('/password', validate(passwordChangeSchema), changePassword);
router.delete('/account', deactivateAccount);

module.exports = router;