'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Mail, CheckCircle, BarChart3, Zap, Lock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: 'SpamAssassin Analysis',
      description: 'Powered by industry-standard SpamAssassin for accurate spam detection and scoring.',
    },
    {
      icon: Mail,
      title: 'Email Authentication',
      description: 'Check SPF, DKIM, and DMARC records to ensure proper email authentication.',
    },
    {
      icon: CheckCircle,
      title: 'Blacklist Monitoring',
      description: 'Scan against major email blacklists to protect your sender reputation.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Reports',
      description: 'Get comprehensive analysis with actionable recommendations to improve deliverability.',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Receive real-time analysis and scoring within seconds of sending your test email.',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your email data is processed securely and never stored permanently.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Generate Test Email',
      description: 'Click the button to generate a unique test email address.',
    },
    {
      number: '02',
      title: 'Send Your Email',
      description: 'Send your email campaign or template to the generated address.',
    },
    {
      number: '03',
      title: 'Get Instant Results',
      description: 'View comprehensive analysis including spam score and deliverability metrics.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Test Your Email{' '}
            <span className="text-[#0073EA]">Deliverability</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Comprehensive email spam and deliverability testing powered by SpamAssassin.
            Check your SPF, DKIM, DMARC, blacklist status, and get a detailed spam score analysis.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/test">
              <Button size="lg" className="px-8 py-6 text-base">
                Start Testing Now
              </Button>
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Learn more <span aria-hidden="true">→</span>
            </a>
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Comprehensive email testing with industry-leading tools and analysis.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#0073EA]/10">
                      <Icon className="h-6 w-6 text-[#0073EA]" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Get started in three simple steps.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#0073EA] text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link href="/test">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-[#0073EA] to-[#338FF5] border-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Test Your Email?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Start analyzing your email deliverability and spam score now.
            </p>
            <Link href="/test">
              <Button
                size="lg"
                variant="secondary"
                className="mt-8 bg-white text-[#0073EA] hover:bg-gray-100"
              >
                Start Free Test
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} Deliverability Analyzer. All rights reserved.</p>
          <p className="mt-2">Powered by SpamAssassin</p>
        </div>
      </footer>
    </div>
  );
}
