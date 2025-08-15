const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'New Conversation'
  },
  
  persona: {
    type: DataTypes.ENUM('hitesh', 'piyush'),
    allowNull: false,
    defaultValue: 'hitesh'
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {
      messageCount: 0,
      lastPersona: 'hitesh',
      tags: []
    }
  }
}, {
  tableName: 'conversations',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['persona'] },
    { fields: ['is_active'] },
    { fields: ['created_at'] }
  ]
});

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'conversations',
      key: 'id'
    }
  },
  
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false
  },
  
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  persona: {
    type: DataTypes.ENUM('hitesh', 'piyush'),
    allowNull: true
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {
      tokensUsed: 0,
      responseTime: 0,
      model: 'gpt-3.5-turbo'
    }
  },
  
  isEdited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'messages',
  indexes: [
    { fields: ['conversation_id'] },
    { fields: ['role'] },
    { fields: ['persona'] },
    { fields: ['created_at'] }
  ]
});

// Define associations
Conversation.hasMany(Message, { 
  foreignKey: 'conversationId', 
  as: 'messages',
  onDelete: 'CASCADE' 
});

Message.belongsTo(Conversation, { 
  foreignKey: 'conversationId', 
  as: 'conversation' 
});

// Instance methods for Conversation
Conversation.prototype.generateTitle = async function() {
  const messages = await this.getMessages({
    limit: 3,
    order: [['createdAt', 'ASC']]
  });
  
  if (messages.length > 0) {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.substring(0, 50);
      this.title = title.length === 50 ? title + '...' : title;
      await this.save();
    }
  }
};

Conversation.prototype.updateMetadata = async function() {
  const messageCount = await Message.count({
    where: { conversationId: this.id }
  });
  
  const lastMessage = await Message.findOne({
    where: { conversationId: this.id },
    order: [['createdAt', 'DESC']]
  });
  
  this.metadata = {
    ...this.metadata,
    messageCount,
    lastPersona: lastMessage?.persona || this.persona,
    updatedAt: new Date()
  };
  
  await this.save();
};

// Class methods
Conversation.findByUserId = async function(userId, options = {}) {
  return this.findAll({
    where: { 
      userId, 
      isActive: true 
    },
    include: [
      {
        model: Message,
        as: 'messages',
        limit: options.includeMessages ? 10 : 0,
        order: [['createdAt', 'DESC']]
      }
    ],
    order: [['updatedAt', 'DESC']],
    ...options
  });
};

Message.findByConversationId = async function(conversationId, options = {}) {
  return this.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    ...options
  });
};

module.exports = { Conversation, Message };