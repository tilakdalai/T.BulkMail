'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Mail,
  Send,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiGet, apiPost } from '@/lib/api';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CampaignsPageProps {
  onPageChange: (page: string) => void;
  onSelectCampaign: (id: string) => void;
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
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function CampaignsPage({ onPageChange, onSelectCampaign }: CampaignsPageProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(
    async (page = 1, searchTerm = '') => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(searchTerm ? { search: searchTerm } : {}),
        });
        const res = await apiGet(`/campaigns?${params}`);
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCampaigns(1, search);
  }, [fetchCampaigns, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchCampaigns(newPage, search);
    }
  };

  const handleSendDraft = async (campaignId: string) => {
    setSendingId(campaignId);
    try {
      const res = await apiPost('/campaigns/send', { campaignId });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign');
      fetchCampaigns(pagination.page, search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send campaign');
    } finally {
      setSendingId(null);
    }
  };

  const handleExportLogs = async (campaignId: string) => {
    try {
      const res = await apiGet(`/campaigns/export?campaignId=${campaignId}`);
      if (!res.ok) throw new Error('Failed to export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign_logs.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export logs');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Campaigns</h1>
          <p className="text-muted-foreground text-sm">View and manage all your email campaigns</p>
        </div>
        <Button
          onClick={() => onPageChange('create-campaign')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 self-start"
        >
          <Send className="h-4 w-4" />
          New Campaign
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns by subject..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 border-emerald-200 focus:border-emerald-500"
          />
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={itemVariants}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError('')} className="text-red-500 hover:bg-red-100">
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading campaigns...</p>
                </div>
              </div>
            ) : campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Recipients</TableHead>
                      <TableHead className="text-center">Sent</TableHead>
                      <TableHead className="text-center">Failed</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const statusInfo = statusConfig[campaign.status] || statusConfig.DRAFT;
                      return (
                        <TableRow
                          key={campaign.id}
                          className="hover:bg-emerald-50/50 cursor-pointer"
                          onClick={() => onSelectCampaign(campaign.id)}
                        >
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {campaign.subject}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant} className={statusInfo.className}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{campaign.totalCount}</TableCell>
                          <TableCell className="text-center text-emerald-600 font-medium">
                            {campaign.sentCount}
                          </TableCell>
                          <TableCell className="text-center text-red-500 font-medium">
                            {campaign.failedCount}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectCampaign(campaign.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {campaign.status === 'DRAFT' && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendDraft(campaign.id);
                                    }}
                                    disabled={sendingId === campaign.id}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    {sendingId === campaign.id ? 'Sending...' : 'Send Now'}
                                  </DropdownMenuItem>
                                )}
                                {(campaign.status === 'COMPLETED' || campaign.status === 'FAILED') && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportLogs(campaign.id);
                                    }}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Logs
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium text-lg">
                  {search ? 'No campaigns found' : 'No campaigns yet'}
                </p>
                <p className="text-muted-foreground/70 text-sm mt-1 max-w-sm">
                  {search
                    ? 'Try adjusting your search terms'
                    : 'Create your first email campaign to get started'}
                </p>
                {!search && (
                  <Button
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => onPageChange('create-campaign')}
                  >
                    <Send className="h-4 w-4" />
                    Create Campaign
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              campaigns
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    const current = pagination.page;
                    return page === 1 || page === pagination.totalPages || Math.abs(page - current) <= 1;
                  })
                  .map((page, index, arr) => {
                    const showEllipsis = index > 0 && page - arr[index - 1] > 1;
                    return (
                      <span key={page} className="flex items-center">
                        {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                        <Button
                          variant={page === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          className={
                            page === pagination.page
                              ? 'bg-emerald-600 hover:bg-emerald-700 h-8 w-8 p-0'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8 w-8 p-0'
                          }
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </span>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Refresh */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchCampaigns(pagination.page, search)}
          className="text-emerald-600 hover:bg-emerald-50 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </motion.div>
    </motion.div>
  );
}
