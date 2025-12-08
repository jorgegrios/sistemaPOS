"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const express_1 = require("express");
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
exports.verifyToken = verifyToken;
/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        // Find user
        const result = await pool.query('SELECT id, email, password_hash, name, role, restaurant_id, active FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result.rows[0];
        if (!user.active) {
            return res.status(401).json({ error: 'User account is inactive' });
        }
        // Verify password
        const passwordMatch = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            restaurantId: user.restaurant_id
        }, JWT_SECRET, { expiresIn: '24h' });
        // Update last_login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                restaurantId: user.restaurant_id
            }
        });
    }
    catch (error) {
        console.error('[Auth] Login error:', error);
        return res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/auth/verify
 * Verify current token
 */
router.post('/verify', exports.verifyToken, (req, res) => {
    return res.json({
        user: req.user,
        valid: true
    });
});
/**
 * POST /api/v1/auth/logout
 * Logout (client-side: discard token)
 */
router.post('/logout', exports.verifyToken, (req, res) => {
    // Token is invalidated client-side by discarding it
    // Optionally, you could blacklist tokens server-side (advanced)
    return res.json({ ok: true, message: 'Logged out' });
});
/**
 * POST /api/v1/auth/register
 * Register new user (admin only)
 */
router.post('/register', exports.verifyToken, async (req, res) => {
    try {
        // Only admins can register new users
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const { email, password, name, role } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name required' });
        }
        // Check if user exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create user
        const result = await pool.query(`INSERT INTO users (id, restaurant_id, email, password_hash, name, role, active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true)
       RETURNING id, email, name, role`, [req.user.restaurantId, email, passwordHash, name, role || 'waiter']);
        const newUser = result.rows[0];
        return res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
        });
    }
    catch (error) {
        console.error('[Auth] Register error:', error);
        return res.status(500).json({ error: error.message });
    }
});
exports.default = router;
