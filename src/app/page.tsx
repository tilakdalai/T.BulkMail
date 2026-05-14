'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/app/Navbar';
import Sidebar from '@/components/app/Sidebar';
import LandingPage from '@/components/app/LandingPage';
import LoginPage from '@/components/app/LoginPage';
import RegisterPage from '@/components/app/RegisterPage';
import PricingPage from '@/components/app/PricingPage';
import DashboardPage from '@/components/app/DashboardPage';
import CreateCampaignPage from '@/components/app/CreateCampaignPage';
import CampaignsPage from '@/components/app/CampaignsPage';
import CampaignDetailPage from '@/components/app/CampaignDetailPage';
import TemplatesPage from '@/components/app/TemplatesPage';
import ProfilePage from '@/components/app/ProfilePage';
import AdminDashboardPage from '@/components/app/AdminDashboardPage';
import AdminUsersPage from '@/components/app/AdminUsersPage';
import AdminCampaignsPage from '@/components/app/AdminCampaignsPage';
import { Mail, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'create-campaign'
  | 'campaigns'
  | 'campaign-detail'
  | 'templates'
  | 'profile'
  | 'pricing'
  | 'admin'
  | 'admin-users'
  | 'admin-campaigns';

// System dark mode detector
function useSystemDarkMode() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mq.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
}

// Beautiful splash loading screen
function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-green-500/8 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'backOut' }}
        >
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute w-24 h-24 rounded-2xl bg-emerald-500/20 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Mail className="h-10 w-10 text-white" />
            </div>
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="text-foreground">T.</span>
            <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">BulkMail</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-wide">
            Bulk Email Campaign Platform
          </p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <div className="relative h-1 w-48 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading your workspace...</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [showSplash, setShowSplash] = useState(true);

  useSystemDarkMode();

  // Show splash screen for at least 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handlePageChange = useCallback((page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo(0, 0);
  }, []);

  const handleSelectCampaign = useCallback((id: string) => {
    setSelectedCampaignId(id);
    setCurrentPage('campaign-detail');
  }, []);

  // Redirect logic
  React.useEffect(() => {
    if (loading) return;

    const protectedPages: Page[] = [
      'dashboard',
      'create-campaign',
      'campaigns',
      'campaign-detail',
      'templates',
      'profile',
      'admin',
      'admin-users',
      'admin-campaigns',
    ];

    if (!user && protectedPages.includes(currentPage)) {
      setCurrentPage('login');
    }

    const adminPages: Page[] = ['admin', 'admin-users', 'admin-campaigns'];
    if (user && adminPages.includes(currentPage) && user.role !== 'ADMIN') {
      setCurrentPage('dashboard');
    }
  }, [user, loading, currentPage]);

  // Show splash while loading OR during the initial 2s
  if (loading || showSplash) {
    return <SplashScreen />;
  }

  const isLoggedIn = !!user;
  const showSidebar = isLoggedIn && !['landing', 'login', 'register', 'pricing'].includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onPageChange={handlePageChange} />;
      case 'login':
        return <LoginPage onPageChange={handlePageChange} />;
      case 'register':
        return <RegisterPage onPageChange={handlePageChange} />;
      case 'pricing':
        return <PricingPage onPageChange={handlePageChange} />;
      case 'dashboard':
        return <DashboardPage onPageChange={handlePageChange} />;
      case 'create-campaign':
        return <CreateCampaignPage onPageChange={handlePageChange} />;
      case 'campaigns':
        return <CampaignsPage onPageChange={handlePageChange} onSelectCampaign={handleSelectCampaign} />;
      case 'campaign-detail':
        return <CampaignDetailPage onPageChange={handlePageChange} campaignId={selectedCampaignId} />;
      case 'templates':
        return <TemplatesPage onPageChange={handlePageChange} />;
      case 'profile':
        return <ProfilePage onPageChange={handlePageChange} />;
      case 'admin':
        return <AdminDashboardPage onPageChange={handlePageChange} />;
      case 'admin-users':
        return <AdminUsersPage onPageChange={handlePageChange} />;
      case 'admin-campaigns':
        return <AdminCampaignsPage onPageChange={handlePageChange} />;
      default:
        return <LandingPage onPageChange={handlePageChange} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-background flex flex-col"
      >
        <Navbar currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="flex flex-1 pt-16">
          {showSidebar && (
            <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />
          )}
          <main className="flex-1 overflow-auto">
            {renderPage()}
          </main>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
