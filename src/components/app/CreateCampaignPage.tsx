'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Save,
  Upload,
  FileText,
  Plus,
  X,
  Mail,
  Eye,
  Clock,
  Image as ImageIcon,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { apiGet, apiPost, apiUpload } from '@/lib/api';

interface CreateCampaignPageProps {
  onPageChange: (page: string) => void;
  campaignId?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
}

interface Receiver {
  name: string;
  email: string;
}

const steps = [
  { id: 1, title: 'Email Details', icon: Mail },
  { id: 2, title: 'Recipients', icon: Send },
  { id: 3, title: 'Options', icon: Paperclip },
  { id: 4, title: 'Review & Send', icon: CheckCircle2 },
];

export default function CreateCampaignPage({ onPageChange }: CreateCampaignPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Email Details
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);

  // Step 2: Recipients
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [pasteEmails, setPasteEmails] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Options
  const [logoUrl, setLogoUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await apiGet('/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch {
      // silently fail
    }
  };

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setSelectedTemplateId(templateId);
        setSubject(template.subject);
        setContent(template.content);
      }
    },
    [templates]
  );

  // CSV Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiUpload('/campaigns/upload', formData);
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      setReceivers(data.receivers || []);
    } catch {
      setUploadError('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Parse pasted emails
  const handleParsePasteEmails = () => {
    if (!pasteEmails.trim()) return;
    const lines = pasteEmails.trim().split('\n');
    const parsed: Receiver[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Try to parse "Name <email>" or just "email"
      const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        parsed.push({ name: match[1].trim(), email: match[2].trim() });
      } else if (trimmed.includes('@')) {
        const parts = trimmed.split(/[,\t]/);
        if (parts.length >= 2) {
          const emailPart = parts.find((p) => p.trim().includes('@'));
          const namePart = parts.find((p) => !p.trim().includes('@'));
          if (emailPart) {
            parsed.push({ name: namePart?.trim() || '', email: emailPart.trim() });
          }
        } else {
          parsed.push({ name: '', email: trimmed });
        }
      }
    }
    setReceivers((prev) => [...prev, ...parsed]);
    setPasteEmails('');
  };

  // Manual add
  const handleManualAdd = () => {
    if (!manualEmail.trim()) return;
    setReceivers((prev) => [...prev, { name: manualName.trim(), email: manualEmail.trim() }]);
    setManualName('');
    setManualEmail('');
  };

  const removeReceiver = (index: number) => {
    setReceivers((prev) => prev.filter((_, i) => i !== index));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const invalidEmails = receivers.filter((r) => !validateEmail(r.email));

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return subject.trim() && content.trim();
      case 2:
        return receivers.length > 0 && invalidEmails.length === 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiPost('/campaigns', {
        subject,
        content,
        receivers,
        attachments: [],
        logoUrl,
        scheduledAt: scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save draft');
      onPageChange('campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      // First create the campaign
      const createRes = await apiPost('/campaigns', {
        subject,
        content,
        receivers,
        attachments: attachmentFile ? [{ filename: attachmentName }] : [],
        logoUrl,
        scheduledAt: scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : null,
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create campaign');

      // Then send it
      const sendRes = await apiPost('/campaigns/send', {
        campaignId: createData.campaign.id,
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || 'Failed to send campaign');

      onPageChange('campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const getPreviewContent = () => {
    let previewContent = content;
    let previewSubject = subject;
    const sampleReceiver = receivers[0] || { name: 'John Doe', email: 'john@example.com' };
    previewContent = previewContent.replace(/\{name\}/g, sampleReceiver.name || 'Recipient');
    previewSubject = previewSubject.replace(/\{name\}/g, sampleReceiver.name || 'Recipient');
    return { previewContent, previewSubject };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange('dashboard')}
          className="text-emerald-600 hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Create Campaign</h1>
          <p className="text-muted-foreground text-sm">Set up your email campaign in 4 easy steps</p>
        </div>
      </div>

      {/* Step Progress Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full ${
                currentStep === step.id
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : currentStep > step.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              ) : (
                <step.icon className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="hidden sm:inline truncate">{step.title}</span>
              <span className="sm:hidden">{step.id}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-4 mx-1 flex-shrink-0 ${
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {/* Step 1: Email Details */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Details
                    </CardTitle>
                    <CardDescription>Set the subject and content for your email</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {templates.length > 0 && (
                      <div className="space-y-2">
                        <Label>Use a Template</Label>
                        <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="subject">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subject"
                        placeholder="Enter email subject... (use {name} for personalization)"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use <code className="bg-emerald-50 px-1 rounded">{'{name}'}</code> to personalize with recipient name
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">
                        Email Content <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="content"
                        placeholder="Write your email content here... HTML is supported. Use {name} for personalization."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[300px] border-emerald-200 focus:border-emerald-500 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        HTML supported • Use <code className="bg-emerald-50 px-1 rounded">{'{name}'}</code> for recipient name
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Recipients */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Recipients
                    </CardTitle>
                    <CardDescription>Add recipients via CSV, paste, or manual entry</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* CSV Upload */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Upload CSV File</Label>
                      <div
                        className="border-2 border-dashed border-emerald-300 rounded-lg p-8 text-center hover:bg-emerald-50/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                        <p className="text-sm font-medium text-emerald-700">
                          {uploading ? 'Uploading...' : 'Click to upload or drag & drop'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          CSV files only (max 5MB) • Columns: name, email
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                      {uploadError && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {uploadError}
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Paste Emails */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Paste Emails</Label>
                      <Textarea
                        placeholder="Paste emails here, one per line...&#10;Formats: email@domain.com or Name &lt;email@domain.com&gt;"
                        value={pasteEmails}
                        onChange={(e) => setPasteEmails(e.target.value)}
                        className="min-h-[100px] border-emerald-200 focus:border-emerald-500 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleParsePasteEmails}
                        disabled={!pasteEmails.trim()}
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      >
                        Add Pasted Emails
                      </Button>
                    </div>

                    <Separator />

                    {/* Manual Entry */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Manual Entry</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Name"
                          value={manualName}
                          onChange={(e) => setManualName(e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                        />
                        <Input
                          placeholder="Email"
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleManualAdd}
                          disabled={!manualEmail.trim()}
                          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex-shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Receivers List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Recipients ({receivers.length})
                        </Label>
                        {receivers.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReceivers([])}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      {receivers.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                          {receivers.map((r, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between px-3 py-2 hover:bg-emerald-50/50"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs text-muted-foreground w-6">
                                  {i + 1}.
                                </span>
                                <span className="text-sm font-medium truncate">
                                  {r.name || '—'}
                                </span>
                                <span className="text-sm text-muted-foreground truncate">
                                  {r.email}
                                </span>
                                {!validateEmail(r.email) && (
                                  <Badge variant="destructive" className="text-xs px-1 py-0">
                                    Invalid
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                onClick={() => removeReceiver(i)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
                          No recipients added yet
                        </div>
                      )}
                      {invalidEmails.length > 0 && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {invalidEmails.length} invalid email(s) found. Please fix before
                          continuing.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Options */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <Paperclip className="h-5 w-5" />
                      Campaign Options
                    </CardTitle>
                    <CardDescription>Customize additional settings for your campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo URL */}
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl" className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-emerald-600" />
                        Logo URL
                      </Label>
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="border-emerald-200 focus:border-emerald-500"
                      />
                      <p className="text-xs text-muted-foreground">
                        Logo will be displayed at the top of your email
                      </p>
                    </div>

                    {/* Attachment */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-emerald-600" />
                        Attachment
                      </Label>
                      {attachmentFile ? (
                        <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-lg">
                          <FileText className="h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-medium flex-1">{attachmentName}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                            onClick={() => {
                              setAttachmentFile(null);
                              setAttachmentName('');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 h-20"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                setAttachmentFile(file);
                                setAttachmentName(file.name);
                              }
                            };
                            input.click();
                          }}
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Click to add attachment
                        </Button>
                      )}
                    </div>

                    {/* Schedule */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        Schedule (Optional)
                      </Label>
                      <div className="flex gap-3">
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                        />
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="border-emerald-200 focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to send immediately
                      </p>
                    </div>

                    {/* Preview Toggle */}
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium">Email Preview Panel</span>
                      </div>
                      <Button
                        variant={showPreview ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className={
                          showPreview
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'border-emerald-300 text-emerald-600'
                        }
                      >
                        {showPreview ? 'Visible' : 'Hidden'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Review & Send */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-emerald-200">
                  <CardHeader>
                    <CardTitle className="text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Review & Send
                    </CardTitle>
                    <CardDescription>Review your campaign before sending</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Subject */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Subject</p>
                      <p className="font-medium text-emerald-800">{subject || '—'}</p>
                    </div>

                    <Separator />

                    {/* Recipients Count */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          {receivers.length} recipient{receivers.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    {/* Logo */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Logo URL</p>
                      <p className="text-sm">{logoUrl || 'None'}</p>
                    </div>

                    {/* Attachment */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Attachment</p>
                      <p className="text-sm">{attachmentName || 'None'}</p>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Schedule</p>
                      <p className="text-sm">
                        {scheduledDate && scheduledTime
                          ? `${scheduledDate} at ${scheduledTime}`
                          : 'Send immediately'}
                      </p>
                    </div>

                    <Separator />

                    {/* Content Preview */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Content Preview</p>
                      <div
                        className="border rounded-lg p-4 bg-white max-h-64 overflow-y-auto text-sm"
                        dangerouslySetInnerHTML={{
                          __html: getPreviewContent().previewContent || '<em>No content</em>',
                        }}
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {currentStep === 4 && (
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={loading || sending}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Draft
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={sending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {sending ? 'Sending...' : 'Send Campaign'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel - Realistic Email Client */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="border-emerald-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  Email Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 px-4 pb-4">
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
                        {getPreviewContent().previewSubject || 'Email Subject'}
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
                      <span className="text-foreground font-semibold">{getPreviewContent().previewSubject || 'Email Subject'}</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-white dark:bg-zinc-900">
                    {logoUrl && (
                      <div className="mb-4 pb-4 border-b">
                        <img
                          src={logoUrl}
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
                        __html:
                          getPreviewContent().previewContent ||
                          '<p style="color: #999;">Email content will appear here...</p>',
                      }}
                    />
                  </div>

                  {/* Email Footer */}
                  <div className="border-t px-4 py-2 bg-gray-50 dark:bg-zinc-800 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      Sent via T.BulkMail &bull; <span className="text-emerald-600">Unsubscribe</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
