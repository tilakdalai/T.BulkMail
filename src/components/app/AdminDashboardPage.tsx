'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiGet, apiPut } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Mail,
  Send,
  Crown,
  Shield,
  UserCog,
  FolderOpen,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface AdminDashboardPageProps {
  onPageChange: (page: string) => void;
}

interface UpgradeRequest {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface DashboardStats {
  totalUsers: number;
  totalCampaigns: number;
  totalEmailsSent: number;
  premiumUsersCount: number;
  pendingUpgradeRequests: number;
  campaignStatsByStatus: Record<string, number>;
  recentCampaigns: Array<{
    id: string;
    subject: string;
    status: string;
    sentCount: number;
    failedCount: number;
    totalCount: number;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SENDING: '#f59e0b',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  SCHEDULED: '#3b82f6',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  SENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

export default function AdminDashboardPage({ onPageChange }: AdminDashboardPageProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, upgradeRes] = await Promise.all([
        apiGet('/admin/dashboard'),
        apiGet('/admin/upgrade-requests'),
      ]);

      if (!dashboardRes.ok) throw new Error('Failed to fetch dashboard data');

      const dashboardData = await dashboardRes.json();
      setStats(dashboardData.stats || dashboardData);

      if (upgradeRes.ok) {
        const upgradeData = await upgradeRes.json();
        setUpgradeRequests(upgradeData.requests || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user, fetchData]);

  const handleUpgradeAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(requestId + action);
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const res = await apiPut('/admin/upgrade-requests', { requestId, status });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} request`);
      }
      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mt-1">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Total Campaigns',
      value: stats?.totalCampaigns ?? 0,
      icon: Mail,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'Emails Sent',
      value: stats?.totalEmailsSent ?? 0,
      icon: Send,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Premium Users',
      value: stats?.premiumUsersCount ?? 0,
      icon: Crown,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ];

  const chartData = Object.entries(stats?.campaignStatsByStatus || {}).map(([status, count]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    count,
    color: STATUS_COLORS[status] || '#94a3b8',
  })).filter(item => item.count > 0);

  const pendingRequests = upgradeRequests.filter((r) => r.status === 'PENDING');

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 sm:p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your T.BulkMail platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange('admin-users')}
            className="hidden sm:flex"
          >
            <UserCog className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange('admin-campaigns')}
            className="hidden sm:flex"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            All Campaigns
          </Button>
        </div>
      </motion.div>

      {/* Quick Links (mobile) */}
      <motion.div variants={itemVariants} className="flex gap-2 sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange('admin-users')}
          className="flex-1"
        >
          <UserCog className="h-4 w-4 mr-2" />
          Users
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange('admin-campaigns')}
          className="flex-1"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Campaigns
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div key={card.title} variants={itemVariants} custom={index}>
            <Card className={`border ${card.borderColor} hover:shadow-md transition-shadow`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">Live data</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart + Upgrade Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Campaigns by Status</CardTitle>
              <CardDescription>Distribution of all campaigns across statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid hsl(var(--border))',
                        backgroundColor: 'hsl(var(--popover))',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No campaign data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upgrade Requests */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upgrade Requests</CardTitle>
                  <CardDescription>Pending premium upgrade requests</CardDescription>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">
                  {pendingRequests.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="max-h-[340px] overflow-y-auto">
                {upgradeRequests.length > 0 ? (
                  <div className="space-y-0">
                    {upgradeRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-medium truncate">{request.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {request.user?.email || 'No email'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(request.createdAt)}
                          </p>
                        </div>
                        {request.status === 'PENDING' ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => handleUpgradeAction(request.id, 'approve')}
                              disabled={!!actionLoading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => handleUpgradeAction(request.id, 'reject')}
                              disabled={!!actionLoading}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] shrink-0 ${
                              request.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            } border-0`}
                          >
                            {request.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No upgrade requests</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Campaigns Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Campaigns</CardTitle>
                <CardDescription>Latest campaigns across all users</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange('admin-campaigns')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Subject</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Sent</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="pr-6 text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentCampaigns && stats.recentCampaigns.length > 0 ? (
                    stats.recentCampaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="hover:bg-muted/50">
                        <TableCell className="pl-6 font-medium max-w-[200px] truncate">
                          {campaign.subject}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaign.user?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-0 text-[10px] ${
                              STATUS_BADGE_CLASSES[campaign.status] || ''
                            }`}
                          >
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {campaign.sentCount?.toLocaleString() ?? 0}
                        </TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400">
                          {campaign.failedCount?.toLocaleString() ?? 0}
                        </TableCell>
                        <TableCell className="pr-6 text-right text-muted-foreground text-xs">
                          {formatDate(campaign.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
