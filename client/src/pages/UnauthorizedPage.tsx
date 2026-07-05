import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { useAuth } from '../context/AuthContext.js';
import { motion } from 'framer-motion';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background dark:bg-dark-bg px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center p-4 bg-danger-50 dark:bg-danger/10 text-danger rounded-2xl border border-danger/10">
          <ShieldAlert className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-danger">403 — Forbidden</p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white">
            Access Restricted
          </h1>
          <p className="text-sm text-text-secondary dark:text-secondary-400 leading-relaxed">
            Your account doesn't have permission to view this resource.
            If you believe this is an error, contact your administrator.
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={handleGoBack} variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
            Go to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
