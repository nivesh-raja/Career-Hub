import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Sidebar } from './Sidebar.js';
import { Topbar } from './Topbar.js';
import { cn } from '../../utils/cn.js';
import { Breadcrumb } from '../ui/Breadcrumb.js';
import { Skeleton } from '../ui/Skeleton.js';
import { GraduationCap } from 'lucide-react';

interface DashboardLayoutProps {
  allowedRoles?: Array<'student' | 'faculty' | 'admin'>;
}

function getBreadcrumbs(pathname: string): { label: string }[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Home' }];
  const labels: Record<string, string> = {
    admin: 'Admin',
    faculty: 'Faculty',
    student: 'Student',
    dashboard: 'Dashboard',
    users: 'Users',
    roles: 'Roles',
    classrooms: 'Classrooms',
    departments: 'Departments',
    subjects: 'Subjects',
    ai: 'AI Assistant',
    profile: 'Profile',
    settings: 'Settings',
    assignments: 'Assignments',
    materials: 'Study Materials',
    'question-papers': 'Question Papers',
    announcements: 'Announcements',
    schedule: 'Schedule',
    students: 'Students',
    classroom: 'Classroom',
  };

  parts.forEach(part => {
    crumbs.push({ label: labels[part] || part.charAt(0).toUpperCase() + part.slice(1) });
  });

  return crumbs;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background dark:bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary to-primary-600 text-white p-3 rounded-2xl shadow-glow">
              <GraduationCap className="h-8 w-8" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-text-primary dark:text-secondary-200">
              Career Hub
            </span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="min-h-screen flex bg-background dark:bg-dark-bg">
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'md:sticky top-0 z-40 fixed md:translate-x-0 transition-transform duration-300 h-screen',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />

        {/* Breadcrumb Bar */}
        <div className="px-4 md:px-6 py-2 border-b border-border/50 dark:border-dark-border/50 bg-white/50 dark:bg-dark-card/30">
          <Breadcrumb items={breadcrumbs} />
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
