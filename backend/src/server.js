require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/experiments', require('./routes/experiments'));
app.use('/api/protocols', require('./routes/protocols'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/files', require('./routes/files'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/planner', require('./routes/planner'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/manuscripts', require('./routes/manuscripts'));
app.use('/api/reports', require('./routes/reports'));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
    });
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Auto-seed admin on first run if no users exist
async function ensureAdmin() {
    try {
        const count = await User.count();
        if (count === 0) {
            console.log('🌱 No users found — creating admin account...');
            const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'changeme', 12);
            await User.create({
                name: 'poyyaj',
                email: 'poyyaj@biolims.app',
                password: hash,
                role: 'Admin',
                expertise: ['Administration', 'Lab Management'],
                avatar_color: '#6366f1',
            });
            console.log('✅ Admin account created (poyyaj@biolims.app)');
        }
    } catch (err) {
        console.error('⚠️  Could not auto-seed admin:', err.message);
    }
}

// Start server
async function start() {
    try {
        await sequelize.sync();
        console.log('✅ Database synced');

        // Add missing columns to existing tables (safe: ALTER TABLE ADD COLUMN is a no-op if column exists in SQLite via try/catch)
        const addCol = async (table, col, type, dflt) => {
            try {
                const defaultClause = dflt !== undefined ? ` DEFAULT ${typeof dflt === 'string' ? `'${dflt}'` : dflt}` : '';
                await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "${col}" ${type}${defaultClause};`);
                console.log(`  ➕ Added ${table}.${col}`);
            } catch (e) { /* column already exists — ignore */ }
        };

        await addCol('projects', 'visibility', 'VARCHAR(255)', 'public');
        await addCol('experiments', 'visibility', 'VARCHAR(255)', 'public');
        await addCol('experiments', 'results_outcome', 'TEXT');
        await addCol('experiments', 'references', 'TEXT', '[]');
        await addCol('protocols', 'last_edited_by', 'VARCHAR(36)');
        await addCol('protocols', 'last_edited_at', 'DATETIME');
        await addCol('protocols', 'edit_history', 'TEXT', '[]');
        await addCol('protocols', 'visibility', 'VARCHAR(255)', 'public');
        await addCol('manuscripts', 'visibility', 'VARCHAR(255)', 'public');
        await ensureAdmin();
        app.listen(PORT, () => {
            console.log(`🧬 LIMS Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start:', err);
        process.exit(1);
    }
}

start();
