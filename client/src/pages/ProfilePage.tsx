import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Card, CardContent } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Avatar } from '../components/ui/Avatar.js';
import { User, Mail, Shield, Building2, Phone, CheckCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'faculty': return 'Faculty Professor';
      case 'student': return 'Student Scholar';
      default: return 'User';
    }
  };

  const profileFields = [
    { label: 'Full Name', value: user?.name, icon: User },
    { label: 'Email Address', value: user?.email, icon: Mail },
    { label: 'Department', value: user?.department?.name || 'General Administration', icon: Building2 },
    { label: 'Phone', value: user?.phone || 'Not provided', icon: Phone },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">Your Profile</h1>
        <p className="text-sm text-text-secondary dark:text-secondary-400 mt-1">
          Review your personal details and academic credentials.
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="max-w-3xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary via-primary-600 to-accent relative">
          <div className="absolute inset-0 bg-black/5" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10">
            <div className="ring-4 ring-white dark:ring-dark-card rounded-full">
              <Avatar name={user?.name || 'U'} size="xl" />
            </div>
            <div className="flex-1 py-2">
              <h2 className="text-xl font-bold text-text-primary dark:text-secondary-100">{user?.name}</h2>
              <p className="text-sm text-text-secondary dark:text-secondary-400 mt-0.5">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 py-2">
              <Badge variant={user?.role === 'admin' ? 'danger' : user?.role === 'faculty' ? 'warning' : 'primary'}>
                {getRoleLabel(user?.role || '')}
              </Badge>
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Details */}
      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-text-primary dark:text-secondary-200 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profileFields.map(field => (
              <div key={field.label} className="p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-border/50 dark:border-dark-border/50">
                <span className="text-[11px] font-semibold text-text-secondary dark:text-secondary-500 uppercase tracking-wider block mb-2">
                  {field.label}
                </span>
                <div className="flex items-center gap-2.5">
                  <field.icon className="h-4 w-4 text-text-secondary dark:text-secondary-400 shrink-0" />
                  <span className="text-sm font-medium text-text-primary dark:text-secondary-200 truncate">
                    {field.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {user?.role && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-border/50 dark:border-dark-border/50">
              <span className="text-[11px] font-semibold text-text-secondary dark:text-secondary-500 uppercase tracking-wider block mb-2">
                Role Authorization
              </span>
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-text-secondary dark:text-secondary-400 shrink-0" />
                <span className="text-sm font-medium text-text-primary dark:text-secondary-200">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)} — Full access to {user.role} portal
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
