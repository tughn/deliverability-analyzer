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
          padding: '48px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
              Test Your Email Deliverability
            </h1>
            <p style={{ fontSize: '18px', color: '#6B7280', lineHeight: '1.6' }}>
              Send an email to the address below and get instant spam score analysis
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

          {/* Instructions */}
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF', marginBottom: '12px' }}>
              How it works:
            </h3>
            <ol style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#1E40AF',
              lineHeight: '1.8'
            }}>
              <li>Copy the email address above</li>
              <li>Send a test email from your email client</li>
              <li>Wait a few seconds for analysis</li>
              <li>View your detailed deliverability report</li>
            </ol>
          </div>

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

        {/* Results Section */}
        {results && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>
              Analysis Results
            </h2>

            {/* Email Info */}
            <div style={{
              background: '#F9FAFB',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                <strong>From:</strong> {results.from}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                <strong>Subject:</strong> {results.subject}
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280' }}>
                <strong>Received:</strong> {new Date(results.timestamp).toLocaleString()}
              </div>
            </div>

            {/* Spam Score */}
            <div style={{
              background: results.analysis.spamScore < 3 ? '#ECFDF5' : results.analysis.spamScore < 6 ? '#FEF3C7' : '#FEF2F2',
              border: `2px solid ${results.analysis.spamScore < 3 ? '#10B981' : results.analysis.spamScore < 6 ? '#F59E0B' : '#EF4444'}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px', color: results.analysis.spamScore < 3 ? '#059669' : results.analysis.spamScore < 6 ? '#D97706' : '#DC2626' }}>
                {results.analysis.spamScore}/10
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: results.analysis.spamScore < 3 ? '#059669' : results.analysis.spamScore < 6 ? '#D97706' : '#DC2626' }}>
                Spam Score
              </div>
              <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                {results.analysis.assessment}
              </div>
            </div>

            {/* Authentication Checks */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: results.analysis.spfPass ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${results.analysis.spfPass ? '#10B981' : '#EF4444'}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {results.analysis.spfPass ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : (
                  <XCircle size={24} color="#EF4444" />
                )}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>SPF</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {results.analysis.details.spf}
                  </div>
                </div>
              </div>

              <div style={{
                background: results.analysis.dkimPass ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${results.analysis.dkimPass ? '#10B981' : '#EF4444'}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {results.analysis.dkimPass ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : (
                  <XCircle size={24} color="#EF4444" />
                )}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>DKIM</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {results.analysis.details.dkim}
                  </div>
                </div>
              </div>

              <div style={{
                background: results.analysis.dmarcPass ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${results.analysis.dmarcPass ? '#10B981' : '#EF4444'}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {results.analysis.dmarcPass ? (
                  <CheckCircle size={24} color="#10B981" />
                ) : (
                  <XCircle size={24} color="#EF4444" />
                )}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>DMARC</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {results.analysis.details.dmarc}
                  </div>
                </div>
              </div>
            </div>

            {/* Spam Indicators */}
            {results.analysis.spamIndicators.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#111827' }}>
                  Issues Found
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#EF4444',
                  lineHeight: '1.8'
                }}>
                  {results.analysis.spamIndicators.map((indicator, idx) => (
                    <li key={idx}>{indicator}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {results.analysis.recommendations.length > 0 && (
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#1E40AF' }}>
                  Recommendations
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#1E40AF',
                  lineHeight: '1.8'
                }}>
                  {results.analysis.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Feature Grid */}
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
