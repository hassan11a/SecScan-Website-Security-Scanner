'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDuration, truncateUrl } from '@/lib/utils';
import {
  Clock, Search, History, ChevronLeft, ChevronRight, FileText,
  CheckCircle2, AlertTriangle, Loader2, ArrowRight, Radar, Database, TrendingUp
} from 'lucide-react';

interface ScanHistoryItem {
  id: string;
  scanId: string;
  url: string;
  dateTime: string;
  securityScore: number | null;
  findingCount: number;
  status: 'completed' | 'failed' | 'in-progress';
  duration?: number;
  high_count?: number;
  medium_count?: number;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchScans = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/scans?limit=${limit}&offset=${(pageNum - 1) * limit}`);
      if (!response.ok) throw new Error('Failed to fetch scans');
      const data = await response.json();
      setScans(data.scans);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans(page);
  }, [page]);

  const totalPages = Math.ceil(total / limit);
  const completedCount = scans.filter(s => s.status === 'completed').length;

  const getScoreStyle = (score: number | null) => {
    if (score === null) return { text: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (score >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50' };
    if (score >= 70) return { text: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50' };
    if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50' };
    return { text: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/50' };
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navigation />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                <History className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Scan History
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  View and manage your previous security scans
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm sm:flex dark:border-slate-800 dark:bg-slate-900">
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{total}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Total</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums text-emerald-600">{completedCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Done</p>
              </div>
            </div>
            <Link href="/scanner">
              <Button className="gap-2 shadow-lg shadow-blue-500/25">
                <Radar className="h-4 w-4" />
                New Scan
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-fade-in rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 animate-shimmer rounded-xl bg-slate-100 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 animate-shimmer rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-3 w-1/3 animate-shimmer rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="h-10 w-14 animate-shimmer rounded-lg bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="animate-fade-in rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Database className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No scans yet</h3>
            <p className="mt-1 text-sm text-slate-400">Start your first security scan to see results here</p>
            <Link href="/scanner" className="mt-5 inline-block">
              <Button className="gap-2">
                <Radar className="h-4 w-4" />
                Start New Scan
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {scans.map((scan, i) => {
                const scoreStyle = getScoreStyle(scan.securityScore);
                return (
                  <Link
                    key={scan.id}
                    href={`/scan/${scan.scanId}`}
                    className="group flex animate-fade-in-up items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      scan.status === 'completed'
                        ? scan.securityScore !== null && scan.securityScore >= 70
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'
                          : scan.securityScore !== null && scan.securityScore >= 50
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50'
                            : 'bg-red-100 text-red-600 dark:bg-red-950/50'
                        : scan.status === 'failed'
                          ? 'bg-red-100 text-red-600 dark:bg-red-950/50'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950/50'
                    }`}>
                      {scan.status === 'in-progress' ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : scan.status === 'failed' ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {truncateUrl(scan.url, 50)}
                        </p>
                        <Badge
                          variant={
                            scan.status === 'completed' ? 'success'
                            : scan.status === 'failed' ? 'danger'
                            : 'secondary'
                          }
                          className="shrink-0 text-[10px]"
                        >
                          {scan.status}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(scan.dateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {scan.findingCount} checks
                        </span>
                        {typeof scan.duration === 'number' && scan.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatDuration(scan.duration)}
                          </span>
                        )}
                      </div>
                    </div>

                    {scan.securityScore !== null && (
                      <div className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl ${scoreStyle.bg}`}>
                        <span className={`text-lg font-bold tabular-nums leading-none ${scoreStyle.text}`}>
                          {scan.securityScore}
                        </span>
                        <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-400">
                          score
                        </span>
                      </div>
                    )}

                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600" />
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}