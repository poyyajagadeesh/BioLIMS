const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { FileAttachment, ActivityLog } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const sub = req.body.entity_type || 'general';
        const dir = path.join(uploadDir, sub);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/files
router.get('/', auth, async (req, res) => {
    try {
        const { entity_type, entity_id, search, tag } = req.query;
        const where = {};
        if (entity_type) where.entity_type = entity_type;
        if (entity_id) where.entity_id = entity_id;
        if (search) where.original_name = { [Op.like]: `%${search}%` };
        const files = await FileAttachment.findAll({ where, order: [['created_at', 'DESC']] });
        if (tag) {
            const filtered = files.filter(f => f.tags && f.tags.includes(tag));
            return res.json(filtered);
        }
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/files/upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });
        const { entity_type, entity_id, tags } = req.body;
        const file = await FileAttachment.create({
            filename: req.file.filename,
            original_name: req.file.originalname,
            mime_type: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            entity_type: entity_type || 'general',
            entity_id: entity_id || null,
            uploaded_by: req.user.id,
            tags: tags ? JSON.parse(tags) : [],
        });
        await ActivityLog.create({ user_id: req.user.id, action: 'Uploaded file', entity_type: 'File', entity_id: file.id, entity_name: req.file.originalname });
        res.status(201).json(file);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/files/:id/download
router.get('/:id/download', auth, async (req, res) => {
    try {
        const file = await FileAttachment.findByPk(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });
        res.download(file.path, file.original_name);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/files/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await FileAttachment.findByPk(req.params.id);
        if (!file) return res.status(404).json({ error: 'File not found' });
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        await file.destroy();
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
