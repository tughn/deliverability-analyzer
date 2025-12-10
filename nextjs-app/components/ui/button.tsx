'use client';

import { forwardRef, CSSProperties } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'md', variant = 'primary', style, children, ...props }, ref) => {
    const baseStyle: CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      whiteSpace: 'nowrap',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: 'none',
      fontFamily: 'inherit',
    };

    const sizeStyles: Record<string, CSSProperties> = {
      sm: { height: '36px', padding: '0 12px', fontSize: '12px' },
      md: { height: '40px', padding: '0 16px' },
      lg: { height: '44px', padding: '0 32px', fontSize: '16px' },
    };

    const variantStyles: Record<string, CSSProperties> = {
      primary: {
        background: '#0073EA',
        color: 'white',
      },
      secondary: {
        background: '#F3F4F6',
        color: '#111827',
      },
      outline: {
        background: 'white',
        border: '1px solid #E5E7EB',
        color: '#111827',
      },
      ghost: {
        background: 'transparent',
        color: '#111827',
      },
    };

    const combinedStyle: CSSProperties = {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === 'primary') {
        e.currentTarget.style.background = '#0060C9';
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = '#E5E7EB';
      } else if (variant === 'outline') {
        e.currentTarget.style.background = '#F9FAFB';
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = '#F3F4F6';
      }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (variant === 'primary') {
        e.currentTarget.style.background = '#0073EA';
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = '#F3F4F6';
      } else if (variant === 'outline') {
        e.currentTarget.style.background = 'white';
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = 'transparent';
      }
    };

    return (
      <button
        ref={ref}
        style={combinedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
