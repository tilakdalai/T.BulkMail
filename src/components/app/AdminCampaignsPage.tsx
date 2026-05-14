'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen,
  XCircle,
  Eye,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface AdminCampaignsPageProps {
  onPageChange: (page: string) => void;
}

interface CampaignData {
  id: string;
  subject: string;
  userName: string;
  userEmail: string;
  status: string;
  sentCount: number;
  failedCount: number;
  recipientCount: number;
  createdAt: string;
  body?: string;
}

interface CampaignsResponse {
  campaigns: CampaignData[];
  total: number;
  page: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  QUEUED: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  SENDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  SENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
};

export default function AdminCampaignsPage({ onPageChange: _onPageChange }: AdminCampaignsPageProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchCampaigns = useCallback(
    async (page = 1, searchTerm = '', status = 'ALL') => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(searchTerm ? { search: searchTerm } : {}),
          ...(status !== 'ALL' ? { status } : {}),
        });
        const res = await apiGet(`/admin/campaigns?${params}`);
        if (!res.ok) throw new Error('Failed to fetch campaigns');
        const data: CampaignsResponse = await res.json();
        setCampaigns(data.campaigns);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setCurrentPage(data.page);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchCampaigns(1, search, statusFilter);
    }
  }, [user, fetchCampaigns, search, statusFilter]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCampaigns(page, search, statusFilter);
  };

  const handleViewDetails = (campaign: CampaignData) => {
    setSelectedCampaign(campaign);
    setDetailOpen(true);
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground mt-1">You need admin privileges to view this page.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SENT':
        return <Send className="h-3 w-3" />;
      case 'FAILED':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
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
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="h-7 w-7 text-emerald-600" />
            All Campaigns
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} campaign{total !== 1 ? 's' : ''} across all users
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchCampaigns(currentPage, search, statusFilter)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns by subject or user..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleSearchChange('')}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="SENDING">Sending</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCampaigns(currentPage, search, statusFilter)}
                className="ml-auto"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {loading && !campaigns.length ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24 ml-auto" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="hidden md:table-cell text-right">Recipients</TableHead>
                      <TableHead className="hidden sm:table-cell">Created</TableHead>
                      <TableHead className="pr-6 text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.length > 0 ? (
                      campaigns.map((campaign) => (
                        <TableRow key={campaign.id} className="group">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="font-medium truncate max-w-[200px]">
                                {campaign.subject}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="text-sm truncate max-w-[120px]">{campaign.userName}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {campaign.userEmail}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`border-0 text-[10px] flex items-center gap-1 w-fit ${
                                STATUS_BADGE_CLASSES[campaign.status] || ''
                              }`}
                            >
                              {getStatusIcon(campaign.status)}
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {campaign.sentCount?.toLocaleString() ?? 0}
                          </TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">
                            {campaign.failedCount?.toLocaleString() ?? 0}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-right text-muted-foreground">
                            {campaign.recipientCount?.toLocaleString() ?? '-'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                            {formatDate(campaign.createdAt)}
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleViewDetails(campaign)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-32 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Mail className="h-8 w-8 opacity-50" />
                            <p>No campaigns found</p>
                            {(search || statusFilter !== 'ALL') && (
                              <div className="flex gap-2">
                                {search && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleSearchChange('')}
                                  >
                                    Clear search
                                  </Button>
                                )}
                                {statusFilter !== 'ALL' && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleStatusFilterChange('ALL')}
                                  >
                                    Clear filter
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} &middot; {total} total campaigns
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className={`w-8 h-8 p-0 ${
                      pageNum === currentPage
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : ''
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Campaign Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              Campaign Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this campaign
            </DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Subject</p>
                  <p className="text-sm font-medium mt-0.5">{selectedCampaign.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <Badge
                    className={`border-0 text-xs mt-0.5 ${
                      STATUS_BADGE_CLASSES[selectedCampaign.status] || ''
                    }`}
                  >
                    {selectedCampaign.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">User</p>
                  <p className="text-sm font-medium mt-0.5">{selectedCampaign.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedCampaign.userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Created</p>
                  <p className="text-sm mt-0.5">{formatDate(selectedCampaign.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedCampaign.sentCount?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Sent</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {selectedCampaign.failedCount?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Failed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-950">
                  <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                    {selectedCampaign.recipientCount?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Recipients</p>
                </div>
              </div>

              {selectedCampaign.body && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Email Body Preview
                  </p>
                  <div className="text-sm bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                    {selectedCampaign.body}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
