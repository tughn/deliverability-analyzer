'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Mail, RefreshCw, CheckCircle, XCircle, AlertCircle, Shield, Zap, Clock, BarChart3, ArrowRight } from 'lucide-react';
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
            gap: '24px',
            marginBottom: '32px',
            opacity: 0,
            animation: 'fadeIn 0.6s ease-out forwards'
          }}>
            {/* Left Column - Score & Authentication */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

            {/* Right Column - Recommendations */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s ease'
            }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={20} />
                  {results.analysis.spamScore >= 7 ? 'Looking Good!' : 'How to Improve'}
                </h3>
                {results.analysis.recommendations.length > 0 ? (
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
                ) : (
                  <p style={{ fontSize: '14px', color: '#10B981', background: '#ECFDF5', padding: '16px', borderRadius: '8px', margin: 0 }}>
                    <CheckCircle size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                    Your email configuration looks great! No issues detected.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Assessment Bar */}
            <div style={{
              gridColumn: '1 / -1',
              padding: '20px',
              background: results.analysis.spamScore >= 7 ? '#ECFDF5' : results.analysis.spamScore >= 5 ? '#FFFBEB' : '#FEF2F2',
              border: `2px solid ${results.analysis.spamScore >= 7 ? '#10B981' : results.analysis.spamScore >= 5 ? '#F59E0B' : '#EF4444'}`,
              borderRadius: '12px',
              textAlign: 'center',
              transition: 'all 0.3s ease'
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
              gridColumn: '1 / -1',
              textAlign: 'center'
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
