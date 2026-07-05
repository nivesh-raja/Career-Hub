import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
  BookOpen,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button.js';
import { Card, CardContent } from '../components/ui/Card.js';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Student Portal',
      description: 'Access lecture content, track assignments, and view schedules in a distraction-free environment.',
      icon: BookOpen,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Faculty Workspace',
      description: 'Streamline classroom organization, assign work, and manage departments in a unified workspace.',
      icon: Users,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: 'Administration Panel',
      description: 'Manage users, departments, classrooms, and subjects with strict role-based access controls.',
      icon: ShieldCheck,
      gradient: 'from-emerald-500 to-green-600',
    },
    {
      title: 'AI Assistant',
      description: 'RAG-powered AI that analyzes uploaded documents and provides intelligent academic assistance.',
      icon: Sparkles,
      gradient: 'from-cyan-500 to-teal-600',
      isAi: true,
    },
  ];

  const stats = [
    { label: 'Uptime SLA', value: '99.9%' },
    { label: 'Active Roles', value: '3+' },
    { label: 'API Endpoints', value: '50+' },
    { label: 'AI-Powered', value: 'RAG' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-bg text-text-primary dark:text-secondary-200">
      {/* Navbar */}
      <header className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-border dark:border-dark-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 select-none">
            <div className="bg-gradient-to-br from-primary to-primary-600 text-white p-1.5 rounded-lg shadow-subtle">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg text-text-primary dark:text-secondary-100 tracking-tight">Career Hub</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {['Home', 'Features', 'About', 'Contact'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-text-secondary dark:text-secondary-400 hover:text-text-primary dark:hover:text-secondary-200 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary/10 border border-primary/10 text-xs font-semibold text-primary dark:text-primary-300 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Enterprise Academic Platform — AI-Powered
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary dark:text-white leading-[1.08] mb-6 max-w-4xl"
          >
            One Platform for{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Students, Faculty
            </span>{' '}
            and Administration
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-text-secondary dark:text-secondary-400 max-w-2xl mb-10 leading-relaxed"
          >
            A modern academic management platform that streamlines classroom management, learning resources, communication, and AI-powered academic assistance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button size="lg" className="gap-2 px-8" onClick={() => navigate('/login')}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="px-8" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Learn More
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12"
          >
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-text-primary dark:text-white">{stat.value}</div>
                <div className="text-xs text-text-secondary dark:text-secondary-400 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary dark:text-white mb-4">
              Everything required for modern academia
            </h2>
            <p className="text-text-secondary dark:text-secondary-400 text-sm md:text-base">
              Purpose-built tools tailored for college academic ecosystems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeInUp}
              >
                <Card className="h-full hover:shadow-float hover:-translate-y-1 transition-all duration-300 cursor-default border-border/60 dark:border-dark-border/60">
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feat.gradient} text-white shadow-subtle`}>
                        <feat.icon className="h-5 w-5" />
                      </div>
                      {feat.isAi && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent-50 dark:bg-accent/10 px-2 py-0.5 rounded-full border border-accent/10">
                          Active
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-text-primary dark:text-secondary-100 text-base mb-2">{feat.title}</h3>
                    <p className="text-text-secondary dark:text-secondary-400 text-sm leading-relaxed flex-1">{feat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 bg-white dark:bg-dark-bg border-t border-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 dark:text-white">
              Enterprise-grade foundation
            </h2>
            <p className="text-text-secondary dark:text-secondary-400 text-sm md:text-base mb-8 leading-relaxed">
              Career Hub is engineered as a reliable, scalable intranet and learning management platform with strict role-based security at every layer.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: Lock, text: 'Strict role permissions mapping (Student, Faculty, Admin)' },
                { icon: ShieldCheck, text: 'JWT authentication with secure token management' },
                { icon: Globe, text: 'MongoDB Atlas with Mongoose ODM schemas' },
                { icon: Zap, text: 'AI-powered RAG pipeline for document intelligence' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-dark-surface border border-border/50 dark:border-dark-border/50">
                  <div className="p-1.5 rounded-md bg-success/10">
                    <item.icon className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm font-medium text-text-primary dark:text-secondary-200">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-dark-surface border-b border-border dark:border-dark-border">
                <h3 className="font-bold text-base text-text-primary dark:text-secondary-100">Technical Architecture</h3>
              </div>
              <div className="p-6 space-y-4">
                {[
                  { label: 'Client Framework', value: 'React 19 + Vite' },
                  { label: 'Backend API', value: 'Node.js + Express.js' },
                  { label: 'Database', value: 'MongoDB Atlas' },
                  { label: 'Authentication', value: 'JWT + bcrypt' },
                  { label: 'AI Engine', value: 'LangChain + Gemini' },
                  { label: 'Vector Store', value: 'ChromaDB' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-text-secondary dark:text-secondary-400">{item.label}</span>
                    <span className="font-semibold bg-slate-50 dark:bg-dark-surface px-3 py-1 border border-border dark:border-dark-border rounded-lg text-text-primary dark:text-secondary-200 text-xs">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-white dark:bg-dark-card border-t border-border dark:border-dark-border mt-auto py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-primary to-primary-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-text-primary dark:text-secondary-100 tracking-tight">Career Hub</span>
          </div>

          <p className="text-xs text-text-secondary dark:text-secondary-500">
            &copy; {new Date().getFullYear()} Career Hub Academic Management Platform. All rights reserved.
          </p>

          <div className="flex gap-6 text-xs text-text-secondary dark:text-secondary-500 font-medium">
            <a href="#" className="hover:text-text-primary dark:hover:text-secondary-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-text-primary dark:hover:text-secondary-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-text-primary dark:hover:text-secondary-300 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
