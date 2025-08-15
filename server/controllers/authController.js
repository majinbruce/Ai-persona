const { User } = require('../models');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../middleware/errorHandler');

const setTokenCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  };
  
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const register = catchAsync(async (req, res, next) => {
  const { username, email, password, firstName, lastName } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 409));
  }
  
  // Create user
  const user = await User.create({
    username,
    email,
    password,
    firstName,
    lastName
  });
  
  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();
  
  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);
  
  // Log business event
  logger.business('User registered', {
    userId: user.id,
    username: user.username,
    email: user.email
  });
  
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: user.toSafeJSON(),
      accessToken
    }
  });
});

const login = catchAsync(async (req, res, next) => {
  const { identifier, password } = req.body;
  
  // Find user by email or username
  const user = await User.findByEmailOrUsername(identifier);
  if (!user) {
    logger.security('Login attempt with invalid credentials', {
      identifier,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return next(new AppError('Invalid credentials', 401));
  }
  
  // Check if user is active
  if (!user.isActive) {
    logger.security('Login attempt with inactive account', {
      userId: user.id,
      ip: req.ip
    });
    return next(new AppError('Account is inactive', 401));
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.security('Login attempt with invalid password', {
      userId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    return next(new AppError('Invalid credentials', 401));
  }
  
  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  // Save refresh token and update last login
  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();
  
  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);
  
  // Log business event
  logger.business('User logged in', {
    userId: user.id,
    username: user.username,
    ip: req.ip
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully',
    data: {
      user: user.toSafeJSON(),
      accessToken
    }
  });
});

const logout = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  // Clear refresh token from database
  user.refreshToken = null;
  await user.save();
  
  // Clear cookies
  clearTokenCookies(res);
  
  logger.business('User logged out', {
    userId: user.id,
    username: user.username
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

const refreshTokens = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  // Generate new tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  // Update refresh token in database
  user.refreshToken = refreshToken;
  await user.save();
  
  // Set new cookies
  setTokenCookies(res, accessToken, refreshToken);
  
  res.status(200).json({
    status: 'success',
    message: 'Tokens refreshed successfully',
    data: {
      accessToken
    }
  });
});

const getProfile = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'refreshToken'] }
  });
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      user: user.toSafeJSON()
    }
  });
});

const updateProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, preferences } = req.body;
  const user = req.user;
  
  // Update fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (preferences !== undefined) {
    user.preferences = { ...user.preferences, ...preferences };
  }
  
  await user.save();
  
  logger.business('User profile updated', {
    userId: user.id,
    changes: { firstName, lastName, preferences }
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: user.toSafeJSON()
    }
  });
});

const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;
  
  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }
  
  // Update password
  user.password = newPassword;
  user.refreshToken = null; // Invalidate all refresh tokens
  await user.save();
  
  // Clear cookies to force re-login
  clearTokenCookies(res);
  
  logger.business('User password changed', {
    userId: user.id
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully. Please log in again.'
  });
});

const deactivateAccount = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  // Soft delete user
  user.isActive = false;
  user.refreshToken = null;
  await user.save();
  
  // Clear cookies
  clearTokenCookies(res);
  
  logger.business('User account deactivated', {
    userId: user.id,
    username: user.username
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Account deactivated successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount
};