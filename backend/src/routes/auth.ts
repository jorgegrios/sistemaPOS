import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    restaurantId: string;
    companyId: string;
  };
}

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, companySlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const slug = companySlug || 'default';

    // Find user with company context
    const result = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.name, u.role, u.restaurant_id, u.company_id, u.active 
       FROM users u
       JOIN companies c ON u.company_id = c.id
       WHERE u.email = $1 AND c.slug = $2`,
      [email, slug]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or company' });
    }

    const user = result.rows[0];

    if (!user.active) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
        companyId: user.company_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurant_id,
        companyId: user.company_id
      }
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/auth/verify
 * Verify current token
 */
router.post('/verify', verifyToken, (req: AuthRequest, res: Response) => {
  return res.json({
    user: req.user,
    valid: true
  });
});

/**
 * POST /api/v1/auth/logout
 * Logout (client-side: discard token)
 */
router.post('/logout', verifyToken, (req: AuthRequest, res: Response) => {
  // Token is invalidated client-side by discarding it
  // Optionally, you could blacklist tokens server-side (advanced)
  return res.json({ ok: true, message: 'Logged out' });
});

/**
 * POST /api/v1/auth/register
 * Register new user (admin/manager only)
 */
router.post('/register', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Only admins and managers can register new users
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { email, password, name, role, phone, permissions } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    // Check if user exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, restaurant_id, email, password_hash, name, role, phone, permissions, active)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, email, name, role, phone, permissions, created_at`,
      [
        req.user.restaurantId, email, passwordHash, name, role || 'waiter',
        phone || null, permissions ? JSON.stringify(permissions) : '{}'
      ]
    );

    const newUser = result.rows[0];

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      phone: newUser.phone,
      permissions: newUser.permissions,
      createdAt: newUser.created_at
    });
  } catch (error: any) {
    console.error('[Auth] Register error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/auth/users
 * List all users (admin/manager only)
 */
router.get('/users', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { active, role } = req.query;
    let query = 'SELECT id, email, name, role, phone, active, last_login, created_at FROM users WHERE restaurant_id = $1';
    const params: any[] = [req.user.restaurantId];
    let paramIndex = 2;

    if (active !== undefined) {
      query += ` AND active = $${paramIndex}`;
      params.push(active === 'true');
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    return res.json({ users: result.rows });
  } catch (error: any) {
    console.error('[Auth] Error listing users:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/auth/users/:id
 * Get user details
 */
router.get('/users/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Users can view their own profile, admins/managers can view any
    if (req.user?.id !== id && req.user?.role !== 'admin' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, email, name, role, phone, active, last_login, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('[Auth] Error getting user:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/auth/users/:id
 * Update user (admin/manager only, or self)
 */
router.put('/users/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, phone, active, permissions } = req.body;

    // Check authorization
    const isSelf = req.user?.id === id;
    const isAdminOrManager = req.user?.role === 'admin' || req.user?.role === 'manager';

    if (!isSelf && !isAdminOrManager) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only admins can change role
    if (role && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    // Only admins/managers can change active status
    if (active !== undefined && !isAdminOrManager) {
      return res.status(403).json({ error: 'Unauthorized to change active status' });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (role !== undefined && isAdminOrManager) {
      updates.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (active !== undefined && isAdminOrManager) {
      updates.push(`active = $${paramIndex}`);
      params.push(active);
      paramIndex++;
    }

    if (permissions !== undefined && isAdminOrManager) {
      updates.push(`permissions = $${paramIndex}`);
      params.push(JSON.stringify(permissions));
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, name, role, phone, active, permissions`;
    const result = await pool.query(query, params);

    return res.json({ user: result.rows[0] });
  } catch (error: any) {
    console.error('[Auth] Error updating user:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/v1/auth/users/:id/password
 * Change user password
 */
router.put('/users/:id/password', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Users can change their own password, admins can change any
    const isSelf = req.user?.id === id;
    const isAdmin = req.user?.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // If changing own password, verify current password
    if (isSelf && !isAdmin) {
      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [id]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const passwordMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);

    return res.json({ ok: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('[Auth] Error updating password:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
