'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  PlusCircle,
  Mail,
  FileText,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Heart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface NavItem {
  label: string;
  page: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { label: 'Create Campaign', page: 'create', icon: PlusCircle },
  { label: 'Campaigns', page: 'campaigns', icon: Mail },
  { label: 'Templates', page: 'templates', icon: FileText },
  { label: 'Profile', page: 'profile', icon: User },
  { label: 'Admin Panel', page: 'admin', icon: Shield, adminOnly: true },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (page: string) => {
    if (page === 'admin') return currentPage.startsWith('admin');
    return currentPage === page;
  };

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`hidden lg:flex flex-col border-r bg-background transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="flex flex-col gap-1">
          {filteredItems.map((item, index) => {
            const active = isActive(item.page);
            const Icon = item.icon;

            const button = (
              <Button
                key={item.page}
                variant="ghost"
                onClick={() => onPageChange(item.page)}
                className={`w-full relative transition-all duration-200 ${
                  collapsed ? 'justify-center px-2' : 'justify-start px-3'
                } ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {/* Active indicator bar */}
                {active && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-emerald-600"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-4 w-4 shrink-0 ${collapsed ? '' : 'mr-3'}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium truncate overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.page} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <motion.div
                key={item.page}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {button}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Made by Tilak Dalai Credit */}
      {!collapsed && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-1.5 px-2 text-[10px] text-muted-foreground">
            Made with <Heart className="h-2.5 w-2.5 text-red-500" /> by{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tilak Dalai</span>
          </div>
        </div>
      )}

      <Separator />

      {/* User Info at Bottom */}
      <div
        className={`p-3 flex items-center gap-3 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900 dark:text-emerald-300">
            {user ? getInitials(user.name) : '?'}
          </AvatarFallback>
        </Avatar>
        <AnimatePresence>
          {!collapsed && user && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-w-0 overflow-hidden"
            >
              <p className="text-sm font-medium truncate">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {user.isPremium ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px] px-1.5 py-0">
                    Premium
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Free
                  </Badge>
                )}
                {user.role === 'ADMIN' && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[10px] px-1.5 py-0">
                    Admin
                  </Badge>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
