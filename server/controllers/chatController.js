const OpenAI = require('openai');
const { Conversation, Message } = require('../models');
const { HITESH_CHOUDHARY_PROMPT, PIYUSH_GARG_PROMPT } = require('../prompts');
const { ENHANCED_HITESH_CHOUDHARY_PROMPT, ENHANCED_PIYUSH_GARG_PROMPT } = require('../enhancedPrompts');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const { catchAsync } = require('../middleware/errorHandler');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Persona configuration with enhanced prompts using scraped data
const PERSONAS = {
  hitesh: {
    name: 'Hitesh Choudhary',
    prompt: ENHANCED_HITESH_CHOUDHARY_PROMPT,
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 2000
  },
  piyush: {
    name: 'Piyush Garg',
    prompt: ENHANCED_PIYUSH_GARG_PROMPT,
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2000
  }
};

const getPersonas = catchAsync(async (req, res, next) => {
  const personaList = Object.keys(PERSONAS).map(key => ({
    id: key,
    name: PERSONAS[key].name,
    description: key === 'hitesh' 
      ? 'Warm, encouraging teacher who loves chai and uses Hindi/Hinglish'
      : 'Direct, practical educator focused on real-world projects and clean code'
  }));

  res.status(200).json({
    status: 'success',
    data: {
      personas: personaList
    }
  });
});

const sendMessage = catchAsync(async (req, res, next) => {
  const startTime = Date.now();
  const { message, persona, conversationId } = req.body;
  const userId = req.user?.id;

  // Validate persona
  if (!PERSONAS[persona]) {
    return next(new AppError('Invalid persona specified', 400));
  }

  const selectedPersona = PERSONAS[persona];
  let conversation;

  try {
    // Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findOne({
        where: { 
          id: conversationId, 
          userId,
          isActive: true 
        }
      });
      
      if (!conversation) {
        return next(new AppError('Conversation not found', 404));
      }
    } else if (userId) {
      // Create new conversation for authenticated users
      conversation = await Conversation.create({
        userId,
        persona,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });
    }

    // Get conversation history with enhanced context
    let messages = [];
    let userProfile = {};
    
    if (conversation) {
      // Get recent messages for context (increased from 10 to 20)
      const history = await Message.findByConversationId(conversation.id, {
        limit: 20,
        order: [['createdAt', 'DESC']]
      });
      
      messages = history.reverse().map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt
      }));
    }

    // Build user profile from ALL conversations (not just current one)
    if (userId) {
      userProfile = await buildUserProfile(userId, conversation?.id);
      
      // Debug log for user profile
      logger.info('📋 User Profile Built:', {
        userId,
        userName: userProfile.userName,
        totalMessages: userProfile.totalMessages,
        conversationCount: userProfile.conversationCount
      });
    }

    // Prepare enhanced system prompt with user context
    const enhancedSystemPrompt = await createEnhancedSystemPrompt(
      selectedPersona.prompt, 
      userProfile, 
      userId
    );
    
    const openAIMessages = [
      { role: 'system', content: enhancedSystemPrompt }
    ];

    // Add conversation history with chain-of-thought context
    const contextualMessages = await buildChainOfThoughtContext(messages, userProfile, selectedPersona);
    openAIMessages.push(...contextualMessages);

    // Add current message with enhanced context
    const enhancedCurrentMessage = await enhanceCurrentMessage(message, userProfile, messages);
    openAIMessages.push({ role: 'user', content: enhancedCurrentMessage });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: selectedPersona.model,
      messages: openAIMessages,
      temperature: selectedPersona.temperature,
      max_tokens: selectedPersona.maxTokens,
      presence_penalty: 0.6,
      frequency_penalty: 0.5,
      user: userId || 'anonymous'
    });

    const response = completion.choices[0].message.content;
    const responseTime = Date.now() - startTime;
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Save messages to database if user is authenticated
    if (conversation) {
      // Save user message
      await Message.create({
        conversationId: conversation.id,
        role: 'user',
        content: message,
        metadata: {
          model: selectedPersona.model,
          timestamp: new Date()
        }
      });

      // Save assistant message
      await Message.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
        persona,
        metadata: {
          tokensUsed,
          responseTime,
          model: selectedPersona.model,
          temperature: selectedPersona.temperature
        }
      });

      // Update conversation metadata
      await conversation.updateMetadata();
    }

    // Log business event
    logger.business('Chat message processed', {
      userId: userId || 'anonymous',
      conversationId: conversation?.id,
      persona,
      messageLength: message.length,
      responseTime,
      tokensUsed,
      model: selectedPersona.model
    });

    // Log for debugging
    logger.info(`📝 ${selectedPersona.name} response generated`, {
      messagePreview: message.substring(0, 50),
      responseTime,
      tokensUsed
    });

    res.status(200).json({
      status: 'success',
      data: {
        response,
        persona,
        personaName: selectedPersona.name,
        conversationId: conversation?.id,
        tokensUsed,
        responseTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('OpenAI API Error:', {
      error: error.message,
      persona,
      userId,
      conversationId
    });
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      return next(new AppError('OpenAI API authentication failed', 502));
    } else if (error.status === 429) {
      return next(new AppError('Rate limit exceeded. Please try again later.', 429));
    } else if (error.status === 400) {
      return next(new AppError('Invalid request to OpenAI API', 400));
    }

    return next(new AppError('Failed to generate response', 502));
  }
});

