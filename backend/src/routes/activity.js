const router = require('express').Router();
const { ActivityLog, User } = require('../models');
const { auth } = require('../middleware/auth');

// GET /api/activity
router.get('/', auth, async (req, res) => {
    try {
        const { limit = 50, entity_type } = req.query;
        const where = {};
        if (entity_type) where.entity_type = entity_type;
        const logs = await ActivityLog.findAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_color'] }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
