const router = require('express').Router();
const { User, Project, Experiment, Reminder, DailyTask, Subtask, ActivityLog } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Today's tasks
        const todayTasks = await DailyTask.findAll({
            where: { date: { [Op.between]: [todayStart, todayEnd] } },
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'avatar_color'] },
                { model: Experiment, as: 'experiment', attributes: ['id', 'name', 'type'] },
            ],
            order: [['order', 'ASC']],
        });

        // Active experiments
        const activeExperiments = await Experiment.findAll({
            where: { status: 'In Progress' },
            include: [
                { model: User, as: 'members', through: { attributes: [] }, attributes: ['id', 'name', 'avatar_color'] },
                { model: Project, as: 'project', attributes: ['id', 'name', 'color'] },
            ],
            order: [['updated_at', 'DESC']],
            limit: 10,
        });

        // Upcoming reminders
        const remindersToday = await Reminder.findAll({
            where: { due_date: { [Op.between]: [todayStart, todayEnd] }, is_completed: false },
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['due_date', 'ASC']],
        });

        const remindersWeek = await Reminder.findAll({
            where: { due_date: { [Op.between]: [todayEnd, weekEnd] }, is_completed: false },
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['due_date', 'ASC']],
        });

        const overdueReminders = await Reminder.findAll({
            where: { due_date: { [Op.lt]: todayStart }, is_completed: false },
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['due_date', 'ASC']],
        });

        // Stats
        const totalProjects = await Project.count({ where: { status: { [Op.ne]: 'Archived' } } });
        const activeProjects = await Project.count({ where: { status: 'Active' } });
        const totalExperiments = await Experiment.count();
        const completedExperiments = await Experiment.count({ where: { status: 'Completed' } });
        const totalMembers = await User.count({ where: { is_active: true } });
        const pendingTasks = await DailyTask.count({ where: { status: 'Pending', date: { [Op.between]: [todayStart, todayEnd] } } });

        // Member progress overview
        const members = await User.findAll({
            where: { is_active: true },
            attributes: ['id', 'name', 'role', 'avatar_color', 'expertise'],
            include: [
                { model: DailyTask, as: 'dailyTasks', where: { date: { [Op.between]: [todayStart, todayEnd] } }, required: false },
            ],
        });

        // Recent activity
        const recentActivity = await ActivityLog.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatar_color'] }],
            order: [['created_at', 'DESC']],
            limit: 15,
        });

        res.json({
            todayTasks,
            activeExperiments,
            reminders: { today: remindersToday, week: remindersWeek, overdue: overdueReminders },
            stats: { totalProjects, activeProjects, totalExperiments, completedExperiments, totalMembers, pendingTasks },
            memberProgress: members,
            recentActivity,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
