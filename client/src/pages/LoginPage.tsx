import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.js';
import { Input } from '../components/ui/Input.js';
import { Button } from '../components/ui/Button.js';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { GateIntro } from '../components/intro/GateIntro.js';

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
    <GateIntro>
      <div className="w-full max-w-md">
        <div className="text-left mb-6 select-none">
          <p className="page-kicker">Sign in</p>
          <h2>Welcome back</h2>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div className="flex gap-3 items-start p-3 bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs mb-4 animate-fade-in relative z-20">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Sign in failed</span>
              <span className="text-[11px] leading-snug">{apiError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              className="absolute right-3 top-[30px] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs select-none">
            <label className="flex items-center justify-start cursor-pointer font-medium">
              <input
                type="checkbox"
                {...register('rememberMe')}
              />
              Remember me
            </label>

            <a
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              Forgot Password?
            </a>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={isSubmitting}
          >
            Enter Career Hub
          </Button>
        </form>

        <div className="mt-6 text-center select-none flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('ch-intro-seen');
              window.location.reload();
            }}
            className="text-[10px] text-primary hover:underline font-medium transition-colors"
          >
            Replay Entrance Intro ↻
          </button>
          <p className="text-[10px] text-text-secondary dark:text-secondary-500">
            Powered by Career Hub Enterprise Platform
          </p>
        </div>
      </div>
    </GateIntro>
  );
};

