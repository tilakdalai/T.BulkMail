'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Shield,
  Home,
  CreditCard,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (page: string) => {
    onPageChange(page);
    setMobileOpen(false);
  };

  const publicLinks = [
    { label: 'Home', page: 'landing', icon: Home },
    { label: 'Pricing', page: 'pricing', icon: CreditCard },
  ];

  const authLinks = [
    { label: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
    { label: 'Campaigns', page: 'campaigns', icon: Mail },
    { label: 'Create', page: 'create-campaign', icon: PlusCircle },
    { label: 'Templates', page: 'templates', icon: FileText },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActivePage = (page: string) => {
    if (page === 'admin' && currentPage.startsWith('admin')) return true;
    return currentPage === page;
  };

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <motion.button
          onClick={() => handleNav(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <Mail className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            T.<span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">BulkMail</span>
          </span>
        </motion.button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {!user ? (
            <>
              {publicLinks.map((link) => (
                <Button
                  key={link.page}
                  variant={isActivePage(link.page) ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleNav(link.page)}
                  className={
                    isActivePage(link.page)
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : ''
                  }
                >
                  <link.icon className="h-4 w-4 mr-1" />
                  {link.label}
                </Button>
              ))}
              <Separator orientation="vertical" className="mx-2 h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNav('login')}
                className={
                  currentPage === 'login'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : ''
                }
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Button>
              <Button
                size="sm"
                onClick={() => handleNav('register')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Register
              </Button>
            </>
          ) : (
            <>
              {authLinks.map((link) => (
                <Button
                  key={link.page}
                  variant={isActivePage(link.page) ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleNav(link.page)}
                  className={
                    isActivePage(link.page)
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : ''
                  }
                >
                  <link.icon className="h-4 w-4 mr-1" />
                  {link.label}
                </Button>
              ))}
              {user.role === 'ADMIN' && (
                <Button
                  variant={isActivePage('admin') ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleNav('admin')}
                  className={
                    isActivePage('admin')
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : ''
                  }
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              )}
            </>
          )}
        </nav>

        {/* Right Side: User Menu */}
        <div className="flex items-center gap-2">
          {/* User Dropdown (Desktop) */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hidden md:flex items-center gap-2 px-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs dark:bg-emerald-900 dark:text-emerald-300">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium max-w-[100px] truncate">
                    {user.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {user.isPremium ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px]">
                          Premium
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Free
                        </Badge>
                      )}
                      {user.role === 'ADMIN' && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[10px]">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNav('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    handleNav('landing');
                  }}
                  className="text-red-600 dark:text-red-400"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
                    <Mail className="h-3.5 w-3.5" />
                  </div>
                  T.BulkMail
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1 px-2">
                {!user ? (
                  <>
                    {publicLinks.map((link) => (
                      <Button
                        key={link.page}
                        variant={currentPage === link.page ? 'secondary' : 'ghost'}
                        className="justify-start"
                        onClick={() => handleNav(link.page)}
                      >
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Button>
                    ))}
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleNav('login')}
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </Button>
                    <Button
                      className="justify-start bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleNav('register')}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-muted/50">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm dark:bg-emerald-900 dark:text-emerald-300">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Separator className="mb-2" />
                    {authLinks.map((link) => (
                      <Button
                        key={link.page}
                        variant={isActivePage(link.page) ? 'secondary' : 'ghost'}
                        className={`justify-start ${
                          isActivePage(link.page)
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : ''
                        }`}
                        onClick={() => handleNav(link.page)}
                      >
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Button>
                    ))}
                    {user.role === 'ADMIN' && (
                      <Button
                        variant={isActivePage('admin') ? 'secondary' : 'ghost'}
                        className={`justify-start ${
                          isActivePage('admin')
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : ''
                        }`}
                        onClick={() => handleNav('admin')}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Button>
                    )}
                    <Separator className="my-2" />
                    <Button
                      variant="ghost"
                      className="justify-start"
                      onClick={() => handleNav('profile')}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => {
                        logout();
                        handleNav('landing');
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
