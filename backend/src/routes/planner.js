const router = require('express').Router();
const { DailyTask, User, Experiment, Project, ActivityLog } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/planner?date=YYYY-MM-DD
router.get('/', auth, async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const tasks = await DailyTask.findAll({
            where: { date },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'avatar_color', 'role'] },
                { model: Experiment, as: 'experiment', attributes: ['id', 'name', 'type', 'status'] },
            ],
            order: [['order', 'ASC']],
        });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/planner
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, date, user_id, experiment_id, project_id } = req.body;
        const count = await DailyTask.count({ where: { date } });
        const task = await DailyTask.create({ title, description, date, user_id, experiment_id, project_id, order: count });
        await ActivityLog.create({ user_id: req.user.id, action: 'Created daily task', entity_type: 'DailyTask', entity_id: task.id, entity_name: title });
        const full = await DailyTask.findByPk(task.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'avatar_color', 'role'] },
                { model: Experiment, as: 'experiment', attributes: ['id', 'name', 'type', 'status'] },
            ],
        });
        res.status(201).json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/planner/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await DailyTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        await task.update(req.body);
        const full = await DailyTask.findByPk(task.id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'avatar_color', 'role'] },
                { model: Experiment, as: 'experiment', attributes: ['id', 'name', 'type', 'status'] },
            ],
        });
        res.json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/planner/:id/checkin
router.put('/:id/checkin', auth, async (req, res) => {
    try {
        const task = await DailyTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        await task.update({ check_in_time: new Date(), status: 'In Progress' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/planner/:id/checkout
router.put('/:id/checkout', auth, async (req, res) => {
    try {
        const task = await DailyTask.findByPk(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        await task.update({ check_out_time: new Date(), status: 'Completed' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/planner/reorder
router.put('/reorder', auth, async (req, res) => {
    try {
        const { taskOrders } = req.body; // [{ id, order }]
        for (const item of taskOrders) {
            await DailyTask.update({ order: item.order }, { where: { id: item.id } });
        }
        res.json({ message: 'Reordered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/planner/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await DailyTask.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