const getConversations = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, persona, includeMessages = false } = req.query;

  const where = { 
    userId, 
    isActive: true 
  };
  
  if (persona) {
    where.persona = persona;
  }

  const offset = (page - 1) * limit;

  const { count, rows: conversations } = await Conversation.findAndCountAll({
    where,
    include: includeMessages ? [
      {
        model: Message,
        as: 'messages',
        limit: 5,
        order: [['createdAt', 'DESC']]
      }
    ] : [],
    order: [['updatedAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.status(200).json({
    status: 'success',
    data: {
      conversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

const getConversation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findOne({
    where: { 
      id, 
      userId,
      isActive: true 
    },
    include: [
      {
        model: Message,
        as: 'messages',
        order: [['createdAt', 'ASC']]
      }
    ]
  });

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      conversation
    }
  });
});

const createConversation = catchAsync(async (req, res, next) => {
  const { title, persona = 'hitesh' } = req.body;
  const userId = req.user.id;

  const conversation = await Conversation.create({
    userId,
    title,
    persona
  });

  logger.business('Conversation created', {
    userId,
    conversationId: conversation.id,
    persona
  });

  res.status(201).json({
    status: 'success',
    message: 'Conversation created successfully',
    data: {
      conversation
    }
  });
});

const updateConversation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, persona } = req.body;
  const userId = req.user.id;

  const conversation = await Conversation.findOne({
    where: { 
      id, 
      userId,
      isActive: true 
    }
  });

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  if (title !== undefined) conversation.title = title;
  if (persona !== undefined) conversation.persona = persona;

  await conversation.save();

  res.status(200).json({
    status: 'success',
    message: 'Conversation updated successfully',
    data: {
      conversation
    }
  });
});

const deleteConversation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findOne({
    where: { 
      id, 
      userId,
      isActive: true 
    }
  });

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Soft delete
  conversation.isActive = false;
  await conversation.save();

  logger.business('Conversation deleted', {
    userId,
    conversationId: conversation.id
  });

  res.status(200).json({
    status: 'success',
    message: 'Conversation deleted successfully'
  });
});

