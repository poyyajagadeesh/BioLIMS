const router = require('express').Router();
const { Reminder, User, ActivityLog } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/reminders
router.get('/', auth, async (req, res) => {
    try {
        const { range, completed } = req.query;
        const where = {};
        const now = new Date();
        if (completed === 'false') where.is_completed = false;
        if (completed === 'true') where.is_completed = true;

        if (range === 'today') {
            const start = new Date(now); start.setHours(0, 0, 0, 0);
            const end = new Date(now); end.setHours(23, 59, 59, 999);
            where.due_date = { [Op.between]: [start, end] };
        } else if (range === '24h') {
            const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            where.due_date = { [Op.between]: [now, end] };
        } else if (range === 'week') {
            const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            where.due_date = { [Op.between]: [now, end] };
        } else if (range === 'overdue') {
            where.due_date = { [Op.lt]: now };
            where.is_completed = false;
        }

        const reminders = await Reminder.findAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_color'] }],
            order: [['due_date', 'ASC']],
        });
        res.json(reminders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reminders
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, type, due_date, experiment_id, project_id, user_id, priority } = req.body;
        const reminder = await Reminder.create({ title, description, type, due_date, experiment_id, project_id, user_id: user_id || req.user.id, priority });
        res.status(201).json(reminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/reminders/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const reminder = await Reminder.findByPk(req.params.id);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        await reminder.update(req.body);
        res.json(reminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/reminders/:id/complete
router.put('/:id/complete', auth, async (req, res) => {
    try {
        const reminder = await Reminder.findByPk(req.params.id);
        if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
        await reminder.update({ is_completed: !reminder.is_completed });
        res.json(reminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/reminders/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await Reminder.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Reminder deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
