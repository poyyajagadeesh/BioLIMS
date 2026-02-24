const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

const dbDir = path.dirname(process.env.DB_PATH || './data/lims.db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || './data/lims.db',
    logging: false,
    define: {
        timestamps: true,
        underscored: true,
    },
});

module.exports = sequelize;
