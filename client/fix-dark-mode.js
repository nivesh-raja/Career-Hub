import fs from 'fs';
import path from 'path';

const files = [
    'src/pages/Dashboards/FacultyDashboard.tsx',
    'src/pages/Dashboards/StudentDashboard.tsx',
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Exact match replacements!
    // Table Header
    content = content.replace(/className="bg-slate-50 border-b border-border text-\[9px\] font-bold text-text-secondary uppercase select-none"/g,
        'className="bg-slate-50 dark:bg-dark-surface border-b border-border dark:border-dark-border text-[9px] font-bold text-text-secondary dark:text-slate-400 uppercase select-none"');

    // Input background fields
    content = content.replace(/className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 border border-border rounded-md focus:outline-none focus:bg-white focus:border-primary"/g,
        'className="pl-9 pr-3 py-2 w-full text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-150 rounded-md focus:outline-none focus:bg-white dark:focus:bg-dark-card focus:border-primary"');
    content = content.replace(/className="text-xs bg-slate-50 border border-border rounded px-2 py-1 focus:outline-none"/g,
        'className="text-xs bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border text-text-primary dark:text-gray-250 rounded px-2 py-1 focus:outline-none cursor-pointer"');

    // Cards
    content = content.replace(/<Card className="bg-white">/g,
        '<Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">');
    content = content.replace(/<Card className="md:col-span-2 bg-white">/g,
        '<Card className="md:col-span-2 bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border">');
    content = content.replace(/<Card className="bg-white animate-fadeIn"/g,
        '<Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border animate-fadeIn"');
    content = content.replace(/<Card className="bg-white animate-fadeIn /g,
        '<Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border animate-fadeIn ');
    content = content.replace(/<Card className="bg-white ch-card-vibrant"/g,
        '<Card className="bg-white/40 dark:bg-dark-card/30 backdrop-blur-sm border border-border dark:border-dark-border ch-card-vibrant"');

    // CardHeader borders
    content = content.replace(/CardHeader className="flex flex-row items-center justify-between border-b border-border\/40 pb-4"/g,
        'CardHeader className="flex flex-row items-center justify-between border-b border-border/40 dark:border-dark-border/40 pb-4"');
    content = content.replace(/border-b border-border\/40/g, 'border-b border-border/40 dark:border-dark-border/40');
    content = content.replace(/border-b border-border/g, 'border-b border-border dark:border-dark-border');

    // Text colors logic
    content = content.replace(/text-text-primary"/g, 'text-text-primary dark:text-gray-200"');
    content = content.replace(/text-text-primary /g, 'text-text-primary dark:text-gray-200 ');
    content = content.replace(/text-text-secondary"/g, 'text-text-secondary dark:text-slate-400"');
    content = content.replace(/text-text-secondary /g, 'text-text-secondary dark:text-slate-400 ');

    // Hover bg
    content = content.replace(/hover:bg-slate-50\/20/g, 'hover:bg-slate-50/20 dark:hover:bg-dark-hover/30');
    content = content.replace(/hover:bg-slate-50\/50/g, 'hover:bg-slate-50/50 dark:hover:bg-dark-hover/30');

    // Specific nested bg
    content = content.replace(/bg-slate-50\/20/g, 'bg-slate-50/20 dark:bg-dark-surface/40');
    content = content.replace(/bg-slate-50\/30/g, 'bg-slate-50/30 dark:bg-dark-surface/40');
    content = content.replace(/bg-slate-50\/50/g, 'bg-slate-50/50 dark:bg-dark-surface/40');
    content = content.replace(/bg-slate-50 /g, 'bg-slate-50 dark:bg-dark-surface ');
    content = content.replace(/bg-slate-50"/g, 'bg-slate-50 dark:bg-dark-surface"');
    content = content.replace(/bg-slate-100/g, 'bg-slate-100 dark:bg-dark-surface');

    // Dividers
    content = content.replace(/divide-border\/60/g, 'divide-border/60 dark:divide-dark-border/60');
    content = content.replace(/divide-border"/g, 'divide-border dark:divide-dark-border"');

    // General borders
    content = content.replace(/border-border\/60/g, 'border-border/60 dark:border-dark-border/60');
    content = content.replace(/border-border"/g, 'border-border dark:border-dark-border"');
    content = content.replace(/border-border /g, 'border-border dark:border-dark-border ');

    // Clean duplication
    let prevContent;
    do {
        prevContent = content;
        content = content.replace(/dark:border-dark-border dark:border-dark-border/g, 'dark:border-dark-border');
        content = content.replace(/dark:text-gray-200 dark:text-gray-200/g, 'dark:text-gray-200');
        content = content.replace(/dark:text-slate-400 dark:text-slate-400/g, 'dark:text-slate-400');
        content = content.replace(/dark:bg-dark-surface dark:bg-dark-surface/g, 'dark:bg-dark-surface');
    } while (content !== prevContent);

    // Modal adjustments
    content = content.replace(/max-w-md bg-white border border-border/g,
        'max-w-md bg-white dark:bg-dark-card border border-border dark:border-dark-border');

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed dark mode safely');
