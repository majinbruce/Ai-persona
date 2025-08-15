const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new ValidationError('Validation failed', errors));
    }
    
    req[property] = value;
    next();
  };
};

// User validation schemas
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 50 characters'
    }),
    
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
    
  password: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    }),
    
  firstName: Joi.string()
    .min(2)
    .max(50)
    .optional(),
    
  lastName: Joi.string()
    .min(2)
    .max(50)
    .optional()
});

const userLoginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'any.required': 'Username or email is required'
    }),
    
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const userUpdateSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .optional(),
    
  lastName: Joi.string()
    .min(2)
    .max(50)
    .optional(),
    
  preferences: Joi.object({
    defaultPersona: Joi.string()
      .valid('hitesh', 'piyush')
      .optional(),
    theme: Joi.string()
      .valid('light', 'dark')
      .optional()
  }).optional()
});

const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
    
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'string.max': 'New password cannot exceed 128 characters',
      'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, and one number'
    })
});

// Chat validation schemas
const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(4000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 4000 characters',
      'any.required': 'Message is required'
    }),
    
  persona: Joi.string()
    .valid('hitesh', 'piyush')
    .required()
    .messages({
      'any.only': 'Persona must be either "hitesh" or "piyush"',
      'any.required': 'Persona is required'
    }),
    
  conversationId: Joi.string()
    .uuid()
    .optional()
    .messages({
      'string.uuid': 'Conversation ID must be a valid UUID'
    })
});

const conversationCreateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 255 characters'
    }),
    
  persona: Joi.string()
    .valid('hitesh', 'piyush')
    .default('hitesh')
    .messages({
      'any.only': 'Persona must be either "hitesh" or "piyush"'
    })
});

const conversationUpdateSchema = Joi.object({
  title: Joi.string()
    .min(1)
    .max(255)
    .optional()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 255 characters'
    }),
    
  persona: Joi.string()
    .valid('hitesh', 'piyush')
    .optional()
    .messages({
      'any.only': 'Persona must be either "hitesh" or "piyush"'
    })
});

// Query parameter validation
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

const conversationQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
    
  persona: Joi.string()
    .valid('hitesh', 'piyush')
    .optional(),
  includeMessages: Joi.boolean()
    .default(false)
});

module.exports = {
  validate,
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  passwordChangeSchema,
  chatMessageSchema,
  conversationCreateSchema,
  conversationUpdateSchema,
  paginationSchema,
  conversationQuerySchema
};