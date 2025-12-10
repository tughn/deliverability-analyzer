import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTestId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}${randomStr}`;
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

export function getScoreGrade(score: number): {
  grade: string;
  color: string;
  label: string;
} {
  if (score >= 90) {
    return { grade: 'A+', color: 'success', label: 'Excellent' };
  } else if (score >= 80) {
    return { grade: 'A', color: 'success', label: 'Very Good' };
  } else if (score >= 70) {
    return { grade: 'B', color: 'primary', label: 'Good' };
  } else if (score >= 60) {
    return { grade: 'C', color: 'warning', label: 'Fair' };
  } else if (score >= 50) {
    return { grade: 'D', color: 'warning', label: 'Poor' };
  } else {
    return { grade: 'F', color: 'error', label: 'Failing' };
  }
}
