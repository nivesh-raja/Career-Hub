import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Settings, Shield, Bell, HelpCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeProvider.js';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { label: 'Security & Password', icon: Shield, active: true },
    { label: 'Notifications', icon: Bell, active: false },
    { label: 'Preferences', icon: Settings, active: false },
    { label: 'Help & Docs', icon: HelpCircle, active: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight dark:text-white">Settings</h1>
        <p className="text-sm text-text-secondary dark:text-secondary-400 mt-1">
          Manage your account settings, security, and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Nav */}
        <Card className="p-2 flex flex-col gap-1 h-fit">
          {tabs.map(item => (
            <button
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left select-none transition-colors duration-200 ${item.active
                  ? 'bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary-300'
                  : 'text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 hover:bg-slate-50 dark:hover:bg-dark-hover'
                }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </Card>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Theme Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how Career Hub looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-dark-surface border border-border/50 dark:border-dark-border/50">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="h-5 w-5 text-primary dark:text-primary-300" />
                  ) : (
                    <Sun className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-secondary-200">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-secondary-400 mt-0.5">
                      {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${theme === 'dark' ? 'bg-primary' : 'bg-secondary-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Ensure your account is protected with a strong passphrase.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); alert('Password updated successfully (simulation)'); }} className="space-y-4 max-w-md">
                <Input
                  id="curr-pass"
                  type="password"
                  label="Current Password"
                  placeholder="Enter current password"
                />
                <Input
                  id="new-pass"
                  type="password"
                  label="New Password"
                  placeholder="Enter new password (min. 8 characters)"
                />
                <Input
                  id="confirm-pass"
                  type="password"
                  label="Confirm New Password"
                  placeholder="Verify new password"
                />
                <div className="pt-2">
                  <Button type="submit" size="sm">
                    Save Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
