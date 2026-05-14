'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Upload,
  FileText,
  BarChart3,
  Shield,
  Clock,
  ArrowRight,
  Check,
  Send,
  Zap,
  Globe,
  Heart,
  Code2,
  Gamepad2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface LandingPageProps {
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
    transition: { staggerChildren: 0.1 },
  },
};

const features = [
  {
    icon: Send,
    title: 'Bulk Email Sending',
    description: 'Send thousands of emails simultaneously with our powerful delivery engine. Reach your entire audience in seconds.',
    color: 'from-emerald-500 to-green-600',
  },
  {
    icon: Upload,
    title: 'CSV Import',
    description: 'Import recipient lists effortlessly from CSV files. Map columns, validate data, and start sending instantly.',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    icon: FileText,
    title: 'Email Templates',
    description: 'Create stunning email templates with our rich editor. Save, reuse, and personalize templates for any campaign.',
    color: 'from-green-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Campaign Tracking',
    description: 'Track opens, clicks, bounces, and deliveries in real-time. Make data-driven decisions for better results.',
    color: 'from-emerald-600 to-green-500',
  },
  {
    icon: Shield,
    title: 'Admin Dashboard',
    description: 'Manage users, monitor system health, and control access with a comprehensive admin panel.',
    color: 'from-teal-600 to-emerald-500',
  },
  {
    icon: Clock,
    title: 'Email Scheduling',
    description: 'Schedule campaigns for the perfect time. Set it and forget it with our reliable scheduling system.',
    color: 'from-green-600 to-teal-500',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Perfect for getting started',
    features: ['10 emails per campaign', '3 campaigns per day', '1 email template', 'Basic tracking', 'Community support'],
    cta: 'Get Started Free',
    popular: false,
    onClick: 'register',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    description: 'For growing businesses',
    features: [
      '500 emails per campaign',
      '50 campaigns per day',
      'Unlimited templates',
      'Advanced analytics',
      'Priority support',
      'CSV import & export',
      'Email scheduling',
    ],
    cta: 'Start Pro Trial',
    popular: true,
    onClick: 'register',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations',
    features: [
      'Unlimited emails',
      'Unlimited campaigns',
      'Custom templates',
      'Real-time analytics',
      '24/7 dedicated support',
      'API access',
      'Custom integrations',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
    onClick: 'pricing',
  },
];

export default function LandingPage({ onPageChange }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">T.<span className="text-emerald-600">BulkMail</span></span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <button onClick={() => onPageChange('pricing')} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </button>
            <button onClick={() => onPageChange('login')} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Sign In
            </button>
            <Button onClick={() => onPageChange('register')} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700">
              Get Started
            </Button>
          </div>
          <Button onClick={() => onPageChange('register')} variant="outline" className="md:hidden">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-transparent to-transparent dark:from-emerald-950/20 dark:via-transparent dark:to-transparent" />
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-400/20 to-green-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-6 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Power up your email campaigns
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 bg-clip-text text-transparent">
                T.BulkMail
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl"
            >
              Send bulk emails effortlessly. Import contacts, design templates, schedule campaigns, and track results — all in one powerful platform.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button
                onClick={() => onPageChange('register')}
                size="lg"
                className="h-12 bg-gradient-to-r from-emerald-500 to-green-600 px-8 text-base text-white hover:from-emerald-600 hover:to-green-700"
              >
                Start Free Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => onPageChange('pricing')}
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
              >
                View Pricing
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4"
            >
              {[
                { value: '10M+', label: 'Emails Sent' },
                { value: '5K+', label: 'Happy Users' },
                { value: '99.9%', label: 'Uptime' },
                { value: '<2s', label: 'Send Speed' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 sm:text-3xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-border/40 bg-gradient-to-b from-muted/30 to-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Everything you need to{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                email at scale
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-muted-foreground"
            >
              Powerful tools designed for businesses that need reliable, high-volume email delivery.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp} transition={{ duration: 0.5 }}>
                <Card className="group h-full border-border/50 bg-card/50 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:border-emerald-800">
                  <CardHeader>
                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg shadow-emerald-500/20`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative border-t border-border/40 bg-gradient-to-b from-background to-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Simple, transparent{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                pricing
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-2xl text-muted-foreground"
            >
              Choose the plan that fits your needs. Upgrade anytime as you grow.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {plans.map((plan) => (
              <motion.div key={plan.name} variants={fadeInUp} transition={{ duration: 0.5 }}>
                <Card
                  className={`relative h-full overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    plan.popular
                      ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 dark:border-emerald-400'
                      : 'border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute right-0 top-0">
                      <div className="rounded-bl-lg bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-1 text-xs font-semibold text-white">
                        Most Popular
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ul className="space-y-3">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => onPageChange(plan.onClick)}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'
                          : ''
                      }`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About the Creator Section */}
      <section className="relative border-t border-border/40 bg-gradient-to-b from-muted/30 to-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-6 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Heart className="mr-1.5 h-3.5 w-3.5" />
                Meet the Creator
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Made with{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                passion
              </span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <Card className="border-emerald-200 overflow-hidden dark:border-emerald-800">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-8 sm:p-10 dark:from-emerald-950/30 dark:to-green-950/30">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t border-border/40 py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMy0xLjM0NCAzLTNzLTEuMzQ0LTMtMy0zLTMgMS4zNDQtMyAzIDEuMzQ0IDMgMyAzeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Ready to supercharge your email campaigns?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-xl text-emerald-100"
            >
              Join thousands of businesses using T.BulkMail to reach their audience. Start for free — no credit card required.
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
              <Button
                onClick={() => onPageChange('pricing')}
                size="lg"
                variant="outline"
                className="h-12 border-white/30 px-8 text-base text-white hover:bg-white/10"
              >
                Compare Plans
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">T.<span className="text-emerald-600">BulkMail</span></span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                The most reliable bulk email platform for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Product</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <button onClick={() => onPageChange('landing')} className="text-sm text-muted-foreground hover:text-foreground">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => onPageChange('pricing')} className="text-sm text-muted-foreground hover:text-foreground">
                    Pricing
                  </button>
                </li>
                <li>
                  <button onClick={() => onPageChange('templates')} className="text-sm text-muted-foreground hover:text-foreground">
                    Templates
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="text-sm text-muted-foreground">About</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Blog</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Careers</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="text-sm text-muted-foreground">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Terms of Service</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Cookie Policy</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} T.BulkMail. All rights reserved.</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 mx-0.5" /> by{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tilak Dalai</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
