const router = require('express').Router();
const { Experiment, User, Project, Subtask, WetLabDetail, DryLabDetail, Protocol, ActivityLog, ExperimentMember } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper: recalculate experiment progress from subtasks
async function recalcProgress(experimentId) {
    const subtasks = await Subtask.findAll({ where: { experiment_id: experimentId } });
    if (subtasks.length === 0) return 0;
    const completed = subtasks.filter(s => s.status === 'Completed').length;
    return Math.round((completed / subtasks.length) * 100);
}

// GET /api/experiments
router.get('/', auth, async (req, res) => {
    try {
        const { status, type, project_id, search } = req.query;
        const where = {};
        if (status && status !== 'all') where.status = status;
        if (type && type !== 'all') where.type = type;
        if (project_id) where.project_id = project_id;
        if (search) where.name = { [Op.like]: `%${search}%` };
        const experiments = await Experiment.findAll({
            where,
            include: [
                { model: User, as: 'members', through: { attributes: [] }, attributes: ['id', 'name', 'avatar_color', 'role'] },
                { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
                { model: Subtask, as: 'subtasks' },
                { model: Protocol, as: 'protocol', attributes: ['id', 'name', 'category'] },
            ],
            order: [['updated_at', 'DESC']],
        });
        res.json(experiments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/experiments/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const experiment = await Experiment.findByPk(req.params.id, {
            include: [
                { model: User, as: 'members', through: { attributes: [] }, attributes: { exclude: ['password'] } },
                { model: Project, as: 'project' },
                { model: Subtask, as: 'subtasks', include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_color'] }], order: [['order', 'ASC']] },
                { model: WetLabDetail, as: 'wetLabDetail' },
                { model: DryLabDetail, as: 'dryLabDetail' },
                { model: Protocol, as: 'protocol' },
            ],
        });
        if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
        res.json(experiment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/experiments
router.post('/', auth, async (req, res) => {
    try {
        const { name, type, status, start_date, end_date, notes, observations, protocol_id, project_id, member_ids, subtasks, wetLabDetail, dryLabDetail } = req.body;
        const experiment = await Experiment.create({ name, type, status, start_date, end_date, notes, observations, protocol_id, project_id });

        if (member_ids && member_ids.length > 0) {
            for (const uid of member_ids) {
                await ExperimentMember.create({ experiment_id: experiment.id, user_id: uid });
            }
        }

        if (subtasks && subtasks.length > 0) {
            for (let i = 0; i < subtasks.length; i++) {
                await Subtask.create({ ...subtasks[i], experiment_id: experiment.id, order: i });
            }
        }

        if (type === 'Wet-lab' && wetLabDetail) {
            await WetLabDetail.create({ ...wetLabDetail, experiment_id: experiment.id });
        }
        if ((type === 'Dry-lab' || type === 'Computational') && dryLabDetail) {
            await DryLabDetail.create({ ...dryLabDetail, experiment_id: experiment.id });
        }

        // Recalc progress
        const progress = await recalcProgress(experiment.id);
        await experiment.update({ progress });

        // Update project progress
        if (project_id) {
            const proj = await Project.findByPk(project_id, { include: [{ model: Experiment, as: 'experiments' }] });
            if (proj && proj.experiments.length > 0) {
                const avg = proj.experiments.reduce((s, e) => s + (e.progress || 0), 0) / proj.experiments.length;
                await proj.update({ progress: Math.round(avg) });
            }
        }

        await ActivityLog.create({ user_id: req.user.id, action: 'Created experiment', entity_type: 'Experiment', entity_id: experiment.id, entity_name: name });

        const full = await Experiment.findByPk(experiment.id, {
            include: [
                { model: User, as: 'members', through: { attributes: [] }, attributes: { exclude: ['password'] } },
                { model: Project, as: 'project' },
                { model: Subtask, as: 'subtasks' },
                { model: WetLabDetail, as: 'wetLabDetail' },
                { model: DryLabDetail, as: 'dryLabDetail' },
                { model: Protocol, as: 'protocol' },
            ],
        });
        res.status(201).json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/experiments/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const experiment = await Experiment.findByPk(req.params.id);
        if (!experiment) return res.status(404).json({ error: 'Experiment not found' });

        const { name, type, status, start_date, end_date, notes, observations, protocol_id, project_id, member_ids, wetLabDetail, dryLabDetail } = req.body;
        await experiment.update({ name: name || experiment.name, type, status, start_date, end_date, notes, observations, protocol_id, project_id });

        if (member_ids) {
            await ExperimentMember.destroy({ where: { experiment_id: experiment.id } });
            for (const uid of member_ids) {
                await ExperimentMember.create({ experiment_id: experiment.id, user_id: uid });
            }
        }

        if (wetLabDetail) {
            const existing = await WetLabDetail.findOne({ where: { experiment_id: experiment.id } });
            if (existing) await existing.update(wetLabDetail);
            else await WetLabDetail.create({ ...wetLabDetail, experiment_id: experiment.id });
        }
        if (dryLabDetail) {
            const existing = await DryLabDetail.findOne({ where: { experiment_id: experiment.id } });
            if (existing) await existing.update(dryLabDetail);
            else await DryLabDetail.create({ ...dryLabDetail, experiment_id: experiment.id });
        }

        // Recalc progress
        const progress = await recalcProgress(experiment.id);
        await experiment.update({ progress });

        await ActivityLog.create({ user_id: req.user.id, action: 'Updated experiment', entity_type: 'Experiment', entity_id: experiment.id, entity_name: experiment.name });

        const full = await Experiment.findByPk(experiment.id, {
            include: [
                { model: User, as: 'members', through: { attributes: [] }, attributes: { exclude: ['password'] } },
                { model: Project, as: 'project' },
                { model: Subtask, as: 'subtasks' },
                { model: WetLabDetail, as: 'wetLabDetail' },
                { model: DryLabDetail, as: 'dryLabDetail' },
                { model: Protocol, as: 'protocol' },
            ],
        });
        res.json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/experiments/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const experiment = await Experiment.findByPk(req.params.id);
        if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
        await Subtask.destroy({ where: { experiment_id: experiment.id } });
        await WetLabDetail.destroy({ where: { experiment_id: experiment.id } });
        await DryLabDetail.destroy({ where: { experiment_id: experiment.id } });
        await ExperimentMember.destroy({ where: { experiment_id: experiment.id } });
        await ActivityLog.create({ user_id: req.user.id, action: 'Deleted experiment', entity_type: 'Experiment', entity_id: experiment.id, entity_name: experiment.name });
        await experiment.destroy();
        res.json({ message: 'Experiment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/experiments/:id/subtasks
router.post('/:id/subtasks', auth, async (req, res) => {
    try {
        const { title, description, due_date, assigned_to } = req.body;
        const count = await Subtask.count({ where: { experiment_id: req.params.id } });
        const subtask = await Subtask.create({ experiment_id: req.params.id, title, description, due_date, assigned_to, order: count });
        const progress = await recalcProgress(req.params.id);
        await Experiment.update({ progress }, { where: { id: req.params.id } });
        res.status(201).json(subtask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/experiments/:eid/subtasks/:sid
router.put('/:eid/subtasks/:sid', auth, async (req, res) => {
    try {
        const subtask = await Subtask.findByPk(req.params.sid);
        if (!subtask) return res.status(404).json({ error: 'Subtask not found' });
        await subtask.update(req.body);
        const progress = await recalcProgress(req.params.eid);
        await Experiment.update({ progress }, { where: { id: req.params.eid } });
        res.json(subtask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/experiments/:eid/subtasks/:sid
router.delete('/:eid/subtasks/:sid', auth, async (req, res) => {
    try {
        await Subtask.destroy({ where: { id: req.params.sid } });
        const progress = await recalcProgress(req.params.eid);
        await Experiment.update({ progress }, { where: { id: req.params.eid } });
        res.json({ message: 'Subtask deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
