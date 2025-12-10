'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'white' }}>
      <Header />

      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '24px', lineHeight: '1.2' }}>
          Test Your Email <span style={{ color: '#0073EA' }}>Deliverability</span>
        </h1>
        <p style={{ fontSize: '20px', color: '#6B7280', marginBottom: '40px', maxWidth: '700px', margin: '0 auto 40px' }}>
          Comprehensive spam and deliverability testing with SpamAssassin
        </p>
        <Button size="lg">Start Testing Now</Button>
      </section>

      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 20px 120px' }}>
        <h2 style={{ fontSize: '36px', fontWeight: 'bold', textAlign: 'center', marginBottom: '60px' }}>
          Everything You Need
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', background: '#0073EA', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={24} color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>SpamAssassin Analysis</h3>
            <p style={{ color: '#6B7280', lineHeight: '1.6' }}>Industry-standard spam detection and scoring</p>
          </div>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', background: '#0073EA', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={24} color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>Email Authentication</h3>
            <p style={{ color: '#6B7280', lineHeight: '1.6' }}>SPF, DKIM, and DMARC validation</p>
          </div>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', background: '#0073EA', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={24} color="white" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#111827' }}>Instant Results</h3>
            <p style={{ color: '#6B7280', lineHeight: '1.6' }}>Real-time analysis and detailed reports</p>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #E5E7EB', padding: '48px 20px', textAlign: 'center', background: '#F9FAFB' }}>
        <p style={{ fontSize: '14px', color: '#6B7280' }}>© 2024 Deliverability Analyzer</p>
      </footer>
    </div>
  );
}
