const router = require('express').Router();
const { Protocol, User, Experiment, ActivityLog } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/protocols
router.get('/', auth, async (req, res) => {
    try {
        const { category, search } = req.query;
        const where = {};
        if (category && category !== 'all') where.category = category;
        if (search) where.name = { [Op.like]: `%${search}%` };
        const protocols = await Protocol.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_color'] },
                { model: User, as: 'lastEditor', attributes: ['id', 'name', 'avatar_color'] },
            ],
            order: [['updated_at', 'DESC']],
        });

        // Filter by visibility for non-admin users
        const isAdmin = req.user.role === 'Admin' || req.user.role === 'PI';
        const filtered = isAdmin ? protocols : protocols.filter(p => {
            if (p.visibility === 'public') return true;
            if (p.visibility === 'private') return false;
            // restricted: only creator can see
            return p.created_by === req.user.id;
        });

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/protocols/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const protocol = await Protocol.findByPk(req.params.id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'lastEditor', attributes: ['id', 'name'] },
                { model: Experiment, as: 'experiments', attributes: ['id', 'name', 'status'] },
            ],
        });
        if (!protocol) return res.status(404).json({ error: 'Protocol not found' });
        res.json(protocol);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/protocols
router.post('/', auth, async (req, res) => {
    try {
        const { name, category, description, content, version, tags, visibility } = req.body;
        const protocol = await Protocol.create({ name, category, description, content, version, tags, visibility, created_by: req.user.id });
        await ActivityLog.create({ user_id: req.user.id, action: 'Created protocol', entity_type: 'Protocol', entity_id: protocol.id, entity_name: name });
        const full = await Protocol.findByPk(protocol.id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'lastEditor', attributes: ['id', 'name'] },
            ],
        });
        res.status(201).json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/protocols/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const protocol = await Protocol.findByPk(req.params.id);
        if (!protocol) return res.status(404).json({ error: 'Protocol not found' });

        // Build a summary of what changed
        const changedFields = [];
        const updateFields = ['name', 'category', 'description', 'content', 'version', 'tags', 'visibility'];
        for (const field of updateFields) {
            if (req.body[field] !== undefined) {
                const oldVal = protocol[field];
                const newVal = req.body[field];
                if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                    changedFields.push(field);
                }
            }
        }

        // Add edit history entry
        const editEntry = {
            edited_by: req.user.id,
            edited_by_name: req.user.name,
            edited_at: new Date().toISOString(),
            changes: changedFields.length > 0 ? changedFields.join(', ') : 'No field changes detected',
        };
        const currentHistory = protocol.edit_history || [];
        const updatedHistory = [editEntry, ...currentHistory].slice(0, 50); // Keep last 50 edits

        await protocol.update({
            ...req.body,
            last_edited_by: req.user.id,
            last_edited_at: new Date(),
            edit_history: updatedHistory,
        });

        await ActivityLog.create({
            user_id: req.user.id,
            action: 'Updated protocol',
            entity_type: 'Protocol',
            entity_id: protocol.id,
            entity_name: protocol.name,
            details: changedFields.length > 0 ? `Changed: ${changedFields.join(', ')}` : null,
        });

        const full = await Protocol.findByPk(protocol.id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'avatar_color'] },
                { model: User, as: 'lastEditor', attributes: ['id', 'name', 'avatar_color'] },
            ],
        });
        res.json(full);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/protocols/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const protocol = await Protocol.findByPk(req.params.id);
        if (!protocol) return res.status(404).json({ error: 'Protocol not found' });
        await ActivityLog.create({ user_id: req.user.id, action: 'Deleted protocol', entity_type: 'Protocol', entity_id: protocol.id, entity_name: protocol.name });
        await protocol.destroy();
        res.json({ message: 'Protocol deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
