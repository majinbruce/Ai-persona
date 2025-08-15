const express = require('express');
const {
  getPersonas,
  sendMessage,
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation
} = require('../controllers/chatController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const {
  chatMessageSchema,
  conversationCreateSchema,
  conversationUpdateSchema,
  conversationQuerySchema
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/personas', getPersonas);

// Chat endpoint - works for both authenticated and anonymous users
router.post('/', 
  optionalAuth, // Optional authentication
  validate(chatMessageSchema), 
  sendMessage
);

// Protected conversation routes
router.use(authenticate); // All routes below require authentication

router.get('/conversations', 
  validate(conversationQuerySchema, 'query'), 
  getConversations
);

router.post('/conversations', 
  validate(conversationCreateSchema), 
  createConversation
);

router.get('/conversations/:id', getConversation);

router.put('/conversations/:id', 
  validate(conversationUpdateSchema), 
  updateConversation
);

router.delete('/conversations/:id', deleteConversation);

module.exports = router;