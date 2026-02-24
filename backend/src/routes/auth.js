const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { auth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, mobile, expertise } = req.body;
        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ error: 'Email already registered' });
        const hashed = await bcrypt.hash(password, 12);
        const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#14b8a6', '#06b6d4', '#3b82f6'];
        const user = await User.create({
            name, email, password: hashed, role: role || 'Researcher',
            mobile, expertise: expertise || [],
            avatar_color: colors[Math.floor(Math.random() * colors.length)],
        });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            token, user: { id: user.id, name: user.name, email: user.email, role: user.role, expertise: user.expertise, avatar_color: user.avatar_color }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token, user: { id: user.id, name: user.name, email: user.email, role: user.role, expertise: user.expertise, avatar_color: user.avatar_color, mobile: user.mobile }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
    res.json({
        user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, expertise: req.user.expertise, avatar_color: req.user.avatar_color, mobile: req.user.mobile }
    });
});

module.exports = router;
