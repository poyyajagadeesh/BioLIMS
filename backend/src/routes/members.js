const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, Project, Experiment, DailyTask, ActivityLog } = require('../models');
const { auth, requireRole } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/members
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [
                { model: Project, as: 'projects', through: { attributes: [] } },
                { model: Experiment, as: 'experiments', through: { attributes: [] } },
            ],
            order: [['name', 'ASC']],
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/members/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Project, as: 'projects', through: { attributes: [] } },
                { model: Experiment, as: 'experiments', through: { attributes: [] } },
                { model: DailyTask, as: 'dailyTasks' },
            ],
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/members/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const { name, email, role, mobile, expertise, is_active, password } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (role) updates.role = role;
        if (mobile !== undefined) updates.mobile = mobile;
        if (expertise) updates.expertise = expertise;
        if (is_active !== undefined) updates.is_active = is_active;
        if (password) updates.password = await bcrypt.hash(password, 12);
        await user.update(updates);
        await ActivityLog.create({ user_id: req.user.id, action: 'Updated member', entity_type: 'User', entity_id: user.id, entity_name: user.name });
        const updated = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/members/:id
router.delete('/:id', auth, requireRole('Admin', 'PI'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await user.update({ is_active: false });
        await ActivityLog.create({ user_id: req.user.id, action: 'Deactivated member', entity_type: 'User', entity_id: user.id, entity_name: user.name });
        res.json({ message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/members/:id/workload
router.get('/:id/workload', auth, async (req, res) => {
    try {
        const tasks = await DailyTask.findAll({
            where: { user_id: req.params.id },
            include: [{ model: Experiment, as: 'experiment' }],
            order: [['date', 'DESC']],
            limit: 30,
        });
        const experiments = await Experiment.findAll({
            include: [{ model: User, as: 'members', where: { id: req.params.id }, through: { attributes: [] } }],
        });
        const total = experiments.length;
        const completed = experiments.filter(e => e.status === 'Completed').length;
        const inProgress = experiments.filter(e => e.status === 'In Progress').length;
        res.json({ tasks, experiments: { total, completed, inProgress }, recentTasks: tasks.slice(0, 10) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
