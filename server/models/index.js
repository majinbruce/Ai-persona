const User = require('./User');
const { Conversation, Message } = require('./Conversation');

// Define associations
User.hasMany(Conversation, { 
  foreignKey: 'userId', 
  as: 'conversations',
  onDelete: 'CASCADE' 
});

Conversation.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

module.exports = {
  User,
  Conversation,
  Message
};