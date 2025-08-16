const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Try to use IPv4 address directly instead of hostname
const dns = require('dns').promises;

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
    console.log('🔍 Database connection debug:');
    console.log('- DATABASE_URL configured:', !!process.env.DATABASE_URL);
    console.log('- Database URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    console.log('⏳ Attempting database authentication...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');
    logger.info('✅ PostgreSQL connection established successfully');
    
    // Sync models - create tables if they don't exist
    console.log('⏳ Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
    logger.info('🔄 Database models synchronized');
    
    // Handle existing users without passwords (migration fix)
    try {
      const { User } = require('../models');
      const usersWithoutPassword = await User.findAll({
        where: {
          password: null
        }
      });
      
      if (usersWithoutPassword.length > 0) {
        console.log(`⚠️ Found ${usersWithoutPassword.length} users without passwords - cleaning up...`);
        await User.destroy({
          where: {
            password: null
          },
          force: true // Hard delete
        });
        console.log('✅ Cleaned up users without passwords');
        logger.info(`Cleaned up ${usersWithoutPassword.length} users without passwords`);
      }
    } catch (migrationError) {
      console.log('ℹ️ Migration cleanup skipped (table may not exist yet)');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('❌ Full error:', error);
    logger.error('❌ Unable to connect to PostgreSQL database:', error);
    logger.error('Database URL format should be: postgresql://user:pass@host:port/dbname');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDatabase };