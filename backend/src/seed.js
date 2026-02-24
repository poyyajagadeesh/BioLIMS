require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Project, Experiment, WetLabDetail, DryLabDetail, Subtask, Protocol, Reminder, DailyTask, ProjectMember, ExperimentMember, ActivityLog } = require('./models');

async function seed() {
    try {
        await sequelize.sync({ force: true });
        console.log('🗄️  Database reset');

        const hash = await bcrypt.hash('password123', 12);

        // ─── 5 LAB MEMBERS ───
        const members = await User.bulkCreate([
            { name: 'Dr. Priya Sharma', email: 'priya@lab.org', password: hash, role: 'PI', mobile: '+91-9876543210', expertise: ['Cell Culture', 'Molecular Biology', 'Animal Work'], avatar_color: '#6366f1' },
            { name: 'Rahul Verma', email: 'rahul@lab.org', password: hash, role: 'Senior', mobile: '+91-9876543211', expertise: ['Bioinformatics', 'NGS', 'Data Analysis'], avatar_color: '#8b5cf6' },
            { name: 'Ananya Gupta', email: 'ananya@lab.org', password: hash, role: 'Researcher', mobile: '+91-9876543212', expertise: ['Cell Culture', 'Western Blot', 'qPCR'], avatar_color: '#ec4899' },
            { name: 'Vikram Singh', email: 'vikram@lab.org', password: hash, role: 'Researcher', mobile: '+91-9876543213', expertise: ['Microscopy', 'Cell Culture', 'Flow Cytometry'], avatar_color: '#f97316' },
            { name: 'Meera Patel', email: 'meera@lab.org', password: hash, role: 'Student', mobile: '+91-9876543214', expertise: ['Bioinformatics', 'Python', 'R'], avatar_color: '#14b8a6' },
        ]);
        console.log('👥 Created 5 lab members');
        // Also create an admin
        await User.create({ name: 'Admin', email: 'admin@lab.org', password: hash, role: 'Admin', expertise: [], avatar_color: '#3b82f6' });

        // ─── PROTOCOLS ───
        const protocols = await Protocol.bulkCreate([
            { name: 'MTT Cell Viability Assay', category: 'Cell Culture', description: 'Standard MTT assay protocol for measuring cell viability and proliferation.', version: '2.1', content: '1. Seed cells at 5000 cells/well in 96-well plate\n2. Incubate for 24h at 37°C\n3. Add 20µL MTT reagent (5mg/mL)\n4. Incubate 4h\n5. Remove media, add 200µL DMSO\n6. Read absorbance at 570nm', created_by: members[0].id, tags: ['viability', 'proliferation', '96-well'] },
            { name: 'Western Blot Protocol', category: 'Western Blot', description: 'Standard western blot protocol for protein detection.', version: '3.0', content: '1. Lyse cells in RIPA buffer\n2. Determine protein concentration (BCA assay)\n3. Load 30µg protein per lane\n4. Run SDS-PAGE gel\n5. Transfer to PVDF membrane\n6. Block with 5% BSA\n7. Primary antibody (overnight 4°C)\n8. Secondary antibody (1h RT)\n9. Develop with ECL', created_by: members[0].id, tags: ['protein', 'western', 'antibody'] },
            { name: 'RNA Extraction (TRIzol)', category: 'qPCR', description: 'TRIzol-based RNA extraction protocol.', version: '1.5', content: '1. Add 1mL TRIzol per 10cm² cells\n2. Homogenize by pipetting\n3. Add 200µL chloroform\n4. Centrifuge 12000g 15min 4°C\n5. Transfer aqueous phase\n6. Add isopropanol, mix\n7. Centrifuge 12000g 10min\n8. Wash with 75% ethanol\n9. Resuspend in RNase-free water', created_by: members[2].id, tags: ['RNA', 'extraction', 'TRIzol'] },
            { name: 'NGS Library Preparation', category: 'NGS', description: 'Illumina TruSeq library preparation protocol.', version: '1.0', content: '1. Fragment DNA (Covaris)\n2. End repair\n3. A-tailing\n4. Adapter ligation\n5. Size selection (beads)\n6. PCR amplification (8 cycles)\n7. Quality check (Bioanalyzer)\n8. Quantification (qPCR)', created_by: members[1].id, tags: ['NGS', 'Illumina', 'sequencing'] },
            { name: 'Confocal Microscopy Setup', category: 'Microscopy', description: 'Standard confocal imaging protocol for fluorescently stained cells.', version: '1.2', content: '1. Fix cells with 4% PFA\n2. Permeabilize with 0.1% Triton-X\n3. Block with 3% BSA\n4. Primary antibody (1h RT)\n5. Secondary fluorescent antibody (45min RT)\n6. DAPI counterstain\n7. Mount coverslips\n8. Image on confocal (40x/63x obj)', created_by: members[3].id, tags: ['microscopy', 'confocal', 'immunofluorescence'] },
        ]);
        console.log('📋 Created 5 protocols');

        // ─── 5 PROJECTS ───
        const projects = await Project.bulkCreate([
            { name: 'HeLa Drug Resistance Study', description: 'Investigating cisplatin resistance mechanisms in HeLa cervical cancer cells through multi-omics approaches.', status: 'Active', start_date: '2026-01-15', end_date: '2026-06-30', progress: 35, color: '#6366f1', tags: ['cancer', 'drug resistance', 'cisplatin'] },
            { name: 'COVID-19 Variant Genomics', description: 'Whole genome sequencing and variant analysis of emerging SARS-CoV-2 sub-lineages from clinical samples.', status: 'Active', start_date: '2026-01-01', end_date: '2026-04-30', progress: 55, color: '#ef4444', tags: ['COVID-19', 'genomics', 'NGS'] },
            { name: 'Neural Stem Cell Differentiation', description: 'Optimizing protocols for directed differentiation of neural stem cells into dopaminergic neurons.', status: 'Active', start_date: '2026-02-01', end_date: '2026-08-31', progress: 20, color: '#10b981', tags: ['stem cells', 'neuroscience', 'differentiation'] },
            { name: 'Microbiome-Cancer Interaction', description: 'Studying gut microbiome composition changes in colorectal cancer patients using 16S rRNA sequencing.', status: 'Planning', start_date: '2026-03-01', end_date: '2026-12-31', progress: 5, color: '#f59e0b', tags: ['microbiome', 'cancer', '16S'] },
            { name: 'CRISPR Screen for Oncogenes', description: 'Genome-wide CRISPR knockout screen to identify novel oncogenes in breast cancer cell lines.', status: 'Completed', start_date: '2025-06-01', end_date: '2026-01-31', progress: 100, color: '#8b5cf6', tags: ['CRISPR', 'screen', 'oncogenes'] },
        ]);
        console.log('📁 Created 5 projects');

        // ─── PROJECT MEMBERS ───
        await ProjectMember.bulkCreate([
            { project_id: projects[0].id, user_id: members[0].id, role: 'Lead' },
            { project_id: projects[0].id, user_id: members[2].id, role: 'Member' },
            { project_id: projects[0].id, user_id: members[3].id, role: 'Member' },
            { project_id: projects[1].id, user_id: members[1].id, role: 'Lead' },
            { project_id: projects[1].id, user_id: members[4].id, role: 'Member' },
            { project_id: projects[2].id, user_id: members[0].id, role: 'Lead' },
            { project_id: projects[2].id, user_id: members[3].id, role: 'Member' },
            { project_id: projects[3].id, user_id: members[1].id, role: 'Lead' },
            { project_id: projects[3].id, user_id: members[2].id, role: 'Member' },
            { project_id: projects[3].id, user_id: members[4].id, role: 'Member' },
            { project_id: projects[4].id, user_id: members[0].id, role: 'Lead' },
            { project_id: projects[4].id, user_id: members[2].id, role: 'Member' },
        ]);

        // ─── 10 EXPERIMENTS ───
        const today = new Date().toISOString().split('T')[0];
        const experiments = await Experiment.bulkCreate([
            // Project 1 experiments
            { name: 'Cisplatin IC50 Determination', type: 'Wet-lab', status: 'In Progress', start_date: '2026-02-01', end_date: '2026-03-15', progress: 60, notes: 'Testing cisplatin concentrations 0.1-100µM', project_id: projects[0].id, protocol_id: protocols[0].id },
            { name: 'Resistance Gene Expression Profiling', type: 'Wet-lab', status: 'Planned', start_date: '2026-03-01', end_date: '2026-04-15', progress: 0, notes: 'qPCR panel for drug resistance genes', project_id: projects[0].id, protocol_id: protocols[2].id },
            { name: 'Cisplatin-Resistant Clone Western Blot', type: 'Wet-lab', status: 'In Progress', start_date: '2026-02-10', end_date: '2026-03-01', progress: 40, notes: 'Checking ABC transporter protein levels', project_id: projects[0].id, protocol_id: protocols[1].id },
            // Project 2 experiments
            { name: 'SARS-CoV-2 WGS Batch 3', type: 'Wet-lab', status: 'In Progress', start_date: '2026-02-15', end_date: '2026-03-10', progress: 70, notes: '48 clinical samples, Illumina NextSeq', project_id: projects[1].id, protocol_id: protocols[3].id },
            { name: 'Variant Calling Pipeline v2', type: 'Dry-lab', status: 'Completed', start_date: '2026-01-10', end_date: '2026-02-10', progress: 100, notes: 'NextFlow pipeline for variant detection', project_id: projects[1].id },
            { name: 'Phylogenetic Analysis of KP.3.1 Lineage', type: 'Computational', status: 'In Progress', start_date: '2026-02-20', end_date: '2026-03-20', progress: 30, notes: 'BEAST2 phylogenetic reconstruction', project_id: projects[1].id },
            // Project 3 experiments
            { name: 'NSC Passage & Expansion', type: 'Wet-lab', status: 'In Progress', start_date: '2026-02-05', end_date: '2026-03-30', progress: 50, notes: 'Expanding NSC cultures for differentiation', project_id: projects[2].id, protocol_id: protocols[0].id },
            { name: 'Dopaminergic Differentiation Protocol Optimization', type: 'Wet-lab', status: 'Planned', start_date: '2026-03-01', end_date: '2026-05-31', progress: 0, notes: 'Testing SHH + FGF8 concentrations', project_id: projects[2].id },
            // Project 4 experiment
            { name: '16S rRNA Sample Processing', type: 'Wet-lab', status: 'Planned', start_date: '2026-03-15', end_date: '2026-04-30', progress: 0, notes: 'DNA extraction from stool samples', project_id: projects[3].id },
            // Project 5 experiment
            { name: 'CRISPR Screen Data Analysis', type: 'Computational', status: 'Completed', start_date: '2025-11-01', end_date: '2026-01-15', progress: 100, notes: 'MAGeCK analysis of screen results', project_id: projects[4].id },
        ]);
        console.log('🧪 Created 10 experiments');

        // ─── EXPERIMENT MEMBERS ───
        await ExperimentMember.bulkCreate([
            { experiment_id: experiments[0].id, user_id: members[2].id },
            { experiment_id: experiments[0].id, user_id: members[3].id },
            { experiment_id: experiments[1].id, user_id: members[2].id },
            { experiment_id: experiments[2].id, user_id: members[2].id },
            { experiment_id: experiments[3].id, user_id: members[1].id },
            { experiment_id: experiments[3].id, user_id: members[4].id },
            { experiment_id: experiments[4].id, user_id: members[1].id },
            { experiment_id: experiments[5].id, user_id: members[4].id },
            { experiment_id: experiments[6].id, user_id: members[3].id },
            { experiment_id: experiments[7].id, user_id: members[0].id },
            { experiment_id: experiments[7].id, user_id: members[3].id },
            { experiment_id: experiments[8].id, user_id: members[2].id },
            { experiment_id: experiments[9].id, user_id: members[1].id },
            { experiment_id: experiments[9].id, user_id: members[4].id },
        ]);

        // ─── WET LAB DETAILS ───
        await WetLabDetail.bulkCreate([
            { experiment_id: experiments[0].id, cell_line: 'HeLa', cell_source: 'ATCC (CCL-2)', media_recipe: 'DMEM + 10% FBS + 1% Pen/Strep', antibiotics: 'Penicillin/Streptomycin', fbs_percentage: 10, seeding_density: '5000 cells/well', seeding_datetime: '2026-02-01T09:00:00Z', passage_number: 25, treatment_drug: 'Cisplatin', treatment_concentration: '0.1-100 µM', treatment_duration: '48 hours', incubation_temp: 37, incubation_co2: 5, incubation_humidity: 95, morphology_observations: 'Cells showing dose-dependent morphology changes at >10µM' },
            { experiment_id: experiments[2].id, cell_line: 'HeLa-CisR', cell_source: 'In-house resistant clone', media_recipe: 'DMEM + 10% FBS + 1% Pen/Strep + 1µM Cisplatin', antibiotics: 'Penicillin/Streptomycin', fbs_percentage: 10, passage_number: 8, incubation_temp: 37, incubation_co2: 5, incubation_humidity: 95 },
            { experiment_id: experiments[6].id, cell_line: 'ReNcell VM', cell_source: 'Sigma-Aldrich (SCC008)', media_recipe: 'DMEM/F12 + N2 + B27 + EGF + bFGF', fbs_percentage: 0, seeding_density: '50000 cells/cm²', passage_number: 12, split_datetime: '2026-02-20T10:00:00Z', incubation_temp: 37, incubation_co2: 5, incubation_humidity: 95, morphology_observations: 'Healthy neurospheres forming, ready for differentiation' },
        ]);

        // ─── DRY LAB DETAILS ───
        await DryLabDetail.bulkCreate([
            { experiment_id: experiments[4].id, algorithm_name: 'iVar + Pangolin', dataset_description: '96 SARS-CoV-2 WGS samples from Batch 1 & 2', script_version: 'v2.3.0', git_reference: 'main@abc123f', parameters: { min_depth: 10, min_freq: 0.03, min_quality: 20 }, logs: 'Pipeline completed successfully. 94/96 samples passed QC.' },
            { experiment_id: experiments[5].id, algorithm_name: 'BEAST2 + TreeAnnotator', dataset_description: '200 KP.3.1 lineage sequences from GISAID', script_version: 'BEAST v2.7.5', git_reference: 'feature/kp31-analysis', parameters: { clock_model: 'strict', substitution_model: 'HKY', chain_length: 50000000 }, logs: 'MCMC chain running, ESS values improving' },
            { experiment_id: experiments[9].id, algorithm_name: 'MAGeCK', dataset_description: 'CRISPR screen sgRNA counts from MCF7 cells', script_version: 'MAGeCK v0.5.9', git_reference: 'main@def456a', parameters: { fdr_threshold: 0.05, norm_method: 'median' }, input_files: ['counts_table.csv', 'library_design.csv'], output_files: ['gene_summary.txt', 'sgrna_summary.txt', 'volcano_plot.pdf'], logs: 'Analysis complete. 42 significant hits identified (FDR < 0.05).' },
        ]);

        // ─── SUBTASKS ───
        await Subtask.bulkCreate([
            // Cisplatin IC50
            { experiment_id: experiments[0].id, title: 'Prepare cisplatin dilution series', status: 'Completed', order: 0, assigned_to: members[2].id },
            { experiment_id: experiments[0].id, title: 'Seed HeLa cells in 96-well plate', status: 'Completed', order: 1, assigned_to: members[2].id },
            { experiment_id: experiments[0].id, title: 'Add cisplatin treatments', status: 'Completed', order: 2, assigned_to: members[2].id },
            { experiment_id: experiments[0].id, title: 'MTT assay (48h)', status: 'In Progress', order: 3, due_date: today, assigned_to: members[3].id },
            { experiment_id: experiments[0].id, title: 'Read plate & analyze data', status: 'Pending', order: 4, assigned_to: members[2].id },
            // WGS Batch 3
            { experiment_id: experiments[3].id, title: 'DNA extraction from samples', status: 'Completed', order: 0, assigned_to: members[1].id },
            { experiment_id: experiments[3].id, title: 'Library preparation', status: 'Completed', order: 1, assigned_to: members[1].id },
            { experiment_id: experiments[3].id, title: 'Sequencing run', status: 'Completed', order: 2, assigned_to: members[1].id },
            { experiment_id: experiments[3].id, title: 'Data QC & trimming', status: 'In Progress', order: 3, assigned_to: members[4].id },
            { experiment_id: experiments[3].id, title: 'Variant calling & annotation', status: 'Pending', order: 4, assigned_to: members[4].id },
            // NSC Passage
            { experiment_id: experiments[6].id, title: 'Thaw NSC vial', status: 'Completed', order: 0, assigned_to: members[3].id },
            { experiment_id: experiments[6].id, title: 'Passage to T75 flask', status: 'Completed', order: 1, assigned_to: members[3].id },
            { experiment_id: experiments[6].id, title: 'Expand to passage 15', status: 'In Progress', order: 2, due_date: today, assigned_to: members[3].id },
            { experiment_id: experiments[6].id, title: 'Freeze backup vials', status: 'Pending', order: 3, assigned_to: members[3].id },
        ]);
        console.log('✅ Created subtasks');

        // ─── REMINDERS ───
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const in5days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

        await Reminder.bulkCreate([
            { title: 'HeLa MTT assay - Read plate', type: 'Incubation', due_date: now, user_id: members[3].id, experiment_id: experiments[0].id, priority: 'High', description: '48h incubation ends today. Read plate at 570nm.' },
            { title: 'NSC passage due (P13→P14)', type: 'Passage', due_date: tomorrow, user_id: members[3].id, experiment_id: experiments[6].id, priority: 'High', description: 'Cells at ~90% confluency, need to passage.' },
            { title: 'SARS-CoV-2 data QC deadline', type: 'Experiment', due_date: in3days, user_id: members[4].id, experiment_id: experiments[3].id, priority: 'Medium', description: 'Complete QC by Friday for team meeting.' },
            { title: 'Cisplatin-R clone Western Blot', type: 'Treatment', due_date: tomorrow, user_id: members[2].id, experiment_id: experiments[2].id, priority: 'Medium', description: 'Start lysate preparation for western blot.' },
            { title: 'Project 4 kickoff meeting', type: 'Project', due_date: in5days, project_id: projects[3].id, user_id: members[1].id, priority: 'Low', description: 'Discuss sample collection timeline and budget.' },
            { title: 'Order new FBS lot', type: 'Custom', due_date: in3days, user_id: members[0].id, priority: 'Medium', description: 'Current FBS lot #A2345 running low. Need to order and lot-test.' },
        ]);
        console.log('🔔 Created reminders');

        // ─── DAILY TASKS ───
        await DailyTask.bulkCreate([
            { title: 'Read MTT plate (HeLa cisplatin)', date: today, user_id: members[3].id, experiment_id: experiments[0].id, project_id: projects[0].id, status: 'Pending', order: 0 },
            { title: 'Feed NSC cultures', date: today, user_id: members[3].id, experiment_id: experiments[6].id, project_id: projects[2].id, status: 'Pending', order: 1 },
            { title: 'Run variant calling on Batch 3 data', date: today, user_id: members[4].id, experiment_id: experiments[3].id, project_id: projects[1].id, status: 'In Progress', order: 0, check_in_time: new Date() },
            { title: 'Prepare Western Blot lysates', date: today, user_id: members[2].id, experiment_id: experiments[2].id, project_id: projects[0].id, status: 'Pending', order: 0 },
            { title: 'BEAST2 analysis review', date: today, user_id: members[4].id, experiment_id: experiments[5].id, project_id: projects[1].id, status: 'Pending', order: 1 },
            { title: 'Lab meeting - Project updates', date: today, user_id: members[0].id, status: 'Pending', order: 0, description: 'Weekly lab meeting at 3 PM' },
        ]);
        console.log('📅 Created daily tasks');

        // ─── ACTIVITY LOG ───
        await ActivityLog.bulkCreate([
            { user_id: members[0].id, action: 'Created project', entity_type: 'Project', entity_id: projects[0].id, entity_name: projects[0].name },
            { user_id: members[1].id, action: 'Created project', entity_type: 'Project', entity_id: projects[1].id, entity_name: projects[1].name },
            { user_id: members[2].id, action: 'Created experiment', entity_type: 'Experiment', entity_id: experiments[0].id, entity_name: experiments[0].name },
            { user_id: members[3].id, action: 'Completed subtask', entity_type: 'Subtask', entity_name: 'Seed HeLa cells in 96-well plate' },
            { user_id: members[1].id, action: 'Completed experiment', entity_type: 'Experiment', entity_id: experiments[4].id, entity_name: experiments[4].name },
            { user_id: members[4].id, action: 'Started experiment', entity_type: 'Experiment', entity_id: experiments[5].id, entity_name: experiments[5].name },
            { user_id: members[0].id, action: 'Created protocol', entity_type: 'Protocol', entity_id: protocols[0].id, entity_name: protocols[0].name },
        ]);
        console.log('📝 Created activity logs');

        console.log('\n🎉 Seed complete! Login credentials:');
        console.log('   Admin:      admin@lab.org / password123');
        console.log('   PI:         priya@lab.org / password123');
        console.log('   Senior:     rahul@lab.org / password123');
        console.log('   Researcher: ananya@lab.org / password123');
        console.log('   Researcher: vikram@lab.org / password123');
        console.log('   Student:    meera@lab.org / password123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seed();
