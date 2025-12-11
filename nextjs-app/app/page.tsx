'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Mail, RefreshCw } from 'lucide-react';
import { generateTestId } from '@/lib/utils';

export default function HomePage() {
  const [testEmail, setTestEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Generate test email on mount
    generateNewEmail();
  }, []);

  const generateNewEmail = () => {
    setIsGenerating(true);
    const testId = generateTestId();
    const email = `test-${testId}@deliverabilityanalyzer.xyz`;
    setTestEmail(email);
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
          <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
            Waiting for email... This page will automatically update when we receive your message.
          </div>
        </div>

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
