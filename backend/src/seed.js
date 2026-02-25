require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User } = require('./models');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('🗄️  Database reset & tables created');

        // ─── ADMIN ACCOUNT ───
        const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'yamun13@JPSDM26', 12);
        await User.create({
            name: 'poyyaj',
            email: 'poyyaj@biolims.app',
            password: hash,
            role: 'Admin',
            expertise: ['Administration', 'Lab Management'],
            avatar_color: '#6366f1',
        });

        console.log('\n🎉 Seed complete! Admin account created:');
        console.log('   Email:    poyyaj@biolims.app');
        console.log('   Password: (set via ADMIN_PASSWORD env var)');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seed();
