const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Use DATABASE_URL for production (Supabase/Railway) or individual vars for development
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true,
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'persona_chatbot',
      process.env.DB_USER || 'postgres', 
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => logger.debug(msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          paranoid: true,
        }
      }
    );

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connection established successfully');
    
    // Sync models - create tables if they don't exist
    await sequelize.sync({ alter: false });
    logger.info('🔄 Database models synchronized');
    
  } catch (error) {
    logger.error('❌ Unable to connect to PostgreSQL database:', error);
    logger.error('Database URL format should be: postgresql://user:pass@host:port/dbname');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDatabase };