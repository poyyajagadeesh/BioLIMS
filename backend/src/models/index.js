const { DataTypes } = require('sequelize');
const sequelize = require('../db');

/* ───────────── USER / LAB MEMBER ───────────── */
const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING },
    role: { type: DataTypes.ENUM('Admin', 'PI', 'Senior', 'Researcher', 'Student'), defaultValue: 'Researcher' },
    expertise: { type: DataTypes.JSON, defaultValue: [] }, // array of strings
    avatar_color: { type: DataTypes.STRING, defaultValue: '#6366f1' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
});

/* ───────────── PROJECT ───────────── */
const Project = sequelize.define('Project', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('Planning', 'Active', 'On Hold', 'Completed', 'Archived'), defaultValue: 'Planning' },
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY },
    progress: { type: DataTypes.FLOAT, defaultValue: 0 },
    color: { type: DataTypes.STRING, defaultValue: '#6366f1' },
    tags: { type: DataTypes.JSON, defaultValue: [] },
});

/* ───────────── EXPERIMENT ───────────── */
const Experiment = sequelize.define('Experiment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('Wet-lab', 'Dry-lab', 'Computational'), defaultValue: 'Wet-lab' },
    status: { type: DataTypes.ENUM('Planned', 'In Progress', 'Paused', 'Completed', 'Failed'), defaultValue: 'Planned' },
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY },
    progress: { type: DataTypes.FLOAT, defaultValue: 0 },
    notes: { type: DataTypes.TEXT },
    observations: { type: DataTypes.TEXT },
    protocol_id: { type: DataTypes.UUID },
    project_id: { type: DataTypes.UUID },
});

/* ───────────── WET LAB DETAILS ───────────── */
const WetLabDetail = sequelize.define('WetLabDetail', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    experiment_id: { type: DataTypes.UUID, allowNull: false },
    cell_line: { type: DataTypes.STRING },
    cell_source: { type: DataTypes.STRING },
    media_recipe: { type: DataTypes.TEXT },
    antibiotics: { type: DataTypes.STRING },
    fbs_percentage: { type: DataTypes.FLOAT },
    additives: { type: DataTypes.TEXT },
    seeding_density: { type: DataTypes.STRING },
    seeding_datetime: { type: DataTypes.DATE },
    passage_number: { type: DataTypes.INTEGER },
    split_datetime: { type: DataTypes.DATE },
    treatment_drug: { type: DataTypes.STRING },
    treatment_concentration: { type: DataTypes.STRING },
    treatment_duration: { type: DataTypes.STRING },
    incubation_temp: { type: DataTypes.FLOAT },
    incubation_co2: { type: DataTypes.FLOAT },
    incubation_humidity: { type: DataTypes.FLOAT },
    morphology_observations: { type: DataTypes.TEXT },
});

/* ───────────── DRY LAB DETAILS ───────────── */
const DryLabDetail = sequelize.define('DryLabDetail', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    experiment_id: { type: DataTypes.UUID, allowNull: false },
    algorithm_name: { type: DataTypes.STRING },
    dataset_description: { type: DataTypes.TEXT },
    input_files: { type: DataTypes.JSON, defaultValue: [] },
    script_version: { type: DataTypes.STRING },
    git_reference: { type: DataTypes.STRING },
    parameters: { type: DataTypes.JSON, defaultValue: {} },
    output_files: { type: DataTypes.JSON, defaultValue: [] },
    logs: { type: DataTypes.TEXT },
});

/* ───────────── SUBTASK ───────────── */
const Subtask = sequelize.define('Subtask', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    experiment_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'), defaultValue: 'Pending' },
    due_date: { type: DataTypes.DATEONLY },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    assigned_to: { type: DataTypes.UUID },
});

/* ───────────── PROTOCOL / SOP ───────────── */
const Protocol = sequelize.define('Protocol', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.ENUM('Cell Culture', 'Western Blot', 'qPCR', 'NGS', 'Microscopy', 'Animal Work', 'Bioinformatics', 'Other'), defaultValue: 'Other' },
    description: { type: DataTypes.TEXT },
    content: { type: DataTypes.TEXT },
    version: { type: DataTypes.STRING, defaultValue: '1.0' },
    file_path: { type: DataTypes.STRING },
    created_by: { type: DataTypes.UUID },
    tags: { type: DataTypes.JSON, defaultValue: [] },
});

/* ───────────── REMINDER ───────────── */
const Reminder = sequelize.define('Reminder', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.ENUM('Incubation', 'Passage', 'Treatment', 'Experiment', 'Project', 'Custom'), defaultValue: 'Custom' },
    due_date: { type: DataTypes.DATE, allowNull: false },
    is_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    experiment_id: { type: DataTypes.UUID },
    project_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID },
    priority: { type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'), defaultValue: 'Medium' },
});

/* ───────────── FILE ATTACHMENT ───────────── */
const FileAttachment = sequelize.define('FileAttachment', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    filename: { type: DataTypes.STRING, allowNull: false },
    original_name: { type: DataTypes.STRING, allowNull: false },
    mime_type: { type: DataTypes.STRING },
    size: { type: DataTypes.INTEGER },
    path: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.ENUM('project', 'experiment', 'protocol', 'general'), defaultValue: 'general' },
    entity_id: { type: DataTypes.UUID },
    uploaded_by: { type: DataTypes.UUID },
    tags: { type: DataTypes.JSON, defaultValue: [] },
});

/* ───────────── DAILY TASK / PLANNER ───────────── */
const DailyTask = sequelize.define('DailyTask', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'), defaultValue: 'Pending' },
    user_id: { type: DataTypes.UUID },
    experiment_id: { type: DataTypes.UUID },
    project_id: { type: DataTypes.UUID },
    order: { type: DataTypes.INTEGER, defaultValue: 0 },
    check_in_time: { type: DataTypes.DATE },
    check_out_time: { type: DataTypes.DATE },
});

/* ───────────── ACTIVITY LOG ───────────── */
const ActivityLog = sequelize.define('ActivityLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID },
    action: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING },
    entity_id: { type: DataTypes.UUID },
    entity_name: { type: DataTypes.STRING },
    details: { type: DataTypes.TEXT },
    ip_address: { type: DataTypes.STRING },
});

/* ───────────── ASSOCIATIONS ───────────── */

// Project <-> User (many-to-many)
const ProjectMember = sequelize.define('ProjectMember', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    project_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID },
    role: { type: DataTypes.STRING, defaultValue: 'Member' },
}, { timestamps: true });

Project.belongsToMany(User, { through: ProjectMember, foreignKey: 'project_id', as: 'members' });
User.belongsToMany(Project, { through: ProjectMember, foreignKey: 'user_id', as: 'projects' });

// Experiment <-> User (many-to-many)
const ExperimentMember = sequelize.define('ExperimentMember', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    experiment_id: { type: DataTypes.UUID },
    user_id: { type: DataTypes.UUID },
}, { timestamps: true });

Experiment.belongsToMany(User, { through: ExperimentMember, foreignKey: 'experiment_id', as: 'members' });
User.belongsToMany(Experiment, { through: ExperimentMember, foreignKey: 'user_id', as: 'experiments' });

// Project -> Experiments
Project.hasMany(Experiment, { foreignKey: 'project_id', as: 'experiments' });
Experiment.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });

// Experiment -> WetLabDetail
Experiment.hasOne(WetLabDetail, { foreignKey: 'experiment_id', as: 'wetLabDetail' });
WetLabDetail.belongsTo(Experiment, { foreignKey: 'experiment_id' });

// Experiment -> DryLabDetail
Experiment.hasOne(DryLabDetail, { foreignKey: 'experiment_id', as: 'dryLabDetail' });
DryLabDetail.belongsTo(Experiment, { foreignKey: 'experiment_id' });

// Experiment -> Subtasks
Experiment.hasMany(Subtask, { foreignKey: 'experiment_id', as: 'subtasks' });
Subtask.belongsTo(Experiment, { foreignKey: 'experiment_id' });

// Experiment -> Protocol
Experiment.belongsTo(Protocol, { foreignKey: 'protocol_id', as: 'protocol' });
Protocol.hasMany(Experiment, { foreignKey: 'protocol_id', as: 'experiments' });

// User -> DailyTasks
User.hasMany(DailyTask, { foreignKey: 'user_id', as: 'dailyTasks' });
DailyTask.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Experiment -> DailyTasks
Experiment.hasMany(DailyTask, { foreignKey: 'experiment_id', as: 'dailyTasks' });
DailyTask.belongsTo(Experiment, { foreignKey: 'experiment_id', as: 'experiment' });

// User -> Reminders
User.hasMany(Reminder, { foreignKey: 'user_id', as: 'reminders' });
Reminder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User -> ActivityLog
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'activities' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Protocol -> User (creator)
Protocol.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Subtask -> User (assigned)
Subtask.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });

module.exports = {
    sequelize,
    User,
    Project,
    Experiment,
    WetLabDetail,
    DryLabDetail,
    Subtask,
    Protocol,
    Reminder,
    FileAttachment,
    DailyTask,
    ActivityLog,
    ProjectMember,
    ExperimentMember,
};
