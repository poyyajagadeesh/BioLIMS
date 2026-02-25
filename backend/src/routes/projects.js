const router = require('express').Router();
const { Project, User, Experiment, Subtask, ActivityLog, ProjectMember } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/projects
router.get('/', auth, async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = {};
        if (status && status !== 'all') where.status = status;
        if (search) where.name = { [Op.like]: `%${search}%` };
        const projects = await Project.findAll({
            where,
            include: [
                { model: User, as: 'members', through: { attributes: ['role'] } },
                {
                    model: Experiment, as: 'experiments', attributes: ['id', 'name', 'status', 'progress', 'type'],
                    include: [
                        { model: User, as: 'members', through: { attributes: [] }, attributes: ['id', 'name', 'avatar_color', 'role'] },
                    ],
                },
            ],
            order: [['updated_at', 'DESC']],
        });

        // Merge experiment members into each project's team
        const results = projects.map(p => {
            const pj = p.toJSON();
            const memberIds = new Set(pj.members.map(m => m.id));
            for (const exp of pj.experiments || []) {
                for (const m of exp.members || []) {
                    if (!memberIds.has(m.id)) {
                        memberIds.add(m.id);
                        pj.members.push({ ...m, ProjectMember: { role: 'Experiment Member' } });
                    }
                }
            }
            return pj;
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [
                { model: User, as: 'members', through: { attributes: ['role'] }, attributes: { exclude: ['password'] } },
                {
                    model: Experiment, as: 'experiments',
                    include: [
                        { model: User, as: 'members', through: { attributes: [] }, attributes: ['id', 'name', 'avatar_color', 'role', 'email', 'expertise'] },
                        { model: Subtask, as: 'subtasks' },
                    ]
                },
            ],
        });
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Merge experiment members into project team (deduplicated)
        const result = project.toJSON();
        const projectMemberIds = new Set(result.members.map(m => m.id));
        const experimentMembers = [];
        for (const exp of result.experiments || []) {
            for (const m of exp.members || []) {
                if (!projectMemberIds.has(m.id)) {
                    projectMemberIds.add(m.id);
                    experimentMembers.push({ ...m, ProjectMember: { role: 'Experiment Member' } });
                }
            }
        }
        result.members = [...result.members, ...experimentMembers];

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, status, start_date, end_date, color, tags, member_ids } = req.body;
        const project = await Project.create({ name, description, status, start_date, end_date, color, tags });
        if (member_ids && member_ids.length > 0) {
            for (const uid of member_ids) {
                await ProjectMember.create({ project_id: project.id, user_id: uid });
            }
        }
        await ActivityLog.create({ user_id: req.user.id, action: 'Created project', entity_type: 'Project', entity_id: project.id, entity_name: name });
        const full = await Project.findByPk(project.id, {
            include: [{ model: User, as: 'members', through: { attributes: [] }, attributes: { exclude: ['password'] } }, { model: Experiment, as: 'experiments' }],
        });
        res.status(201).json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const { name, description, status, start_date, end_date, progress, color, tags, member_ids } = req.body;
        await project.update({ name: name || project.name, description, status, start_date, end_date, progress, color, tags });
        if (member_ids) {
            await ProjectMember.destroy({ where: { project_id: project.id } });
            for (const uid of member_ids) {
                await ProjectMember.create({ project_id: project.id, user_id: uid });
            }
        }
        await ActivityLog.create({ user_id: req.user.id, action: 'Updated project', entity_type: 'Project', entity_id: project.id, entity_name: project.name });
        const full = await Project.findByPk(project.id, {
            include: [{ model: User, as: 'members', through: { attributes: [] }, attributes: { exclude: ['password'] } }, { model: Experiment, as: 'experiments' }],
        });
        res.json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        await project.update({ status: 'Archived' });
        await ActivityLog.create({ user_id: req.user.id, action: 'Archived project', entity_type: 'Project', entity_id: project.id, entity_name: project.name });
        res.json({ message: 'Project archived' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
