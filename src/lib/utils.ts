import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'informational': return 'text-slate-600 bg-slate-50 border-slate-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getSeverityBadgeColor(severity: string): string {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300';
    case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'informational': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

export function getSeverityDot(severity: string): string {
  switch (severity) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-blue-500';
    case 'informational': return 'bg-slate-400';
    default: return 'bg-slate-400';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pass': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'fail': return 'text-red-600 bg-red-50 border-red-200';
    case 'informational': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'not-verified': return 'text-slate-600 bg-slate-50 border-slate-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'pass': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300';
    case 'fail': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    case 'informational': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case 'not-verified': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

export function getSecurityScoreLabel(score: number): { label: string; color: string; bg: string; ring: string } {
  if (score >= 90) return { label: 'Strong Configuration', color: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'stroke-emerald-500' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500', ring: 'stroke-blue-500' };
  if (score >= 50) return { label: 'Needs Improvement', color: 'text-amber-600', bg: 'bg-amber-500', ring: 'stroke-amber-500' };
  return { label: 'High Number of Configuration Issues', color: 'text-red-600', bg: 'bg-red-500', ring: 'stroke-red-500' };
}

export function truncateUrl(url: string, maxLen = 50): string {
  if (url.length <= maxLen) return url;
  return url.substring(0, maxLen - 3) + '...';
}