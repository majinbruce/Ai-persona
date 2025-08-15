const { Sequelize } = require('sequelize');
require('dotenv').config();

// Force IPv4 for Node.js DNS resolution
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const testConnection = async () => {
  console.log('Testing database connection...');
  console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
  console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  // Parse the connection URL manually to force IPv4
  const sequelize = new Sequelize('postgres', 'postgres', 'Parineeta@1', {
    host: 'db.xrjcmygvozvjxsmyhwgr.supabase.co',
    port: 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connection successful!');
    
    // Test a simple query
    const result = await sequelize.query('SELECT version()');
    console.log('📊 Database version:', result[0][0].version);
    
    // Check if tables exist
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Existing tables:', tables[0].map(t => t.table_name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  } finally {
    await sequelize.close();
  }
};

testConnection();