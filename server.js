import express from 'express';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'baokuan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Team tree endpoint - returns full 3-level member lists
app.get('/api/agents/:agentId/team-tree', authenticateToken, async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const connection = await pool.getConnection();

    // Level 1: 直接下线
    const [level1] = await connection.query(
      `SELECT a.id, u.name, u.email, a.status, a.created_at, a.wallet_balance
       FROM agents a
       JOIN users u ON a.user_id = u.id
       WHERE a.referrer_id = ?
       ORDER BY a.created_at DESC`,
      [agentId]
    );

    // Level 2: level1 的下线
    let level2Members = [];
    if (level1.length > 0) {
      const level1Ids = level1.map(a => a.id);
      const placeholders = level1Ids.map(() => '?').join(',');
      const [l2] = await connection.query(
        `SELECT a.id, u.name, u.email, a.status, a.created_at, a.referrer_id
         FROM agents a
         JOIN users u ON a.user_id = u.id
         WHERE a.referrer_id IN (${placeholders})
         ORDER BY a.created_at DESC`,
        level1Ids
      );
      level2Members = l2;
    }

    // Level 3: level2 的下线
    let level3Members = [];
    if (level2Members.length > 0) {
      const level2Ids = level2Members.map(a => a.id);
      const placeholders = level2Ids.map(() => '?').join(',');
      const [l3] = await connection.query(
        `SELECT a.id, u.name, u.email, a.status, a.created_at, a.referrer_id
         FROM agents a
         JOIN users u ON a.user_id = u.id
         WHERE a.referrer_id IN (${placeholders})
         ORDER BY a.created_at DESC`,
        level2Ids
      );
      level3Members = l3;
    }

    connection.release();

    res.json({
      success: true,
      data: {
        agentId,
        level1: { count: level1.length, members: level1 },
        level2: { count: level2Members.length, members: level2Members },
        level3: { count: level3Members.length, members: level3Members }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
