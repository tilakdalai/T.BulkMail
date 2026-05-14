'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Mail,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Upload,
  FileText,
  Headphones,
  Code2,
  Star,
  CreditCard,
  Loader2,
  CheckCircle2,
  IndianRupee,
  Heart,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiPost } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface PricingPageProps {
  onPageChange: (page: string) => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const plans = [
  {
    name: 'Free',
    icon: Zap,
    price: '₹0',
    priceUsd: '$0',
    period: '/mo',
    description: 'Perfect for trying out T.BulkMail and personal projects.',
    features: [
      { label: '10 emails per campaign', included: true },
      { label: '3 campaigns per day', included: true },
      { label: '1 email template', included: true },
      { label: 'Basic campaign tracking', included: true },
      { label: 'Community support', included: true },
      { label: 'CSV import', included: false },
      { label: 'Email scheduling', included: false },
      { label: 'API access', included: false },
      { label: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaPage: 'register',
    popular: false,
    gradient: 'from-emerald-400 to-green-500',
    planKey: '',
    amount: 0,
  },
  {
    name: 'Pro',
    icon: Star,
    price: '₹499',
    priceUsd: '$9',
    period: '/mo',
    description: 'For growing businesses that need more power and flexibility.',
    features: [
      { label: '500 emails per campaign', included: true },
      { label: '50 campaigns per day', included: true },
      { label: 'Unlimited email templates', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
      { label: 'CSV import & export', included: true },
      { label: 'Email scheduling', included: true },
      { label: 'API access', included: false },
      { label: 'Custom integrations', included: false },
    ],
    cta: 'Buy Pro Plan',
    ctaPage: 'register',
    popular: true,
    gradient: 'from-emerald-500 to-green-600',
    planKey: 'PRO',
    amount: 49900,
  },
  {
    name: 'Enterprise',
    icon: Shield,
    price: '₹999',
    priceUsd: '$19',
    period: '/mo',
    description: 'For large organizations with custom requirements and SLAs.',
    features: [
      { label: 'Unlimited emails per campaign', included: true },
      { label: 'Unlimited campaigns', included: true },
      { label: 'Unlimited email templates', included: true },
      { label: 'Real-time analytics dashboard', included: true },
      { label: '24/7 dedicated support', included: true },
      { label: 'CSV import & export', included: true },
      { label: 'Advanced scheduling', included: true },
      { label: 'Full API access', included: true },
      { label: 'Custom integrations & SLA', included: true },
    ],
    cta: 'Buy Enterprise',
    ctaPage: 'pricing',
    popular: false,
    gradient: 'from-teal-500 to-emerald-600',
    planKey: 'ENTERPRISE',
    amount: 99900,
  },
];

const comparisonFeatures = [
  { category: 'Sending', items: [
    { label: 'Emails per campaign', free: '10', pro: '500', enterprise: 'Unlimited' },
    { label: 'Campaigns per day', free: '3', pro: '50', enterprise: 'Unlimited' },
    { label: 'Email scheduling', free: false, pro: true, enterprise: true },
  ]},
  { category: 'Templates & Content', items: [
    { label: 'Email templates', free: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
    { label: 'CSV import', free: false, pro: true, enterprise: true },
    { label: 'Template variables', free: false, pro: true, enterprise: true },
  ]},
  { category: 'Analytics & Tracking', items: [
    { label: 'Open tracking', free: true, pro: true, enterprise: true },
    { label: 'Click tracking', free: true, pro: true, enterprise: true },
    { label: 'Bounce tracking', free: false, pro: true, enterprise: true },
    { label: 'Advanced analytics', free: false, pro: true, enterprise: true },
  ]},
  { category: 'Support & Integration', items: [
    { label: 'Community support', free: true, pro: true, enterprise: true },
    { label: 'Priority support', free: false, pro: true, enterprise: true },
    { label: 'API access', free: false, pro: false, enterprise: true },
    { label: 'Custom integrations', free: false, pro: false, enterprise: true },
  ]},
];

function renderCellValue(value: boolean | string) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  }
  return <X className="mx-auto h-4 w-4 text-muted-foreground/40" />;
}

export default function PricingPage({ onPageChange }: PricingPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const handleBuyPlan = async (planKey: string, amount: number) => {
    if (!user) {
      onPageChange('login');
      return;
    }

    if (user.isPremium) {
      setPaymentError('You already have a Premium plan!');
      return;
    }

    if (amount === 0) {
      onPageChange('register');
      return;
    }

    setLoading(true);
    setPaymentError('');

    try {
      // Step 1: Create Razorpay order via our API
      const orderRes = await apiPost('/payments/create-order', { plan: planKey });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Step 2: Open Razorpay checkout
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
        theme: {
          color: '#10b981',
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          // Step 3: Verify payment on our server
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

            setPaymentSuccess(true);
            setShowSuccessDialog(true);
          } catch (verifyErr) {
            setPaymentError(
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

      // Dynamically load Razorpay script
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
      setPaymentError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button onClick={() => onPageChange('landing')} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">T.<span className="text-emerald-600">BulkMail</span></span>
          </button>
          <div className="flex items-center gap-4">
            <button onClick={() => onPageChange('login')} className="text-sm text-muted-foreground hover:text-foreground">
              Sign In
            </button>
            <Button onClick={() => onPageChange('register')} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-emerald-50/50 to-transparent pb-16 pt-16 dark:from-emerald-950/20 dark:to-transparent">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-400/15 to-green-600/15 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-6 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Simple, transparent pricing
              </Badge>
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
            >
              Choose the plan that{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                scales with you
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
            >
              Start free and upgrade as your email needs grow. Secure payments powered by Razorpay.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Payment Error */}
      {paymentError && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <X className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{paymentError}</p>
            <Button variant="ghost" size="sm" className="ml-auto text-red-500" onClick={() => setPaymentError('')}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={fadeInUp} transition={{ duration: 0.5 }}>
                <Card
                  className={`relative h-full overflow-hidden transition-all duration-300 ${
                    plan.popular
                      ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 dark:border-emerald-400'
                      : 'border-border/50 hover:border-emerald-200 hover:shadow-lg dark:hover:border-emerald-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600" />
                  )}
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient}`}>
                        <plan.icon className="h-5 w-5 text-white" />
                      </div>
                      {plan.popular && (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                          Most Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4 text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                      {plan.priceUsd !== plan.price && (
                        <p className="text-xs text-muted-foreground mt-1">(~{plan.priceUsd}/mo)</p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <Separator className="mb-4" />
                    <ul className="space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat.label} className="flex items-center gap-3 text-sm">
                          {feat.included ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <X className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                          )}
                          <span className={feat.included ? '' : 'text-muted-foreground/60'}>{feat.label}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => handleBuyPlan(plan.planKey, plan.amount)}
                      disabled={loading}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : plan.amount > 0 ? (
                        <CreditCard className="h-4 w-4 mr-2" />
                      ) : null}
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-muted-foreground mb-4">Secure payments powered by</p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {['UPI', 'Cards', 'Net Banking', 'Wallets', 'EMI'].map((method) => (
                <div
                  key={method}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/50 text-sm text-muted-foreground"
                >
                  <IndianRupee className="h-4 w-4 text-emerald-500" />
                  {method}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-t border-border/40 bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mb-2 text-center text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Feature Comparison
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mb-10 text-center text-muted-foreground"
            >
              See exactly what&apos;s included in each plan
            </motion.p>

            <motion.div variants={fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <Zap className="h-4 w-4 text-emerald-500" />
                          Free
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <Star className="h-4 w-4 text-emerald-500" />
                          Pro
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">
                        <div className="flex flex-col items-center gap-1">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          Enterprise
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((category, catIdx) => (
                      <React.Fragment key={category.category}>
                        <tr className="border-b border-border/30 bg-muted/20">
                          <td
                            colSpan={4}
                            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                          >
                            {category.category}
                          </td>
                        </tr>
                        {category.items.map((item) => (
                          <tr
                            key={item.label}
                            className={`border-b border-border/30 ${
                              catIdx === comparisonFeatures.length - 1 ? '' : ''
                            }`}
                          >
                            <td className="px-6 py-3 text-sm">{item.label}</td>
                            <td className="px-6 py-3 text-center">{renderCellValue(item.free)}</td>
                            <td className="px-6 py-3 text-center">{renderCellValue(item.pro)}</td>
                            <td className="px-6 py-3 text-center">{renderCellValue(item.enterprise)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About the Creator Section */}
      <section className="relative border-t border-border/40 py-20 sm:py-28 bg-gradient-to-b from-background to-emerald-50/30 dark:to-emerald-950/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }} className="text-center mb-12">
              <Badge variant="secondary" className="mb-4 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Heart className="mr-1.5 h-3.5 w-3.5" />
                Meet the Creator
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Made with{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  passion
                </span>
              </h2>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="border-emerald-200 overflow-hidden dark:border-emerald-800">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-8 sm:p-10 dark:from-emerald-950/30 dark:to-green-950/30">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Profile Picture */}
                    <div className="relative shrink-0">
                      <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-emerald-200 dark:border-emerald-700 shadow-lg shadow-emerald-500/20">
                        <Image
                          src="/tilak-profile.png"
                          alt="Tilak Dalai"
                          width={112}
                          height={112}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5">
                        <Code2 className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        Tilak Dalai
                      </h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Software Developer & Gamer
                      </p>
                      <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-xl">
                        A passionate 2nd year Computer Science & Engineering student at{' '}
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          Government College of Engineering, Kalahandi (GCEK)
                        </span>
                        . Tilak is driven by a love for building impactful software solutions and exploring new technologies. When not coding, you can find him gaming and honing his competitive skills.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">
                          <Code2 className="h-3 w-3 mr-1" />
                          Software Developer
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0">
                          <Gamepad2 className="h-3 w-3 mr-1" />
                          Gamer
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
                          CSE Student @ GCEK
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ / Trust Section */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Trusted by thousands of businesses
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-xl text-muted-foreground"
            >
              Join the growing community of businesses that rely on T.BulkMail for their email campaigns.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4"
            >
              {[
                { icon: Mail, label: '10M+ Emails Delivered', color: 'text-emerald-500' },
                { icon: Upload, label: '5K+ Active Users', color: 'text-emerald-500' },
                { icon: FileText, label: '50K+ Templates Created', color: 'text-emerald-500' },
                { icon: Headphones, label: '99.9% Uptime SLA', color: 'text-emerald-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/50 p-4">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-gradient-to-r from-emerald-600 to-green-600 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
            >
              Ready to get started?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-3 text-emerald-100"
            >
              Start your free account today. Upgrade anytime with secure Razorpay payments.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                onClick={() => onPageChange('register')}
                size="lg"
                className="h-12 bg-white px-8 text-base text-emerald-700 hover:bg-emerald-50"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-green-600">
                <Mail className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-bold">T.<span className="text-emerald-600">BulkMail</span></span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} T.BulkMail. All rights reserved.{' '}
              <button onClick={() => onPageChange('landing')} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                Home
              </button>
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 mx-0.5" /> by{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tilak Dalai</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
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
            onClick={() => {
              setShowSuccessDialog(false);
              onPageChange('dashboard');
            }}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
