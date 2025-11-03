const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (this.pool) {
      return this.pool;
    }

    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || '209.38.233.46',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'cron',
        password: process.env.DB_PASSWORD || 'test',
        database: process.env.DB_NAME || 'asterisk',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });

      // Test connection
      const connection = await this.pool.getConnection();
      console.log('✓ Database connected successfully');
      connection.release();

      return this.pool;
    } catch (error) {
      console.error('✗ Database connection error:', error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    try {
      if (!this.pool) {
        await this.connect();
      }

      const [rows] = await this.pool.execute(sql, params);

      return rows;
    } catch (error) {
      console.error('[Database] Query error:', error.message);
      console.error('[Database] SQL:', sql.substring(0, 200));
      console.error('[Database] Params:', params);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('Database connection closed');
    }
  }
}

// Singleton instance
const database = new Database();

module.exports = database;