// Helper function to build user profile from conversation history
const buildUserProfile = async (userId, conversationId = null) => {
  try {
    // Get ALL user messages from ALL conversations
    const allUserConversations = await Conversation.findAll({
      where: { 
        userId,
        isActive: true
      },
      include: [{
        model: Message,
        as: 'messages',
        where: { role: 'user' },
        required: false
      }]
    });

    // Flatten all user messages from all conversations
    let allUserMessages = [];
    allUserConversations.forEach(conv => {
      if (conv.messages) {
        allUserMessages = allUserMessages.concat(conv.messages);
      }
    });

    // Sort by most recent
    allUserMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Take the most recent 100 messages for analysis
    const userMessages = allUserMessages.slice(0, 100);

    // Extract user preferences and information
    const profile = {
      userName: extractUserName(userMessages),
      totalMessages: userMessages.length,
      conversationCount: allUserConversations.length,
      learningTopics: extractTopics(userMessages),
      preferredLanguage: detectLanguagePreference(userMessages),
      experienceLevel: assessExperienceLevel(userMessages),
      commonQuestions: extractCommonQuestionTypes(userMessages),
      lastInteraction: userMessages[0]?.createdAt || null
    };

    return profile;
  } catch (error) {
    logger.error('Error building user profile:', error);
    return {};
  }
};

// Helper function to extract user's name from messages
const extractUserName = (messages) => {
  const namePatterns = [
    /(?:mera naam|my name is|i am|i'm|main hun|naam hai)\s+([a-zA-Z]+)/i,
    /(?:call me|you can call me)\s+([a-zA-Z]+)/i,
    /^([a-zA-Z]+)\s+(?:hun|hai|here|speaking)$/i,
    /(?:this is|yeh hai)\s+([a-zA-Z]+)/i,
    /^([a-zA-Z]+)$/i,  // Single word that could be a name
    /(?:hi|hello|namaste).*?(?:i'm|main)\s+([a-zA-Z]+)/i
  ];

  // Store potential names with confidence scores
  const namesCandidates = {};

  for (const msg of messages) {
    const content = msg.content.trim();
    
    for (let i = 0; i < namePatterns.length; i++) {
      const pattern = namePatterns[i];
      const match = content.match(pattern);
      if (match && match[1]) {
        const name = match[1].toLowerCase();
        // Filter out common non-name words
        const commonWords = [
          'kya', 'hai', 'what', 'how', 'the', 'and', 'but', 'that', 'this', 
          'hello', 'hi', 'yes', 'no', 'haan', 'nahi', 'thanks', 'ok', 'okay',
          'javascript', 'react', 'node', 'code', 'coding', 'programming'
        ];
        
        if (!commonWords.includes(name) && name.length > 1 && name.length < 15) {
          // Higher confidence for explicit name patterns
          const confidence = i < 4 ? 10 : 5;
          namesCandidates[name] = (namesCandidates[name] || 0) + confidence;
        }
      }
    }
  }

  // Return name with highest confidence
  if (Object.keys(namesCandidates).length > 0) {
    const bestName = Object.entries(namesCandidates)
      .sort(([,a], [,b]) => b - a)[0][0];
    return bestName.charAt(0).toUpperCase() + bestName.slice(1).toLowerCase();
  }
  
  return null;
};

// Helper function to extract topics from user messages
const extractTopics = (messages) => {
  const topics = new Set();
  const techKeywords = [
    'javascript', 'react', 'node', 'python', 'css', 'html', 'api', 'database',
    'mongodb', 'mysql', 'express', 'vue', 'angular', 'typescript', 'docker',
    'aws', 'git', 'github', 'authentication', 'backend', 'frontend', 'fullstack'
  ];

  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    techKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topics.add(keyword);
      }
    });
  });

  return Array.from(topics).slice(0, 10); // Top 10 topics
};

// Helper function to detect language preference
const detectLanguagePreference = (messages) => {
  let hindiCount = 0;
  let englishCount = 0;

  messages.forEach(msg => {
    const content = msg.content;
    // Simple heuristic: check for Hindi/Hinglish patterns
    if (/[क-ह]/.test(content) || /\b(hai|hain|kya|kaise|samjh|nahi)\b/i.test(content)) {
      hindiCount++;
    } else {
      englishCount++;
    }
  });

  return hindiCount > englishCount * 0.3 ? 'hinglish' : 'english';
};

