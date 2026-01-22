'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Mail, RefreshCw, CheckCircle, XCircle, AlertCircle, Shield, Zap, Clock, BarChart3, ArrowRight, Phone, ExternalLink, ChevronDown } from 'lucide-react';
import { generateTestId } from '@/lib/utils';

interface EmailAnalysis {
  spfPass: boolean;
  dkimPass: boolean;
  dmarcPass: boolean;
  spamScore: number;
  spamIndicators: string[];
  recommendations: string[];
  headers: Record<string, string>;
  details: {
    spf: string;
    dkim: string;
    dmarc: string;
  };
  assessment: string;
}

interface TestResult {
  testId: string;
  from: string;
  to: string;
  subject: string;
  analysis: EmailAnalysis;
  timestamp: string;
}

export default function HomePage() {
  const [testEmail, setTestEmail] = useState('');
  const [testId, setTestId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the deliverability test work?",
      answer: "Simply copy the unique test email address we generate for you, then send an email to it from the email account you want to test. Our system will analyze your email within seconds and provide a detailed report on your authentication status (SPF, DKIM, DMARC), content analysis, and overall deliverability score."
    },
    {
      question: "What are SPF, DKIM, and DMARC?",
      answer: "These are email authentication protocols that help verify your emails are legitimate. SPF (Sender Policy Framework) verifies which servers can send emails for your domain. DKIM (DomainKeys Identified Mail) adds a digital signature to verify the email wasn't altered. DMARC (Domain-based Message Authentication) combines both and tells receiving servers what to do with unauthenticated emails."
    },
    {
      question: "Why is my deliverability score low?",
      answer: "A low score typically means one or more authentication protocols are failing or missing. Check the recommendations section in your results for specific actions to improve your score. Common issues include missing DNS records, misconfigured email servers, or content that triggers spam filters."
    },
    {
      question: "How can I improve my email deliverability?",
      answer: "Start by ensuring your domain has proper SPF, DKIM, and DMARC records configured. Avoid spam trigger words in your content, don't use URL shorteners, maintain a clean sender reputation, and authenticate all your sending sources. Our tool will give you specific recommendations based on your test results."
    },
    {
      question: "Is this tool free to use?",
      answer: "Yes, this deliverability analyzer is completely free. You can run as many tests as you need to verify your email authentication setup and monitor your deliverability score over time."
    }
  ];

  useEffect(() => {
    // Generate test email on mount
    generateNewEmail();
  }, []);

  // Poll for results
  useEffect(() => {
    if (!testId || results) return;

    const pollResults = async () => {
      setIsPolling(true);
      try {
        const response = await fetch(`/api/results/${testId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.analysis) {
            setResults(data);
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('Error polling results:', err);
      }
    };

    const interval = setInterval(pollResults, 3000);
    return () => clearInterval(interval);
  }, [testId, results]);

  const generateNewEmail = () => {
    setIsGenerating(true);
    const newTestId = generateTestId();
    const newEmail = `test-${newTestId}@deliverabilityanalyzer.xyz`;
    setTestId(newTestId);
    setTestEmail(newEmail);
    setResults(null);
    setError(null);
    setCopied(false);
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)' }}>
      <Header />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
          opacity: 0,
          animation: 'fadeIn 0.6s ease-out forwards'
        }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#111827',
            lineHeight: '1.2'
          }}>
            {results ? 'Deliverability Report' : 'Test Your Email Deliverability'}
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 3vw, 20px)',
            color: '#6B7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            {results ? `From: ${results.from}` : 'Check your email authentication and spam score instantly'}
          </p>
        </div>

        {/* Email Input Section */}
        {!results && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 'clamp(24px, 5vw, 40px)',
            marginBottom: '32px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            opacity: 0,
            animation: 'fadeIn 0.6s ease-out 0.2s forwards'
          }}>
            <h2 style={{
              fontSize: 'clamp(18px, 4vw, 24px)',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <Mail size={24} style={{ flexShrink: 0 }} />
              Send your test email to:
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#F9FAFB',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                transition: 'all 0.2s ease'
              }}>
                <code style={{
                  flex: '1',
                  fontSize: 'clamp(14px, 3vw, 18px)',
                  fontWeight: '600',
                  color: '#2563EB',
                  wordBreak: 'break-all',
                  minWidth: '0'
                }}>
                  {testEmail || 'Generating...'}
                </code>
                <Button
                  onClick={copyToClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: copied ? '#10B981' : '#2563EB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    if (!copied) e.currentTarget.style.background = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    if (!copied) e.currentTarget.style.background = '#2563EB';
                  }}
                >
                  {copied ? (
                    <>
                      <CheckCircle size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Steps */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              fontSize: 'clamp(13px, 2.5vw, 14px)',
              color: '#6B7280'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Copy size={16} style={{ flexShrink: 0 }} />
                Copy address
              </span>
              <ArrowRight size={16} style={{ flexShrink: 0 }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={16} style={{ flexShrink: 0 }} />
                Send test email
              </span>
              <ArrowRight size={16} style={{ flexShrink: 0 }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{ flexShrink: 0 }} />
                Wait 5-10 seconds
              </span>
              <ArrowRight size={16} style={{ flexShrink: 0 }} />
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={16} style={{ flexShrink: 0 }} />
                View results
              </span>
            </div>
          </div>
        )}

        {/* Status */}
        {!results && !error && (
          <div style={{
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: 0,
            animation: 'fadeIn 0.6s ease-out 0.4s forwards'
          }}>
            {isPolling && (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            )}
            <span>Waiting for email... This page will automatically update when we receive your message.</span>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div style={{ marginBottom: '32px' }}>
            {/* Score and Authentication Cards - Centered */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '32px',
              opacity: 0,
              animation: 'fadeIn 0.6s ease-out forwards'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
                gap: '24px',
                maxWidth: '800px',
                width: '100%'
              }}>
                {/* Score Badge */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s ease',
                }}>
                  <div style={{
                    background: results.analysis.spamScore >= 7 ? '#ECFDF5' : results.analysis.spamScore >= 5 ? '#FEF3C7' : '#FEF2F2',
                    border: `3px solid ${results.analysis.spamScore >= 7 ? '#10B981' : results.analysis.spamScore >= 5 ? '#F59E0B' : '#EF4444'}`,
                    borderRadius: '16px',
                    padding: '24px 32px',
                    textAlign: 'center',
                    minWidth: '140px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      fontSize: '48px',
                      fontWeight: 'bold',
                      color: results.analysis.spamScore >= 7 ? '#059669' : results.analysis.spamScore >= 5 ? '#D97706' : '#DC2626',
                      lineHeight: '1',
                      marginBottom: '8px'
                    }}>
                      {results.analysis.spamScore}<span style={{ fontSize: '24px' }}>/10</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Deliverability
                    </div>
                  </div>
                </div>

                {/* Authentication Status */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={20} />
                    Authentication
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* SPF */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827', marginBottom: '4px' }}>SPF</div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{results.analysis.details.spf}</div>
                      </div>
                      {results.analysis.spfPass ? (
                        <CheckCircle size={24} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
                      )}
                    </div>

                    {/* DKIM */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827', marginBottom: '4px' }}>DKIM</div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{results.analysis.details.dkim}</div>
                      </div>
                      {results.analysis.dkimPass ? (
                        <CheckCircle size={24} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
                      )}
                    </div>

                    {/* DMARC */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827', marginBottom: '4px' }}>DMARC</div>
                        <div style={{ fontSize: '13px', color: '#6B7280' }}>{results.analysis.details.dmarc}</div>
                      </div>
                      {results.analysis.dmarcPass ? (
                        <CheckCircle size={24} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : (
                        <XCircle size={24} style={{ color: '#EF4444', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {results.analysis.spamScore >= 7 && results.analysis.recommendations.length === 0 && (
              <div style={{
                maxWidth: '800px',
                margin: '0 auto 24px',
                padding: '20px',
                background: '#ECFDF5',
                border: '2px solid #10B981',
                borderRadius: '12px',
                textAlign: 'center',
                opacity: 0,
                animation: 'fadeIn 0.6s ease-out 0.2s forwards'
              }}>
                <div style={{
                  color: '#059669',
                  fontSize: '16px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <CheckCircle size={24} />
                  Looking Great!
                </div>
                <p style={{ fontSize: '14px', color: '#047857', margin: 0 }}>
                  Your email authentication is properly configured. No issues detected.
                </p>
              </div>
            )}

            {/* Recommendations Section */}
            {results.analysis.recommendations.length > 0 && (
              <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                opacity: 0,
                animation: 'fadeIn 0.6s ease-out 0.2s forwards'
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease'
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#111827',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={20} />
                    Recommendations to Improve Deliverability
                  </h3>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {results.analysis.recommendations.map((rec, idx) => (
                      <li key={idx} style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '14px',
                        color: '#374151',
                        lineHeight: '1.6',
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        borderLeft: '3px solid #2563EB',
                        transition: 'transform 0.2s ease'
                      }}>
                        <span style={{ color: '#2563EB', fontWeight: 'bold', flexShrink: 0 }}>{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Bottom Assessment Bar */}
            <div style={{
              maxWidth: '800px',
              margin: '24px auto',
              padding: '20px',
              background: results.analysis.spamScore >= 7 ? '#ECFDF5' : results.analysis.spamScore >= 5 ? '#FFFBEB' : '#FEF2F2',
              border: `2px solid ${results.analysis.spamScore >= 7 ? '#10B981' : results.analysis.spamScore >= 5 ? '#F59E0B' : '#EF4444'}`,
              borderRadius: '12px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              opacity: 0,
              animation: 'fadeIn 0.6s ease-out 0.4s forwards'
            }}>
              <strong style={{
                color: results.analysis.spamScore >= 7 ? '#059669' : results.analysis.spamScore >= 5 ? '#D97706' : '#DC2626',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {results.analysis.spamScore >= 7 ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {results.analysis.assessment}
              </strong>
            </div>

            {/* Test Again Button */}
            <div style={{
              textAlign: 'center',
              opacity: 0,
              animation: 'fadeIn 0.6s ease-out 0.6s forwards'
            }}>
              <Button
                onClick={generateNewEmail}
                style={{
                  padding: '12px 32px',
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1D4ED8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2563EB';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <RefreshCw size={18} />
                Test Another Email
              </Button>
            </div>
          </div>
        )}

        {/* Features Grid - Only show when no results */}
        {!results && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '24px',
            marginTop: '48px',
            opacity: 0,
            animation: 'fadeIn 0.6s ease-out 0.6s forwards'
          }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Shield size={24} style={{ color: 'white' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                SPF, DKIM & DMARC
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
                Verify email authentication protocols to ensure your messages are trusted by mail servers
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <BarChart3 size={24} style={{ color: 'white' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Content Analysis
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
                Detect spam triggers in your email content
              </p>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <Zap size={24} style={{ color: 'white' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>
                Instant Results
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
                Get comprehensive deliverability insights in seconds
              </p>
            </div>
          </div>
        )}
      </main>

      {/* FAQ Section */}
      <section style={{
        background: '#F9FAFB',
        padding: 'clamp(64px, 10vw, 100px) 16px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            <h2 style={{
              fontSize: 'clamp(24px, 4.5vw, 36px)',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '10px',
              letterSpacing: '-0.02em'
            }}>
              Frequently Asked Questions
            </h2>
            <p style={{
              fontSize: 'clamp(15px, 2.5vw, 17px)',
              color: '#6B7280'
            }}>
              Everything you need to know about email deliverability
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="faq-item"
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  border: openFaqIndex === index ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: openFaqIndex === index ? '0 4px 20px -4px rgba(37, 99, 235, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.04)'
                }}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (openFaqIndex !== index) {
                      e.currentTarget.style.background = '#F8FAFC';
                    }
                    const circle = e.currentTarget.querySelector('.chevron-circle') as HTMLElement;
                    if (circle && openFaqIndex !== index) {
                      circle.style.background = '#F1F5F9';
                      circle.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    const circle = e.currentTarget.querySelector('.chevron-circle') as HTMLElement;
                    if (circle && openFaqIndex !== index) {
                      circle.style.background = '#F3F4F6';
                      circle.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <span style={{
                    fontWeight: '500',
                    fontSize: 'clamp(15px, 2.8vw, 17px)',
                    color: openFaqIndex === index ? '#1D4ED8' : '#1F2937',
                    paddingRight: '16px',
                    transition: 'color 0.2s ease'
                  }}>
                    {faq.question}
                  </span>
                  <div
                    className="chevron-circle"
                    style={{
                      flexShrink: 0,
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: openFaqIndex === index ? '#EEF2FF' : '#F3F4F6',
                      border: openFaqIndex === index ? '1px solid #C7D2FE' : '1px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <ChevronDown
                      size={16}
                      className={`faq-chevron ${openFaqIndex === index ? 'faq-chevron-open' : ''}`}
                      style={{
                        color: openFaqIndex === index ? '#2563EB' : '#6B7280',
                        transition: 'color 0.2s ease'
                      }}
                    />
                  </div>
                </button>
                <div style={{
                  maxHeight: openFaqIndex === index ? '350px' : '0',
                  opacity: openFaqIndex === index ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{
                    padding: '0 24px 22px 24px',
                    color: '#4B5563',
                    fontSize: 'clamp(14px, 2.5vw, 15px)',
                    lineHeight: '1.7'
                  }}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#111827',
        color: '#9CA3AF',
        padding: '64px 24px 32px'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '48px 32px',
            marginBottom: '48px'
          }}>
            {/* Brand */}
            <div style={{ maxWidth: '280px' }}>
              <a
                href="https://www.sendmarc.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginBottom: '16px',
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <img
                  src="https://i0.wp.com/ekoparty.org/wp-content/uploads/2024/10/Sendmarc-Logo-RGB-Main-Inverted-1.png?fit=1635%2C567&ssl=1"
                  alt="Sendmarc"
                  style={{ height: '32px', width: 'auto' }}
                />
              </a>
              <p style={{
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#6B7280',
                marginBottom: '16px'
              }}>
                Protect your domain with DMARC, SPF, and DKIM email authentication.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="mailto:info@sendmarc.com"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#9CA3AF',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                >
                  <Mail size={14} />
                  info@sendmarc.com
                </a>
                <a
                  href="tel:+27109000972"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#9CA3AF',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                >
                  <Phone size={14} />
                  +27 10 900 0972
                </a>
              </div>
            </div>

            {/* Security Tools */}
            <div>
              <h4 style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Security Tools
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Phishing URL Checker', href: 'https://tools.sendmarc.com/phishing-checker', external: false },
                  { label: 'SPF Record Checker', href: 'https://sendmarc.com/spf/', external: true },
                  { label: 'DKIM Record Checker', href: 'https://sendmarc.com/dkim/', external: true },
                  { label: 'DMARC Analyzer', href: 'https://sendmarc.com/dmarc/', external: true }
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        color: '#9CA3AF',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.label}
                      {link.external && <ExternalLink size={11} style={{ opacity: 0.7 }} />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Resources
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Blog', href: 'https://sendmarc.com/blog/' },
                  { label: 'Phishing Guide', href: 'https://sendmarc.com/blog/spear-phishing-vs-phishing/' },
                  { label: 'Knowledge Base', href: 'https://help.sendmarc.com/' }
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        color: '#9CA3AF',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.label}
                      <ExternalLink size={11} style={{ opacity: 0.7 }} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Company
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'About Sendmarc', href: 'https://www.sendmarc.com' },
                  { label: 'Contact Us', href: 'https://www.sendmarc.com/contact' },
                  { label: 'Privacy Policy', href: 'https://www.sendmarc.com/privacy' },
                  { label: 'Trust Center', href: 'https://trust.sendmarc.com' }
                ].map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        color: '#9CA3AF',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease, transform 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#9CA3AF';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {link.label}
                      <ExternalLink size={11} style={{ opacity: 0.7 }} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div style={{
            borderTop: '1px solid #1F2937',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
              © {new Date().getFullYear()} Sendmarc. All rights reserved.
            </p>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
              Powered by{' '}
              <a
                href="https://www.sendmarc.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#60A5FA'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#fff'}
              >
                Sendmarc
              </a>
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          main {
            padding: 20px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
