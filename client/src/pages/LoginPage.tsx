import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { GraduationCap, Eye, EyeOff, AlertCircle, Sparkles, Shield, BookOpen } from 'lucide-react';

interface LoginFormInputs {
  email: string;
  password: string;
  rememberMe: boolean;
}

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>();

  const onSubmit = async (data: LoginFormInputs) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      setApiError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background dark:bg-dark-bg">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        {/* Decorative circles */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/10">
              <GraduationCap className="h-7 w-7" />
            </div>
            <span className="font-bold text-2xl tracking-tight">Career Hub</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Welcome back to your academic workspace
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-12 max-w-md">
            Access your personalized dashboard, manage courses, and leverage AI-powered assistance.
          </p>

          <div className="space-y-4">
            {[
              { icon: Shield, text: 'Role-based access control' },
              { icon: Sparkles, text: 'AI-powered document intelligence' },
              { icon: BookOpen, text: 'Complete academic management' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-white/80">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10 select-none">
          <div className="bg-gradient-to-br from-primary to-primary-600 text-white p-2 rounded-xl">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-text-primary dark:text-secondary-100 tracking-tight">Career Hub</span>
        </div>

        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-text-primary dark:text-secondary-100 tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-text-secondary dark:text-secondary-400 mt-2">
              Enter your institutional email to access your portal
            </p>
          </div>

          {/* Error Banner */}
          {apiError && (
            <div className="flex gap-3 items-start p-4 bg-danger-50 dark:bg-danger/10 border border-danger/15 text-danger-text dark:text-danger rounded-xl text-sm mb-6 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Sign in failed</span>
                <span className="text-xs">{apiError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@careerhub.edu"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[30px] text-text-secondary dark:text-secondary-500 hover:text-text-primary dark:hover:text-secondary-300 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs select-none">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-text-secondary dark:text-secondary-400">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border dark:border-dark-border text-primary focus:ring-primary/40 focus:ring-offset-0 focus:outline-none cursor-pointer bg-white dark:bg-dark-surface"
                  {...register('rememberMe')}
                />
                Remember me
              </label>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-primary font-medium hover:underline hover:text-primary-hover dark:text-primary-300"
              >
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-text-secondary dark:text-secondary-500">
              Powered by Career Hub Enterprise Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
