const router = require('express').Router();
const { User, Project, Experiment, Subtask, DailyTask, Reminder, ActivityLog, Manuscript, ManuscriptTask } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/reports/generate
// Query params: type (monthly|sixmonth), member_id (optional), month (YYYY-MM), year (YYYY)
router.get('/generate', auth, async (req, res) => {
    try {
        const { type = 'monthly', member_id, month, year } = req.query;

        let startDate, endDate, periodLabel;

        if (type === 'monthly') {
            const m = month || new Date().toISOString().slice(0, 7); // YYYY-MM
            startDate = new Date(`${m}-01`);
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            endDate.setDate(0); // last day of month
            periodLabel = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
            // six month report
            const y = year || new Date().getFullYear();
            const currentMonth = new Date().getMonth();
            if (currentMonth < 6) {
                startDate = new Date(`${y}-01-01`);
                endDate = new Date(`${y}-06-30`);
                periodLabel = `January - June ${y}`;
            } else {
                startDate = new Date(`${y}-07-01`);
                endDate = new Date(`${y}-12-31`);
                periodLabel = `July - December ${y}`;
            }
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Build data
        const report = { period: periodLabel, type, generated_at: new Date().toISOString() };

        // Member info
        let memberFilter = {};
        if (member_id) {
            const member = await User.findByPk(member_id, { attributes: { exclude: ['password'] } });
            if (!member) return res.status(404).json({ error: 'Member not found' });
            report.member = { name: member.name, role: member.role, email: member.email, expertise: member.expertise };
            memberFilter = { user_id: member_id };
        }

        // Projects active during period
        const projectWhere = {
            [Op.or]: [
                { start_date: { [Op.between]: [startStr, endStr] } },
                { end_date: { [Op.between]: [startStr, endStr] } },
                { [Op.and]: [{ start_date: { [Op.lte]: startStr } }, { [Op.or]: [{ end_date: { [Op.gte]: endStr } }, { end_date: null }] }] },
            ],
        };
        const projects = await Project.findAll({
            where: projectWhere,
            include: [
                { model: Experiment, as: 'experiments' },
                { model: User, as: 'members', through: { attributes: [] }, attributes: ['id', 'name', 'role'] },
            ],
        });
        report.projects = projects.map(p => ({
            name: p.name, status: p.status, progress: p.progress,
            start_date: p.start_date, end_date: p.end_date,
            experiment_count: p.experiments?.length || 0,
            members: p.members?.map(m => m.name) || [],
        }));

        // Experiments during period
        const expWhere = {
            [Op.or]: [
                { start_date: { [Op.between]: [startStr, endStr] } },
                { end_date: { [Op.between]: [startStr, endStr] } },
                { created_at: { [Op.between]: [startDate, endDate] } },
            ],
        };
        const experiments = await Experiment.findAll({
            where: expWhere,
            include: [
                { model: Project, as: 'project', attributes: ['id', 'name'] },
                { model: Subtask, as: 'subtasks' },
                { model: User, as: 'members', through: { attributes: [] }, attributes: ['id', 'name'] },
            ],
        });

        let filteredExperiments = experiments;
        if (member_id) {
            filteredExperiments = experiments.filter(e => e.members?.some(m => m.id === member_id));
        }

        report.experiments = filteredExperiments.map(e => ({
            name: e.name, type: e.type, status: e.status, progress: e.progress,
            project: e.project?.name || 'No project',
            start_date: e.start_date, end_date: e.end_date,
            results_outcome: e.results_outcome || null,
            subtasks_total: e.subtasks?.length || 0,
            subtasks_completed: e.subtasks?.filter(s => s.status === 'Completed').length || 0,
        }));

        // Daily tasks summary
        const taskWhere = { date: { [Op.between]: [startStr, endStr] }, ...memberFilter };
        const dailyTasks = await DailyTask.findAll({ where: taskWhere });
        report.daily_tasks = {
            total: dailyTasks.length,
            completed: dailyTasks.filter(t => t.status === 'Completed').length,
            in_progress: dailyTasks.filter(t => t.status === 'In Progress').length,
            pending: dailyTasks.filter(t => t.status === 'Pending').length,
        };

        // Activity log
        const actWhere = { created_at: { [Op.between]: [startDate, endDate] } };
        if (member_id) actWhere.user_id = member_id;
        const activities = await ActivityLog.findAll({
            where: actWhere,
            include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
            order: [['created_at', 'DESC']],
            limit: 100,
        });
        report.activities = activities.map(a => ({
            action: a.action, entity_type: a.entity_type, entity_name: a.entity_name,
            user: a.user?.name || 'System', date: a.createdAt,
        }));

        // Manuscripts
        const msWhere = { created_at: { [Op.between]: [startDate, endDate] } };
        const manuscripts = await Manuscript.findAll({
            where: msWhere,
            include: [
                { model: ManuscriptTask, as: 'tasks' },
                { model: User, as: 'authors', through: { attributes: [] }, attributes: ['id', 'name'] },
            ],
        });
        let filteredMs = manuscripts;
        if (member_id) {
            filteredMs = manuscripts.filter(m => m.created_by === member_id || m.authors?.some(a => a.id === member_id));
        }
        report.manuscripts = filteredMs.map(m => ({
            title: m.title, status: m.status, target_journal: m.target_journal,
            progress: m.progress, authors: m.authors?.map(a => a.name) || [],
        }));

        // Summary stats
        report.summary = {
            total_projects: report.projects.length,
            total_experiments: report.experiments.length,
            experiments_completed: report.experiments.filter(e => e.status === 'Completed').length,
            total_activities: report.activities.length,
            total_manuscripts: report.manuscripts.length,
            task_completion_rate: report.daily_tasks.total > 0
                ? Math.round((report.daily_tasks.completed / report.daily_tasks.total) * 100)
                : 0,
        };

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
