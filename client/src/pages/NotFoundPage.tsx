import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { motion } from 'framer-motion';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background dark:bg-dark-bg px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full text-center space-y-6"
            >
                <div className="inline-flex items-center justify-center p-4 bg-primary-50 dark:bg-primary/10 text-primary dark:text-primary-300 rounded-2xl border border-primary/10">
                    <FileQuestion className="h-10 w-10" />
                </div>

                <div className="space-y-2">
                    <p className="text-7xl font-bold text-text-primary/10 dark:text-white/10">404</p>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white -mt-4">
                        Page not found
                    </h1>
                    <p className="text-sm text-text-secondary dark:text-secondary-400 leading-relaxed">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Button onClick={() => navigate(-1)} variant="outline" icon={<ArrowLeft className="h-4 w-4" />}>
                        Go Back
                    </Button>
                    <Button onClick={() => navigate('/')} icon={<Home className="h-4 w-4" />}>
                        Home
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
