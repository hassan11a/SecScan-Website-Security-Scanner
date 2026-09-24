'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatShortDate, formatDuration, getSecurityScoreLabel, getSeverityDot, truncateUrl } from '@/lib/utils';
import {
  Shield, Search, Clock, TrendingUp, Activity, Database, ArrowRight, History,
  Radar, AlertTriangle, CheckCircle2, FileText, ChevronRight, Zap, Globe, Settings
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';

interface ScanHistoryItem {
  id: string;
  scanId: string;
  url: string;
  dateTime: string;
  securityScore: number | null;
  findingCount: number;
  status: 'completed' | 'failed' | 'in-progress';
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  informational_count?: number;
  passed_checks?: number;
  duration?: number;
}

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prevRef.current = end;
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return <>{display}</>;
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const label = getSecurityScoreLabel(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${label.ring} transition-all duration-1000 ease-out`}
          style={{ filter: `drop-shadow(0 0 6px ${score >= 90 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444'}40)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold tabular-nums ${label.color}`}>
          <AnimatedNumber value={score} />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Score</span>
      </div>
    </div>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
  informational: '#94a3b8'
};

export default function DashboardPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScans: 0,
    avgScore: 0,
    totalFindings: 0,
    totalPassed: 0,
    lastScan: null as string | null,
    severityData: [] as { name: string; value: number; color: string }[],
    scoreTrend: [] as { name: string; score: number }[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scansRes, countRes] = await Promise.all([
        fetch('/api/scans?limit=5'),
        fetch('/api/scans?limit=100')
      ]);

      const scansData = await scansRes.json();
      const countData = await countRes.json();

      setScans(scansData.scans);

      const completedScans = countData.scans.filter(
        (s: ScanHistoryItem) => s.status === 'completed' && s.securityScore !== null
      );
      const avgScore = completedScans.length > 0
        ? Math.round(completedScans.reduce((acc: number, s: ScanHistoryItem) => acc + (s.securityScore || 0), 0) / completedScans.length)
        : 0;

      const totalFindings = countData.scans.reduce((acc: number, s: ScanHistoryItem) => acc + s.findingCount, 0);

      const allScans = countData.scans as ScanHistoryItem[];
      const highTotal = allScans.reduce((a, s) => a + (s.high_count || 0), 0);
      const mediumTotal = allScans.reduce((a, s) => a + (s.medium_count || 0), 0);
      const lowTotal = allScans.reduce((a, s) => a + (s.low_count || 0), 0);
      const infoTotal = allScans.reduce((a, s) => a + (s.informational_count || 0), 0);
      const passedTotal = allScans.reduce((a, s) => a + (s.passed_checks || 0), 0);

      const severityData = [
        { name: 'High', value: highTotal, color: SEVERITY_COLORS.high },
        { name: 'Medium', value: mediumTotal, color: SEVERITY_COLORS.medium },
        { name: 'Low', value: lowTotal, color: SEVERITY_COLORS.low },
        { name: 'Info', value: infoTotal, color: SEVERITY_COLORS.informational },
      ].filter(d => d.value > 0);

      const scoreTrend = [...allScans]
        .filter(s => s.status === 'completed' && s.securityScore !== null)
        .reverse()
        .slice(-10)
        .map((s, i) => ({
          name: `#${i + 1}`,
          score: s.securityScore || 0
        }));

      setStats({
        totalScans: countData.total,
        avgScore,
        totalFindings,
        totalPassed: passedTotal,
        lastScan: allScans[0]?.dateTime || null,
        severityData,
        scoreTrend
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const latestScore = scans.find(s => s.securityScore !== null)?.securityScore ?? stats.avgScore;
  const scoreLabel = getSecurityScoreLabel(latestScore);

  const statCards = [
    {
      title: 'Total Scans',
      value: stats.totalScans,
      icon: Database,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
      suffix: ''
    },
    {
      title: 'Average Score',
      value: stats.avgScore,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      suffix: '/100'
    },
    {
      title: 'Total Findings',
      value: stats.totalFindings,
      icon: Activity,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      suffix: ''
    },
    {
      title: 'Passed Checks',
      value: stats.totalPassed,
      icon: CheckCircle2,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
      suffix: ''
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navigation />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1.5 text-slate-500 dark:text-slate-400">
                Overview of your security scanning activity
              </p>
            </div>
            <Link href="/scanner">
              <Button className="gap-2 shadow-lg shadow-blue-500/25">
                <Radar className="h-4 w-4" />
                Start New Scan
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, i) => (
            <div
              key={card.title}
              className="stat-card animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                    <AnimatedNumber value={card.value} />
                    {card.suffix && (
                      <span className="text-lg font-medium text-slate-400">{card.suffix}</span>
                    )}
                  </p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow}`}>
                  <card.icon className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Score Ring + Severity Chart + Score Trend */}
        <div className="grid gap-4 mb-8 lg:grid-cols-3">
          {/* Score Ring */}
          <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: '0.3s' }}>
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Latest Security Score</h3>
            </div>
            <div className="flex flex-col items-center gap-4">
              <ScoreRing score={latestScore} />
              <div className="text-center">
                <Badge className={`${scoreLabel.bg} text-white border-0 px-3 py-1`}>
                  {scoreLabel.label}
                </Badge>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 py-2 dark:bg-slate-800/50">
                <p className="font-bold text-emerald-600">{scans.filter(s => s.status === 'completed').length}</p>
                <p className="text-slate-400">Completed</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2 dark:bg-slate-800/50">
                <p className="font-bold text-red-500">{scans.filter(s => s.status === 'failed').length}</p>
                <p className="text-slate-400">Failed</p>
              </div>
              <div className="rounded-lg bg-slate-50 py-2 dark:bg-slate-800/50">
                <p className="font-bold text-blue-500">{scans.filter(s => s.status === 'in-progress').length}</p>
                <p className="text-slate-400">Running</p>
              </div>
            </div>
          </div>

          {/* Severity Pie Chart */}
          <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: '0.4s' }}>
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Findings by Severity</h3>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : stats.severityData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5">
                  {stats.severityData.map(item => (
                    <div key={item.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                <Activity className="mb-2 h-8 w-8" />
                <p className="text-sm">No findings yet</p>
              </div>
            )}
          </div>

          {/* Score Trend */}
          <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: '0.5s' }}>
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Score Trend</h3>
            </div>
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            ) : stats.scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats.scoreTrend}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} fill="url(#scoreGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-slate-400">
                <TrendingUp className="mb-2 h-8 w-8" />
                <p className="text-sm">No scan history yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans + Quick Actions */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Recent Scans */}
          <div className="lg:col-span-2 animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Scans</h3>
              </div>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-10 w-10 animate-shimmer rounded-xl bg-slate-100 dark:bg-slate-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 animate-shimmer rounded bg-slate-100 dark:bg-slate-800" />
                      <div className="h-3 w-1/3 animate-shimmer rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                ))
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <Radar className="h-7 w-7 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">No scans yet</p>
                  <p className="mt-1 text-sm text-slate-400">Run your first security scan to get started</p>
                  <Link href="/scanner" className="mt-4">
                    <Button size="sm" className="gap-2">
                      <Search className="h-4 w-4" />
                      Start Scanning
                    </Button>
                  </Link>
                </div>
              ) : (
                scans.map((scan, i) => (
                  <Link
                    key={scan.id}
                    href={`/scan/${scan.scanId}`}
                    className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    style={{ animationDelay: `${0.7 + i * 0.05}s` }}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
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
                      <Globe className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {truncateUrl(scan.url, 45)}
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
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatShortDate(scan.dateTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {scan.findingCount} checks
                        </span>
                      </div>
                    </div>

                    {scan.securityScore !== null && (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold tabular-nums ${
                            scan.securityScore >= 90 ? 'text-emerald-600'
                            : scan.securityScore >= 70 ? 'text-blue-600'
                            : scan.securityScore >= 50 ? 'text-amber-600'
                            : 'text-red-500'
                          }`}>
                            {scan.securityScore}
                          </p>
                          <p className="text-[10px] text-slate-400">score</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600" />
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in-up space-y-4" style={{ animationDelay: '0.7s' }}>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                {[
                  { icon: Radar, label: 'Start New Scan', desc: 'Scan a website for issues', href: '/scanner', color: 'from-blue-500 to-indigo-600' },
                  { icon: History, label: 'Scan History', desc: 'Browse previous results', href: '/history', color: 'from-violet-500 to-purple-600' },
                  { icon: Settings, label: 'Settings', desc: 'Configure the scanner', href: '/settings', color: 'from-slate-500 to-slate-600' },
                ].map(action => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} shadow-sm`}>
                      <action.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{action.label}</p>
                      <p className="text-xs text-slate-400">{action.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-slate-500 dark:text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Last Scan Info */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Scan</h3>
              </div>
              {stats.lastScan ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(stats.lastScan)}
                  </p>
                  <p className="text-xs text-slate-400">Most recent activity</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No scans performed yet</p>
              )}
            </div>

            {/* Security Reminder */}
            <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm dark:border-blue-900/30 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                    Authorized Testing Only
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-blue-700/80 dark:text-blue-300/80">
                    This tool is for defensive security testing only. Only scan websites you own or have explicit written permission to test.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}