// Helper function to assess experience level
const assessExperienceLevel = (messages) => {
  const advancedKeywords = [
    'microservices', 'kubernetes', 'design patterns', 'architecture', 
    'scaling', 'performance', 'optimization', 'async/await', 'promises',
    'middleware', 'cors', 'jwt', 'oauth', 'redis', 'caching'
  ];
  
  const beginnerKeywords = [
    'what is', 'how to', 'basics', 'beginner', 'start', 'learn',
    'simple', 'easy', 'basic', 'introduction', 'tutorial'
  ];

  let advancedScore = 0;
  let beginnerScore = 0;

  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    advancedKeywords.forEach(keyword => {
      if (content.includes(keyword)) advancedScore++;
    });
    beginnerKeywords.forEach(keyword => {
      if (content.includes(keyword)) beginnerScore++;
    });
  });

  if (advancedScore > beginnerScore) return 'advanced';
  if (beginnerScore > advancedScore * 2) return 'beginner';
  return 'intermediate';
};

// Helper function to extract common question types
const extractCommonQuestionTypes = (messages) => {
  const questionTypes = {
    debugging: 0,
    conceptual: 0,
    project: 0,
    career: 0
  };

  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    if (content.includes('error') || content.includes('bug') || content.includes('not working')) {
      questionTypes.debugging++;
    }
    if (content.includes('what is') || content.includes('explain') || content.includes('understand')) {
      questionTypes.conceptual++;
    }
    if (content.includes('project') || content.includes('build') || content.includes('create')) {
      questionTypes.project++;
    }
    if (content.includes('career') || content.includes('job') || content.includes('interview')) {
      questionTypes.career++;
    }
  });

  return Object.entries(questionTypes)
    .sort(([,a], [,b]) => b - a)
    .map(([type]) => type)
    .slice(0, 2);
};

// Helper function to create enhanced system prompt
const createEnhancedSystemPrompt = async (basePrompt, userProfile, userId) => {
  let enhancedPrompt = basePrompt;

  if (Object.keys(userProfile).length > 0) {
    const contextSection = `

CURRENT USER CONTEXT:
- User Name: ${userProfile.userName || 'Not provided yet'}
- Experience Level: ${userProfile.experienceLevel || 'Unknown'}
- Preferred Communication: ${userProfile.preferredLanguage || 'English'}
- Learning Focus: ${userProfile.learningTopics?.join(', ') || 'General programming'}
- Common Question Types: ${userProfile.commonQuestions?.join(', ') || 'Various'}
- Total Conversations: ${userProfile.conversationCount || 0}
- Messages in Current Session: ${userProfile.totalMessages || 0}

PERSONALIZATION INSTRUCTIONS:
${userProfile.userName ? `- ALWAYS address the user by their name: ${userProfile.userName}` : '- Ask for their name if not provided yet'}
- Adapt your teaching style to their experience level
- Use their preferred language style (Hinglish vs English)
- Reference their previous learning topics when relevant
- Build upon concepts they've already discussed
- Remember their name and personal details throughout the conversation
- Acknowledge their progress and learning journey

MEMORY AND CONTINUITY:
- Remember what you've taught them before
- Don't repeat basic explanations if they've shown advanced understanding
- Reference previous conversations naturally when appropriate
- Adapt complexity based on their demonstrated knowledge

CHAIN-OF-THOUGHT REASONING:
- Think step-by-step before providing solutions
- Show your reasoning process when explaining complex concepts
- Connect new information to previously discussed topics
- Ask clarifying questions when the context is ambiguous
- Provide multiple approaches when appropriate`;

    enhancedPrompt += contextSection;
  }

  return enhancedPrompt;
};

