const router = require('express').Router();
const { Manuscript, ManuscriptTask, ManuscriptAuthor, User, Project, ActivityLog, FileAttachment } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper: recalculate manuscript progress from tasks
async function recalcProgress(manuscriptId) {
    const tasks = await ManuscriptTask.findAll({ where: { manuscript_id: manuscriptId } });
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / tasks.length) * 100);
}

// GET /api/manuscripts
router.get('/', auth, async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = {};
        if (status && status !== 'all') where.status = status;
        if (search) where.title = { [Op.like]: `%${search}%` };
        const manuscripts = await Manuscript.findAll({
            where,
            include: [
                { model: User, as: 'authors', through: { attributes: ['author_order', 'is_corresponding'] }, attributes: ['id', 'name', 'avatar_color', 'role'] },
                { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
                { model: ManuscriptTask, as: 'tasks' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_color'] },
            ],
            order: [['updated_at', 'DESC']],
        });

        // Filter by visibility for non-admin users
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'PI';
        const filtered = isAdmin ? manuscripts : manuscripts.filter(ms => {
            if (ms.visibility === 'public') return true;
            if (ms.visibility === 'private') return false;
            // restricted: only co-authors or creator
            return ms.created_by === req.user.id || ms.authors?.some(a => a.id === req.user.id);
        });

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/manuscripts/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const manuscript = await Manuscript.findByPk(req.params.id, {
            include: [
                { model: User, as: 'authors', through: { attributes: ['author_order', 'is_corresponding'] }, attributes: { exclude: ['password'] } },
                { model: Project, as: 'project' },
                { model: ManuscriptTask, as: 'tasks', include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'avatar_color'] }], order: [['order', 'ASC']] },
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_color'] },
            ],
        });
        if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });

        // Get files associated with this manuscript
        const files = await FileAttachment.findAll({
            where: { entity_id: manuscript.id, entity_type: 'manuscript' },
            order: [['created_at', 'DESC']],
        });

        const result = manuscript.toJSON();
        result.files = files;
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/manuscripts
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, status, target_journal, submission_deadline, abstract, keywords, notes, project_id, visibility, author_ids } = req.body;
        const manuscript = await Manuscript.create({
            title, description, status, target_journal, submission_deadline,
            abstract, keywords, notes, project_id, visibility, created_by: req.user.id,
        });

        if (author_ids && author_ids.length > 0) {
            for (let i = 0; i < author_ids.length; i++) {
                await ManuscriptAuthor.create({
                    manuscript_id: manuscript.id,
                    user_id: author_ids[i],
                    author_order: i,
                    is_corresponding: i === 0,
                });
            }
        }

        await ActivityLog.create({ user_id: req.user.id, action: 'Created manuscript', entity_type: 'Manuscript', entity_id: manuscript.id, entity_name: title });

        const full = await Manuscript.findByPk(manuscript.id, {
            include: [
                { model: User, as: 'authors', through: { attributes: ['author_order', 'is_corresponding'] }, attributes: { exclude: ['password'] } },
                { model: Project, as: 'project' },
                { model: ManuscriptTask, as: 'tasks' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_color'] },
            ],
        });
        res.status(201).json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/manuscripts/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const manuscript = await Manuscript.findByPk(req.params.id);
        if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });

        const { title, description, status, target_journal, submission_deadline, submitted_date, accepted_date, doi, abstract, keywords, notes, project_id, visibility, author_ids } = req.body;
        await manuscript.update({
            title: title || manuscript.title, description, status, target_journal,
            submission_deadline, submitted_date, accepted_date, doi, abstract, keywords, notes, project_id,
            visibility: visibility !== undefined ? visibility : manuscript.visibility,
        });

        if (author_ids) {
            await ManuscriptAuthor.destroy({ where: { manuscript_id: manuscript.id } });
            for (let i = 0; i < author_ids.length; i++) {
                await ManuscriptAuthor.create({
                    manuscript_id: manuscript.id,
                    user_id: author_ids[i],
                    author_order: i,
                    is_corresponding: i === 0,
                });
            }
        }

        // Recalc progress
        const progress = await recalcProgress(manuscript.id);
        await manuscript.update({ progress });

        await ActivityLog.create({ user_id: req.user.id, action: 'Updated manuscript', entity_type: 'Manuscript', entity_id: manuscript.id, entity_name: manuscript.title });

        const full = await Manuscript.findByPk(manuscript.id, {
            include: [
                { model: User, as: 'authors', through: { attributes: ['author_order', 'is_corresponding'] }, attributes: { exclude: ['password'] } },
                { model: Project, as: 'project' },
                { model: ManuscriptTask, as: 'tasks' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_color'] },
            ],
        });
        res.json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/manuscripts/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const manuscript = await Manuscript.findByPk(req.params.id);
        if (!manuscript) return res.status(404).json({ error: 'Manuscript not found' });
        await ManuscriptTask.destroy({ where: { manuscript_id: manuscript.id } });
        await ManuscriptAuthor.destroy({ where: { manuscript_id: manuscript.id } });
        await ActivityLog.create({ user_id: req.user.id, action: 'Deleted manuscript', entity_type: 'Manuscript', entity_id: manuscript.id, entity_name: manuscript.title });
        await manuscript.destroy();
        res.json({ message: 'Manuscript deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/manuscripts/:id/tasks
router.post('/:id/tasks', auth, async (req, res) => {
    try {
        const { title, description, section, due_date, assigned_to } = req.body;
        const count = await ManuscriptTask.count({ where: { manuscript_id: req.params.id } });
        const task = await ManuscriptTask.create({ manuscript_id: req.params.id, title, description, section, due_date, assigned_to, order: count });
        const progress = await recalcProgress(req.params.id);
        await Manuscript.update({ progress }, { where: { id: req.params.id } });
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/manuscripts/:mid/tasks/:tid
router.put('/:mid/tasks/:tid', auth, async (req, res) => {
    try {
        const task = await ManuscriptTask.findByPk(req.params.tid);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        await task.update(req.body);
        const progress = await recalcProgress(req.params.mid);
        await Manuscript.update({ progress }, { where: { id: req.params.mid } });
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/manuscripts/:mid/tasks/:tid
router.delete('/:mid/tasks/:tid', auth, async (req, res) => {
    try {
        await ManuscriptTask.destroy({ where: { id: req.params.tid } });
        const progress = await recalcProgress(req.params.mid);
        await Manuscript.update({ progress }, { where: { id: req.params.mid } });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
