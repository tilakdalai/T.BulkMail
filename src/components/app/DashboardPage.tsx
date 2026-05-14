'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  AlertCircle,
  Zap,
  Plus,
  List,
  FileText,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Campaign {
  id: string;
  subject: string;
  status: string;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  createdAt: string;
  scheduledAt: string | null;
}

interface DashboardPageProps {
  onPageChange: (page: string) => void;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  DRAFT: { label: 'Draft', variant: 'secondary', className: 'bg-gray-100 text-gray-700 hover:bg-gray-100' },
  SENDING: { label: 'Sending', variant: 'outline', className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' },
  COMPLETED: { label: 'Completed', variant: 'default', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  FAILED: { label: 'Failed', variant: 'destructive', className: 'bg-red-100 text-red-700 hover:bg-red-100' },
  SCHEDULED: { label: 'Scheduled', variant: 'outline', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage({ onPageChange }: DashboardPageProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiGet('/campaigns?limit=100');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const totalCampaigns = campaigns.length;
  const emailsSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
  const emailsFailed = campaigns.reduce((acc, c) => acc + c.failedCount, 0);
  const activeCampaigns = campaigns.filter(
    (c) => c.status === 'SENDING' || c.status === 'SCHEDULED'
  ).length;

  const recentCampaigns = campaigns.slice(0, 5);

  const chartData = recentCampaigns.map((c) => ({
    name: c.subject.length > 15 ? c.subject.substring(0, 15) + '...' : c.subject,
    Sent: c.sentCount,
    Failed: c.failedCount,
  }));

  const maxDailyCampaigns = user?.isPremium ? 50 : 3;
  const todayCampaigns = campaigns.filter((c) => {
    const created = new Date(c.createdAt);
    const today = new Date();
    return (
      created.getFullYear() === today.getFullYear() &&
      created.getMonth() === today.getMonth() &&
      created.getDate() === today.getDate()
    );
  }).length;

  const dailyCampaignPercent = Math.min(
    Math.round((todayCampaigns / maxDailyCampaigns) * 100),
    100
  );

  const statsCards = [
    {
      title: 'Total Campaigns',
      value: totalCampaigns,
      icon: Mail,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      title: 'Emails Sent',
      value: emailsSent,
      icon: Send,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    {
      title: 'Emails Failed',
      value: emailsFailed,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    {
      title: 'Active Campaigns',
      value: activeCampaigns,
      icon: Zap,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Failed to load dashboard</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={fetchCampaigns}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-emerald-900">
                  Welcome back, {user?.name || 'User'} 👋
                </h1>
                <p className="text-emerald-700/70 mt-1">
                  Here&apos;s an overview of your email campaigns.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => onPageChange('create-campaign')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className={`${stat.border} hover:shadow-md transition-shadow`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`${stat.bg} p-3 rounded-xl`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Chart + Usage Limits Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <TrendingUp className="h-5 w-5" />
                Recent Campaign Performance
              </CardTitle>
              <CardDescription>Sent vs Failed emails for your latest campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Sent" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                  No campaign data to display
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Usage Limits */}
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200 h-full">
            <CardHeader>
              <CardTitle className="text-emerald-800">Usage Limits</CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Zap className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {user?.isPremium ? 'Premium' : 'Free'} Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.isPremium ? '50 campaigns/day • 500 emails/campaign' : '3 campaigns/day • 10 emails/campaign'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Campaigns</span>
                  <span className="font-medium">
                    {todayCampaigns} / {maxDailyCampaigns}
                  </span>
                </div>
                <Progress value={dailyCampaignPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {maxDailyCampaigns - todayCampaigns} campaigns remaining today
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Emails/Campaign</span>
                  <span className="font-medium">
                    {user?.isPremium ? 500 : 10}
                  </span>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              {!user?.isPremium && (
                <Button
                  variant="outline"
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2"
                  onClick={() => onPageChange('pricing')}
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to Premium
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Campaigns Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-emerald-800">Recent Campaigns</CardTitle>
                <CardDescription>Your last 5 campaigns</CardDescription>
              </div>
              <Button
                variant="ghost"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                onClick={() => onPageChange('campaigns')}
              >
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCampaigns.map((campaign) => {
                      const statusInfo = statusConfig[campaign.status] || statusConfig.DRAFT;
                      return (
                        <TableRow key={campaign.id} className="cursor-pointer hover:bg-emerald-50/50" onClick={() => {
                          onPageChange('campaign-detail');
                        }}>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {campaign.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className={statusInfo.className}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">
                            {campaign.sentCount}
                          </TableCell>
                          <TableCell className="text-center text-red-500 font-medium">
                            {campaign.failedCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">No campaigns yet</p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  Create your first campaign to get started
                </p>
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => onPageChange('create-campaign')}
                >
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onPageChange('create-campaign')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-xl group-hover:bg-emerald-200 transition-colors">
                <Plus className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">Create Campaign</p>
                <p className="text-sm text-muted-foreground">Start a new email campaign</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onPageChange('campaigns')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                <List className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">View All Campaigns</p>
                <p className="text-sm text-muted-foreground">Browse campaign history</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-emerald-200 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onPageChange('templates')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="bg-teal-100 p-3 rounded-xl group-hover:bg-teal-200 transition-colors">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800">My Templates</p>
                <p className="text-sm text-muted-foreground">Manage email templates</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
