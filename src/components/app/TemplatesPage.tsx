'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplatesPageProps {
  onPageChange: (page: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function TemplatesPage({ onPageChange }: TemplatesPageProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiGet('/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateSubject('');
    setTemplateContent('');
    setDialogOpen(true);
  };

  const openEditDialog = (template: Template) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateContent(template.content);
    setDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateSubject.trim() || !templateContent.trim()) return;

    setSaving(true);
    setError('');
    try {
      if (editingTemplate) {
        // Update
        const res = await apiPut('/templates', {
          id: editingTemplate.id,
          name: templateName,
          subject: templateSubject,
          content: templateContent,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update template');
      } else {
        // Create
        const res = await apiPost('/templates', {
          name: templateName,
          subject: templateSubject,
          content: templateContent,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create template');
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingTemplate) return;
    setDeleting(true);
    try {
      const res = await apiDelete('/templates', { id: deletingTemplate.id });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete template');
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const truncateContent = (content: string, maxLength = 120) => {
    const stripped = content.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Email Templates</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage reusable email templates
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 self-start"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 border-emerald-200 focus:border-emerald-500"
          />
        </div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div variants={itemVariants}>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError('')}
              className="text-red-500 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </div>
        </motion.div>
      )}

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading templates...</p>
          </div>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="border-emerald-200 hover:shadow-md transition-all group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => openEditDialog(template)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setDeletingTemplate(template);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {template.subject}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {truncateContent(template.content)}
                  </p>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 text-xs"
                    >
                      Template
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Updated {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-emerald-200">
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium text-lg">
                {search ? 'No templates found' : 'No templates yet'}
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1 max-w-sm mx-auto">
                {search
                  ? 'Try adjusting your search terms'
                  : 'Create your first email template to save time when sending campaigns'}
              </p>
              {!search && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={openCreateDialog}
                >
                  <Plus className="h-4 w-4" />
                  Create Template
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-800">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="e.g. Welcome Email, Newsletter"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="template-subject"
                placeholder="Email subject line... (use {name} for personalization)"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                className="border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">
                Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="template-content"
                placeholder="Write your email template content here... HTML is supported."
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="min-h-[250px] border-emerald-200 focus:border-emerald-500 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                HTML supported • Use <code className="bg-emerald-50 px-1 rounded">{'{name}'}</code>{' '}
                for recipient name personalization
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-emerald-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={
                saving || !templateName.trim() || !templateSubject.trim() || !templateContent.trim()
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deletingTemplate?.name}&rdquo;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
