'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Mail, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/results/${testId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.testId) {
            setResults(data);
            setIsPolling(false);
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error polling for results:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 5 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
      if (!results) {
        setError('No email received yet. Make sure to send an email to the address above.');
      }
    }, 300000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [testId, results]);

  const generateNewEmail = () => {
    setIsGenerating(true);
    setResults(null);
    setError(null);
    const newTestId = generateTestId();
    const email = `test-${newTestId}@deliverabilityanalyzer.xyz`;
    setTestEmail(email);
    setTestId(newTestId);
    setTimeout(() => setIsGenerating(false), 300);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(testEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Header />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 20px' }}>
        {/* Main Test Card */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: results ? '24px' : '32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#111827' }}>
              {results ? 'Test Another Email' : 'Test Your Email Deliverability'}
            </h1>
            <p style={{ fontSize: '16px', color: '#6B7280', lineHeight: '1.6' }}>
              {results ? 'Send another test to check different email configurations' : 'Send an email to the address below and get instant analysis'}
            </p>
          </div>

          {/* Email Address Display */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Send your test email to:
            </label>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'stretch'
            }}>
              <div style={{
                flex: 1,
                background: '#F9FAFB',
                border: '2px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px 20px',
                fontSize: '16px',
                fontFamily: 'monospace',
                color: '#111827',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Mail size={20} color="#0073EA" />
                <span>{testEmail || 'Generating...'}</span>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={copyToClipboard}
                style={{ minWidth: '120px' }}
              >
                {copied ? (
                  <>Check Copied!</>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={generateNewEmail}
                disabled={isGenerating}
              >
                <RefreshCw size={18} style={{
                  animation: isGenerating ? 'spin 1s linear infinite' : 'none'
                }} />
              </Button>
            </div>
          </div>

          {/* Instructions - Only show if no results yet */}
          {!results && (
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '13px',
                color: '#1E40AF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <span>📧 Copy address</span>
                <span>→</span>
                <span>✉️ Send test email</span>
                <span>→</span>
                <span>⏱️ Wait 5-10 seconds</span>
                <span>→</span>
                <span>📊 View results</span>
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
              gap: '8px'
            }}>
              {isPolling && (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              )}
              <span>Waiting for email... This page will automatically update when we receive your message.</span>
            </div>
          )}

          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '16px',
              color: '#991B1B',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Results Section - Compact and Professional */}
        {results && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '32px'
          }}>
            {/* Header with Score */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: '2px solid #F3F4F6'
            }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}>
                  Deliverability Report
                </h2>
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                  From: <strong>{results.from}</strong> • {new Date(results.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div style={{
                background: results.analysis.spamScore >= 7 ? '#ECFDF5' : results.analysis.spamScore >= 5 ? '#FEF3C7' : '#FEF2F2',
                border: `3px solid ${results.analysis.spamScore >= 7 ? '#10B981' : results.analysis.spamScore >= 5 ? '#F59E0B' : '#EF4444'}`,
                borderRadius: '12px',
                padding: '16px 24px',
                textAlign: 'center',
                minWidth: '120px'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: results.analysis.spamScore >= 7 ? '#059669' : results.analysis.spamScore >= 5 ? '#D97706' : '#DC2626', lineHeight: '1' }}>
                  {results.analysis.spamScore}<span style={{ fontSize: '20px' }}>/10</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginTop: '4px' }}>
                  Deliverability
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}>
              {/* Left Column - Authentication */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                  Email Authentication
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{
                    background: results.analysis.spfPass ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${results.analysis.spfPass ? '#10B981' : '#EF4444'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {results.analysis.spfPass ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <XCircle size={20} color="#EF4444" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>SPF</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {results.analysis.details.spf}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: results.analysis.dkimPass ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${results.analysis.dkimPass ? '#10B981' : '#EF4444'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {results.analysis.dkimPass ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <XCircle size={20} color="#EF4444" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>DKIM</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {results.analysis.details.dkim}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: results.analysis.dmarcPass ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${results.analysis.dmarcPass ? '#10B981' : '#EF4444'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {results.analysis.dmarcPass ? (
                      <CheckCircle size={20} color="#10B981" />
                    ) : (
                      <XCircle size={20} color="#EF4444" />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>DMARC</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        {results.analysis.details.dmarc}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Recommendations */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                  {results.analysis.spamScore >= 7 ? 'Looking Good!' : 'How to Improve'}
                </h3>
                {results.analysis.recommendations.length > 0 ? (
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      color: '#374151',
                      lineHeight: '1.8',
                      fontSize: '13px'
                    }}>
                      {results.analysis.recommendations.slice(0, 4).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#059669',
                    fontSize: '13px',
                    textAlign: 'center'
                  }}>
                    Your email authentication is properly configured!
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Assessment Bar */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: results.analysis.spamScore >= 7 ? '#ECFDF5' : results.analysis.spamScore >= 5 ? '#FFFBEB' : '#FEF2F2',
              border: `1px solid ${results.analysis.spamScore >= 7 ? '#10B981' : results.analysis.spamScore >= 5 ? '#F59E0B' : '#EF4444'}`,
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <strong style={{
                color: results.analysis.spamScore >= 7 ? '#059669' : results.analysis.spamScore >= 5 ? '#D97706' : '#DC2626',
                fontSize: '14px'
              }}>
                {results.analysis.assessment}
              </strong>
            </div>
          </div>
        )}

        {/* Feature Grid - Hide when results shown */}
        {!results && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#0073EA',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>🛡️</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#111827' }}>
              SpamAssassin Score
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5' }}>
              Industry-standard spam detection
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#0073EA',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#111827' }}>
              SPF/DKIM/DMARC
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5' }}>
              Email authentication checks
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#0073EA',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#111827' }}>
              Instant Analysis
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5' }}>
              Real-time results in seconds
            </p>
          </div>
        </div>
        )}
      </main>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
