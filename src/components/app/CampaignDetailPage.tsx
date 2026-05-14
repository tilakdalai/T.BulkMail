'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Download,
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { apiGet, apiPost } from '@/lib/api';

interface EmailLog {
  id: string;
  receiver: string;
  receiverName: string;
  status: string;
  errorMessage: string;
  sentAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: string;
  sentCount: number;
  failedCount: number;
  totalCount: number;
  receivers: string;
  logoUrl: string;
  createdAt: string;
  scheduledAt: string | null;
  emailLogs?: EmailLog[];
}

interface CampaignDetailPageProps {
  onPageChange: (page: string) => void;
  campaignId: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
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

export default function CampaignDetailPage({ onPageChange, campaignId }: CampaignDetailPageProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiGet(`/campaigns/detail?id=${campaignId}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch campaign');
      }
      const data = await res.json();
      setCampaign(data.campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleResendFailed = async () => {
    if (!campaign) return;
    setResending(true);
    try {
      // For resend, we send the campaign again
      const res = await apiPost('/campaigns/send', { campaignId: campaign.id });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      fetchCampaign();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend campaign');
    } finally {
      setResending(false);
    }
  };

  const handleExportLogs = async () => {
    if (!campaign) return;
    setExporting(true);
    try {
      const res = await apiGet(`/campaigns/export?campaignId=${campaign.id}`);
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_${campaign.subject.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}_logs.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export logs');
    } finally {
      setExporting(false);
    }
  };

  const getParsedReceivers = (): Array<{ name: string; email: string }> => {
    if (!campaign?.receivers) return [];
    try {
      return JSON.parse(campaign.receivers);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium mb-2">Failed to load campaign</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={fetchCampaign}>
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange('campaigns')}
                className="text-emerald-600 border-emerald-300"
              >
                Back to Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) return null;

  const statusInfo = statusConfig[campaign.status] || statusConfig.DRAFT;
  const successRate =
    campaign.totalCount > 0
      ? Math.round((campaign.sentCount / campaign.totalCount) * 100)
      : 0;
  const receivers = getParsedReceivers();

  const statsCards = [
    {
      title: 'Total Recipients',
      value: campaign.totalCount,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Sent',
      value: campaign.sentCount,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Failed',
      value: campaign.failedCount,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onPageChange('campaigns')}
          className="text-emerald-600 hover:bg-emerald-50 self-start"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Campaigns
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-emerald-900">{campaign.subject}</h1>
                  <Badge variant={statusInfo.variant} className={statusInfo.className}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-emerald-700/70">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Created {new Date(campaign.createdAt).toLocaleString()}
                  </span>
                  {campaign.scheduledAt && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      Scheduled {new Date(campaign.scheduledAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 self-start">
                {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED') &&
                  campaign.failedCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleResendFailed}
                      disabled={resending}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2"
                    >
                      {resending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      Resend Failed
                    </Button>
                  )}
                {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED') && (
                  <Button
                    variant="outline"
                    onClick={handleExportLogs}
                    disabled={exporting}
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export Logs
                  </Button>
                )}
                {campaign.status === 'DRAFT' && (
                  <Button
                    onClick={handleResendFailed}
                    disabled={resending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {resending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Campaign
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={itemVariants}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`${stat.bg} p-2.5 rounded-xl`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Content + Receivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Content Preview - Realistic Email Client View */}
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200 h-full">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                {/* Email Client Header Bar */}
                <div className="border-b bg-gray-50 dark:bg-zinc-800 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white dark:bg-zinc-700 rounded-md px-3 py-1 text-xs text-muted-foreground text-center truncate">
                      {campaign.subject}
                    </div>
                  </div>
                </div>

                {/* Email Headers */}
                <div className="border-b px-4 py-3 space-y-1.5 text-xs bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium w-14 shrink-0">From:</span>
                    <span className="text-foreground">T.BulkMail &lt;noreply@tbulkmail.com&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium w-14 shrink-0">To:</span>
                    <span className="text-foreground truncate">{receivers[0]?.email || 'recipient@example.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-medium w-14 shrink-0">Subject:</span>
                    <span className="text-foreground font-semibold">{campaign.subject}</span>
                  </div>
                </div>

                {/* Email Body */}
                <div className="p-6 max-h-[400px] overflow-y-auto bg-white dark:bg-zinc-900">
                  {/* Logo */}
                  {campaign.logoUrl && (
                    <div className="mb-4 pb-4 border-b">
                      <img
                        src={campaign.logoUrl}
                        alt="Logo"
                        className="h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div
                    className="text-sm prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-emerald-600 dark:prose-a:text-emerald-400"
                    dangerouslySetInnerHTML={{
                      __html: campaign.content || '<p style="color: #999;">No email content</p>',
                    }}
                  />
                </div>

                {/* Email Footer */}
                <div className="border-t px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Sent via T.BulkMail &bull; <span className="text-emerald-600">Unsubscribe</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recipients List */}
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200 h-full">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Recipients ({receivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {receivers.length > 0 ? (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivers.map((r, i) => (
                        <TableRow key={i} className="hover:bg-emerald-50/50">
                          <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {r.name || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.email}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recipients data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Campaign Details Summary */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800 text-base">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Campaign ID</p>
                <p className="text-sm font-mono mt-1">{campaign.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={statusInfo.variant} className={`mt-1 ${statusInfo.className}`}>
                  {statusInfo.label}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm mt-1">{new Date(campaign.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Recipients</p>
                <p className="text-sm mt-1 font-medium">{campaign.totalCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
                <p className="text-sm mt-1 font-medium text-emerald-600">{campaign.sentCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Emails Failed</p>
                <p className="text-sm mt-1 font-medium text-red-500">{campaign.failedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Email Logs */}
      {campaign.emailLogs && campaign.emailLogs.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" />
                Email Logs ({campaign.emailLogs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Receiver</TableHead>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Error</TableHead>
                      <TableHead className="text-xs">Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.emailLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-emerald-50/50">
                        <TableCell className="text-sm">{log.receiver}</TableCell>
                        <TableCell className="text-sm">{log.receiverName || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === 'SENT' ? 'default' : 'destructive'}
                            className={`text-xs ${
                              log.status === 'SENT'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : ''
                            }`}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-red-500 max-w-[200px] truncate">
                          {log.errorMessage || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(log.sentAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
