import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  BookOpen,
  Network,
  Shield,
  FileSpreadsheet,
  FileText,
  Megaphone,
  Calendar,
  Sparkles,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { Avatar } from '../ui/Avatar.js';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavSection {
  title: string;
  items: { name: string; path: string; icon: React.FC<{ className?: string }> }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Core: true, Management: true });

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin Panel';
      case 'faculty': return 'Faculty Portal';
      case 'student': return 'Student Portal';
      default: return '';
    }
  };

  const coreItems = [
    { name: 'Dashboard', path: `/${user?.role}/dashboard`, icon: LayoutDashboard },
    { name: 'Analytics', path: `/${user?.role}/analytics`, icon: BarChart3 },
    { name: 'Profile', path: `/${user?.role}/profile`, icon: User },
    { name: 'Settings', path: `/${user?.role}/settings`, icon: Settings },
  ];

  const getRoleLinks = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'User Directory', path: '/admin/users', icon: Users },
        { name: 'Role Management', path: '/admin/roles', icon: Shield },
        { name: 'Departments', path: '/admin/departments', icon: Network },
        { name: 'Classrooms', path: '/admin/classrooms', icon: BookOpen },
        { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
        { name: 'Announcements', path: '/admin/announcements', icon: Megaphone },
        { name: 'AI Assistant', path: '/admin/ai', icon: Sparkles },
      ];
    }
    if (user?.role === 'faculty') {
      return [
        { name: 'My Classrooms', path: '/faculty/classrooms', icon: BookOpen },
        { name: 'Students', path: '/faculty/students', icon: Users },
        { name: 'Assignments', path: '/faculty/assignments', icon: FileSpreadsheet },
        { name: 'Study Materials', path: '/faculty/materials', icon: BookOpen },
        { name: 'Question Papers', path: '/faculty/question-papers', icon: FileText },
        { name: 'Announcements', path: '/faculty/announcements', icon: Megaphone },
        { name: 'Schedule', path: '/faculty/schedule', icon: Calendar },
        { name: 'AI Assistant', path: '/faculty/ai', icon: Sparkles },
      ];
    }
    if (user?.role === 'student') {
      return [
        { name: 'My Classroom', path: '/student/classroom', icon: BookOpen },
        { name: 'Subjects', path: '/student/subjects', icon: BookOpen },
        { name: 'Assignments', path: '/student/assignments', icon: FileSpreadsheet },
        { name: 'Study Materials', path: '/student/materials', icon: BookOpen },
        { name: 'Question Papers', path: '/student/question-papers', icon: FileText },
        { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
        { name: 'Schedule', path: '/student/schedule', icon: Calendar },
        { name: 'AI Assistant', path: '/student/ai', icon: Sparkles },
      ];
    }
    return [];
  };

  const sections: NavSection[] = [
    { title: 'Core', items: coreItems },
    { title: 'Management', items: getRoleLinks() },
  ].filter(s => s.items.length > 0);

  const renderNavItem = (item: { name: string; path: string; icon: React.FC<{ className?: string }> }) => (
    <NavLink
      key={item.name}
      to={item.path}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-300'
            : 'text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 hover:bg-slate-100 dark:hover:bg-dark-hover',
          isCollapsed && 'justify-center px-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
          )}
          <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-primary dark:text-primary-300' : '')} />
          {!isCollapsed && (
            <span className="truncate">{item.name}</span>
          )}
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        'bg-white dark:bg-dark-sidebar border-r border-border dark:border-dark-border h-screen flex flex-col justify-between transition-all duration-300 z-30 fixed md:sticky top-0 left-0',
        isCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className={cn('h-16 flex items-center justify-between px-4 border-b border-border dark:border-dark-border shrink-0', isCollapsed && 'px-3 justify-center')}>
          <div className="flex items-center gap-2.5 overflow-hidden select-none">
            <div className="bg-gradient-to-br from-primary to-primary-600 text-white p-1.5 rounded-lg shrink-0 shadow-subtle">
              <GraduationCap className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-text-primary dark:text-secondary-100 text-[15px] tracking-tight whitespace-nowrap"
              >
                Career Hub
              </motion.span>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center justify-center p-1 rounded-md text-text-secondary dark:text-secondary-400 hover:bg-slate-100 dark:hover:bg-dark-hover hover:text-text-primary dark:hover:text-secondary-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {isCollapsed && (
          <div className="flex justify-center py-3 border-b border-border dark:border-dark-border shrink-0">
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden md:flex items-center justify-center p-1 rounded-md text-text-secondary dark:text-secondary-400 hover:bg-slate-100 dark:hover:bg-dark-hover hover:text-text-primary dark:hover:text-secondary-200 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sections.map((section, index) => (
            <div key={section.title}>
              {index > 0 && <div className="my-3 border-t border-border/60 dark:border-dark-border/60" />}

              {!isCollapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-3 py-1.5 mb-1"
                >
                  <span className="text-[10px] font-bold text-text-secondary/70 dark:text-secondary-500 uppercase tracking-[0.08em]">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-text-secondary/40 dark:text-secondary-600 transition-transform duration-200',
                      expandedSections[section.title] ? '' : '-rotate-90'
                    )}
                  />
                </button>
              )}

              <AnimatePresence initial={false}>
                {(isCollapsed || expandedSections[section.title]) && (
                  <motion.div
                    initial={isCollapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-0.5 overflow-hidden"
                  >
                    {section.items.map(renderNavItem)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border dark:border-dark-border shrink-0">
        {!isCollapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-slate-50 dark:bg-dark-surface rounded-lg">
            <Avatar name={user.name} size="sm" />
            <div className="overflow-hidden flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-text-primary dark:text-secondary-200 truncate">{user.name}</h4>
              <p className="text-[10px] text-text-secondary dark:text-secondary-500 truncate">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        )}
        {isCollapsed && user && (
          <div className="flex justify-center mb-2">
            <Avatar name={user.name} size="sm" />
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-danger hover:bg-danger-light dark:hover:bg-danger/10 transition-all duration-200',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
