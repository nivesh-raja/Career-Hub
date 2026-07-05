import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeProvider.js';
import { Bell, Search, Menu, Sun, Moon, Sparkles, Settings, LogOut, User } from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { Avatar } from '../ui/Avatar.js';
import { cn } from '../../utils/cn.js';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeVariant = (role: string): 'danger' | 'warning' | 'primary' | 'secondary' => {
    switch (role) {
      case 'admin': return 'danger';
      case 'faculty': return 'warning';
      case 'student': return 'primary';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'faculty': return 'Faculty';
      case 'student': return 'Student';
      default: return '';
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-border dark:border-dark-border h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center p-2 rounded-lg text-text-secondary dark:text-secondary-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search */}
        <div className="relative w-60 lg:w-72 hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary/50 dark:text-secondary-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg text-sm text-text-primary dark:text-secondary-200 placeholder:text-text-secondary/40 dark:placeholder:text-secondary-600 focus:outline-none focus:bg-white dark:focus:bg-dark-hover focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary/40 dark:text-secondary-600 bg-slate-100 dark:bg-dark-hover rounded border border-border/50 dark:border-dark-border font-mono">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Date */}
        <span className="text-xs font-medium text-text-secondary dark:text-secondary-400 hidden lg:block">
          {formattedDate}
        </span>

        <div className="h-4 w-px bg-border dark:bg-dark-border hidden lg:block" />

        {/* AI Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-50 dark:bg-accent/10 border border-accent/10 dark:border-accent/20">
          <Sparkles className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-semibold text-accent-600 dark:text-accent-400">AI Active</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-secondary dark:text-secondary-400 hover:bg-slate-100 dark:hover:bg-dark-hover transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-text-secondary dark:text-secondary-400 hover:bg-slate-100 dark:hover:bg-dark-hover rounded-lg transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white dark:ring-dark-card animate-pulse" />
        </button>

        <div className="h-4 w-px bg-border dark:bg-dark-border hidden md:block" />

        {/* Role Badge */}
        {user && (
          <Badge variant={getRoleBadgeVariant(user.role)} className="hidden md:inline-flex">
            {getRoleLabel(user.role)}
          </Badge>
        )}

        {/* Profile Dropdown */}
        {user && (
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors"
            >
              <Avatar name={user.name} size="sm" />
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-text-primary dark:text-secondary-200 leading-none">
                  {user.name}
                </p>
                {user.department && (
                  <p className="text-[10px] text-text-secondary dark:text-secondary-500 mt-0.5 leading-none">
                    {user.department.code}
                  </p>
                )}
              </div>
            </button>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-card border border-border dark:border-dark-border rounded-xl shadow-dropdown py-1.5 animate-slide-down z-50">
                <div className="px-4 py-2.5 border-b border-border dark:border-dark-border">
                  <p className="text-sm font-semibold text-text-primary dark:text-secondary-200">{user.name}</p>
                  <p className="text-xs text-text-secondary dark:text-secondary-400 mt-0.5">{user.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { navigate(`/${user.role}/profile`); setIsProfileOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Your Profile
                  </button>
                  <button
                    onClick={() => { navigate(`/${user.role}/settings`); setIsProfileOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 hover:bg-slate-50 dark:hover:bg-dark-hover transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </div>
                <div className="border-t border-border dark:border-dark-border pt-1">
                  <button
                    onClick={() => { logout(); setIsProfileOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-danger hover:bg-danger-50 dark:hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