// Helper function to build chain-of-thought context from conversation history
const buildChainOfThoughtContext = async (messages, userProfile, persona) => {
  const contextualMessages = [];
  
  // Analyze conversation flow and add contextual markers
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const nextMsg = messages[i + 1];
    
    if (msg.role !== 'system') {
      let content = msg.content;
      
      // Add chain-of-thought context for assistant messages
      if (msg.role === 'assistant' && nextMsg && nextMsg.role === 'user') {
        // Check if the next user message indicates confusion or follow-up
        if (nextMsg.content.toLowerCase().includes('confused') || 
            nextMsg.content.toLowerCase().includes("didn't understand") ||
            nextMsg.content.toLowerCase().includes('explain again')) {
          content += '\n[Note: User may need further clarification on this topic]';
        }
      }
      
      // Add learning progression markers
      if (msg.role === 'user') {
        const complexity = assessMessageComplexity(msg.content);
        content += `\n[User message complexity: ${complexity}]`;
      }
      
      contextualMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: content
      });
    }
  }
  
  return contextualMessages;
};

// Helper function to enhance current message with context
const enhanceCurrentMessage = async (message, userProfile, conversationHistory) => {
  let enhancedMessage = message;
  
  // Add context markers based on conversation history
  if (conversationHistory.length > 0) {
    const recentTopics = extractRecentTopics(conversationHistory);
    if (recentTopics.length > 0) {
      enhancedMessage += `\n[Recent conversation topics: ${recentTopics.join(', ')}]`;
    }
  }
  
  // Add user context markers
  if (userProfile.experienceLevel) {
    enhancedMessage += `\n[User experience level: ${userProfile.experienceLevel}]`;
  }
  
  // Check for follow-up patterns
  const isFollowUp = detectFollowUpPattern(message, conversationHistory);
  if (isFollowUp) {
    enhancedMessage += '\n[This appears to be a follow-up question to previous discussion]';
  }
  
  return enhancedMessage;
};

// Helper function to assess message complexity
const assessMessageComplexity = (content) => {
  const advancedTerms = ['architecture', 'microservices', 'optimization', 'performance', 'scalability', 'design patterns'];
  const intermediateTerms = ['async', 'promises', 'components', 'state management', 'api', 'database'];
  const beginnerTerms = ['what is', 'how to', 'basic', 'simple', 'beginner', 'start'];
  
  const contentLower = content.toLowerCase();
  
  if (advancedTerms.some(term => contentLower.includes(term))) return 'advanced';
  if (intermediateTerms.some(term => contentLower.includes(term))) return 'intermediate';
  if (beginnerTerms.some(term => contentLower.includes(term))) return 'beginner';
  
  return 'general';
};

// Helper function to extract recent topics from conversation
const extractRecentTopics = (messages) => {
  const topics = new Set();
  const techKeywords = [
    'react', 'javascript', 'node', 'python', 'css', 'html', 'api', 'database',
    'mongodb', 'mysql', 'express', 'docker', 'aws', 'git', 'typescript'
  ];
  
  // Look at last 5 messages
  const recentMessages = messages.slice(-5);
  
  recentMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    techKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        topics.add(keyword);
      }
    });
  });
  
  return Array.from(topics).slice(0, 3); // Top 3 recent topics
};

// Helper function to detect follow-up patterns
const detectFollowUpPattern = (currentMessage, history) => {
  if (history.length === 0) return false;
  
  const lastUserMessage = [...history].reverse().find(msg => msg.role === 'user');
  if (!lastUserMessage) return false;
  
  const currentLower = currentMessage.toLowerCase();
  const patterns = [
    'can you explain more',
    'still confused',
    'what about',
    'how about',
    'also',
    'and what',
    'but what',
    'follow up'
  ];
  
  return patterns.some(pattern => currentLower.includes(pattern));
};

module.exports = {
  getPersonas,
  sendMessage,
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation
};