'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Crown,
  Calendar,
  Pencil,
  Save,
  Lock,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  X,
  CreditCard,
  IndianRupee,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  isPremium: boolean;
  isBlocked: boolean;
  createdAt: string;
  _count: {
    campaigns: number;
    emailTemplates: number;
  };
}

interface PaymentRecord {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface ProfilePageProps {
  onPageChange: (page: string) => void;
}

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

export default function ProfilePage({ onPageChange }: ProfilePageProps) {
  const { user, refreshUser, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Payment
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPayments();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiGet('/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.user);
      setEditName(data.user.name);
      setEditEmail(data.user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await apiGet('/payments/history');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch {
      // Silently fail - payment history is optional
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiPut('/profile', {
        name: editName,
        email: editEmail,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setProfile(data.user);
      setEditing(false);
      setSuccess('Profile updated successfully');
      refreshUser();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSavingPassword(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiPut('/profile', {
        currentPassword,
        newPassword,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await apiDelete('/profile');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete account');
      }
      logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleBuyPlan = async (planKey: string) => {
    setPaymentLoading(true);
    setError('');

    try {
      const orderRes = await apiPost('/payments/create-order', { plan: planKey });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'T.BulkMail',
        description: `${planKey} Plan Subscription`,
        image: '/logo.svg',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.userName,
          email: orderData.userEmail,
        },
        theme: { color: '#10b981' },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await apiPost('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            setShowPaymentSuccess(true);
            refreshUser();
            fetchProfile();
            fetchPayments();
          } catch (verifyErr) {
            setError(
              verifyErr instanceof Error ? verifyErr.message : 'Payment verification failed'
            );
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentError('Payment was cancelled.');
          },
        },
      };

      if (typeof window !== 'undefined' && !(window as unknown as Record<string, boolean>).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          const rzp = new (window as unknown as Record<string, new (o: unknown) => { open: () => void }>).Razorpay(options);
          rzp.open();
        };
        document.body.appendChild(script);
      } else {
        const rzp = new (window as unknown as Record<string, new (o: unknown) => { open: () => void }>).Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Helper to avoid unused variable warning
  const setPaymentError = (msg: string) => setError(msg);

  const formatAmount = (amount: number) => {
    return `₹${(amount / 100).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-3xl mx-auto"
    >
      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">{success}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess('')}
            className="ml-auto text-emerald-500 hover:bg-emerald-100 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError('')}
            className="text-red-500 hover:bg-red-100"
          >
            Dismiss
          </Button>
        </motion.div>
      )}

      {/* Profile Info Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-200 p-4 rounded-full">
                  <User className="h-8 w-8 text-emerald-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">{profile?.name || user?.name}</h1>
                  <p className="text-emerald-700/70 text-sm">{profile?.email || user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={
                        profile?.isPremium
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                      }
                    >
                      {profile?.isPremium ? (
                        <>
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </>
                      ) : (
                        'Free Plan'
                      )}
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      <Shield className="h-3 w-3 mr-1" />
                      {profile?.role || user?.role}
                    </Badge>
                  </div>
                </div>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
          <CardContent className="p-6">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || !editName.trim() || !editEmail.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setEditName(profile?.name || '');
                      setEditEmail(profile?.email || '');
                    }}
                    className="border-emerald-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium">{profile?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{profile?.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium">
                      {profile?.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Stats & Upgrade */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Usage & Plan
            </CardTitle>
            <CardDescription>Your current plan and usage statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {profile?._count?.campaigns || 0}
                </p>
                <p className="text-xs text-emerald-600">Total Campaigns</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {profile?._count?.emailTemplates || 0}
                </p>
                <p className="text-xs text-emerald-600">Templates</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Plan</span>
                <Badge
                  className={
                    profile?.isPremium
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                  }
                >
                  {profile?.isPremium ? 'Premium' : 'Free'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Daily Campaign Limit</span>
                <span className="font-medium">{profile?.isPremium ? '50' : '3'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Emails/Campaign</span>
                <span className="font-medium">{profile?.isPremium ? '500' : '10'}</span>
              </div>
            </div>

            {!profile?.isPremium && (
              <div className="space-y-3 pt-2">
                <Separator />
                <p className="text-sm font-medium text-center">Upgrade to Premium</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card className="border-emerald-200 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all" onClick={() => handleBuyPlan('PRO')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-emerald-800">Pro Plan</p>
                          <p className="text-lg font-bold text-emerald-700">₹499<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        </div>
                        <Button
                          size="sm"
                          disabled={paymentLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Buy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">500 emails/campaign, 50 campaigns/day</p>
                    </CardContent>
                  </Card>
                  <Card className="border-teal-200 cursor-pointer hover:border-teal-400 hover:shadow-md transition-all" onClick={() => handleBuyPlan('ENTERPRISE')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-teal-800">Enterprise</p>
                          <p className="text-lg font-bold text-teal-700">₹999<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                        </div>
                        <Button
                          size="sm"
                          disabled={paymentLoading}
                          className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Buy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Unlimited emails, API access, SLA</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <IndianRupee className="h-3 w-3" />
                  Secure payment via Razorpay (UPI, Cards, Net Banking)
                </div>
              </div>
            )}

            {profile?.isPremium && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Premium Active</p>
                  <p className="text-xs text-emerald-600">You have access to all premium features.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment History */}
      {payments.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>Your recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        payment.status === 'PAID'
                          ? 'bg-emerald-50 dark:bg-emerald-950'
                          : payment.status === 'FAILED'
                          ? 'bg-red-50 dark:bg-red-950'
                          : 'bg-amber-50 dark:bg-amber-950'
                      }`}>
                        <IndianRupee className={`h-4 w-4 ${
                          payment.status === 'PAID'
                            ? 'text-emerald-600'
                            : payment.status === 'FAILED'
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{payment.plan} Plan</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatAmount(payment.amount)}</p>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          payment.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                            : payment.status === 'FAILED'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                        } border-0`}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Change Password */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-emerald-800 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </div>
              {!changingPassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangingPassword(true)}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Change
                </Button>
              )}
            </div>
          </CardHeader>
          {changingPassword && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    savingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {savingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Update Password
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="border-emerald-300"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-red-800">Delete Account</p>
                <p className="text-sm text-red-600/70">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account, all campaigns,
              templates, and associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-emerald-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deletingAccount && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Success Dialog */}
      <Dialog open={showPaymentSuccess} onOpenChange={setShowPaymentSuccess}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl">Payment Successful!</DialogTitle>
            <DialogDescription className="mt-2">
              Your account has been upgraded to Premium. Enjoy unlimited campaigns and advanced features!
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowPaymentSuccess(false)}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
