'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      width: '100%',
      borderBottom: '1px solid #E5E7EB',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        height: '64px',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <Image
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSD1FrsGKFxj20BAPzSRdhGsqLGVgVqjV2ErA&s"
            alt="Sendmarc Logo"
            width={160}
            height={40}
            style={{ height: '32px', width: 'auto' }}
            priority
          />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link
            href="/"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0073EA'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
          >
            Home
          </Link>
          <Link
            href="/test"
            style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0073EA'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
          >
            Test Email
          </Link>
        </nav>
      </div>
    </header>
  );
}
