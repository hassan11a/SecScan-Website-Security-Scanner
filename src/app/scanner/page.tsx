'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import {
  Shield, Search, Loader2, CheckCircle2, AlertTriangle, Radar,
  FileCode, Lock, Cookie, Globe, Network, Layers, FileSearch, ArrowRight, Zap, Info
} from 'lucide-react';

const SCAN_STEPS = [
  'URL Validation',
  'HTTPS Check',
  'Security Headers',
  'Cookies',
  'DNS',
  'CORS',
  'Technology Detection',
  'security.txt',
  'robots.txt',
  'Redirect Analysis',
  'Report Generation'
];

const SCAN_MODULES = [
  { icon: FileCode, title: 'Security Headers', desc: 'CSP, HSTS, X-Frame-Options and more' },
  { icon: Lock, title: 'HTTPS / TLS', desc: 'Certificate and cipher configuration' },
  { icon: Cookie, title: 'Cookie Security', desc: 'Secure, HttpOnly, SameSite attributes' },
  { icon: Network, title: 'DNS Records', desc: 'SPF, DMARC, DNSSEC indicators' },
  { icon: Globe, title: 'CORS Policy', desc: 'Origin validation and wildcard risks' },
  { icon: Layers, title: 'Technology Stack', desc: 'Detect frameworks and server software' },
  { icon: FileSearch, title: 'security.txt', desc: 'RFC 9116 contact disclosure' },
  { icon: Shield, title: 'robots.txt', desc: 'Sensitive path exposure checks' },
  { icon: ArrowRight, title: 'Redirect Chains', desc: 'Loop detection and hop analysis' },
];

export default function ScannerPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<{ step: string; current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const handleScan = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setScanning(true);
    setError(null);
    setCompleted(false);
    setProgress({ step: SCAN_STEPS[0], current: 1, total: SCAN_STEPS.length });

    let step = 1;
    const tick = setInterval(() => {
      if (step < SCAN_STEPS.length) {
        step += 1;
        setProgress({ step: SCAN_STEPS[step - 1], current: step, total: SCAN_STEPS.length });
      }
    }, 700);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Scan failed');
      }

      clearInterval(tick);
      setProgress({ step: 'Report Generation', current: SCAN_STEPS.length, total: SCAN_STEPS.length });
      setCompleted(true);

      setTimeout(() => {
        router.push(`/scan/${data.scanId}`);
      }, 1400);
    } catch (err) {
      clearInterval(tick);
      setError(err instanceof Error ? err.message : 'An error occurred during scanning');
    } finally {
      clearInterval(tick);
      setScanning(false);
      setProgress(null);
    }
  }, [url, router]);

  const progressPercent = progress
    ? Math.round(((progress.current - 1) / progress.total) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navigation />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Radar className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Security Scanner
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
            Enter a website URL you own or are authorized to test. We&apos;ll analyze its security
            configuration and generate a detailed report.
          </p>
        </div>

        {/* Scan Form */}
        <div className="animate-fade-in-up rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <label htmlFor="scan-url" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Website URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
              <input
                id="scan-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={scanning}
                onKeyDown={(e) => { if (e.key === 'Enter' && url.trim() && !scanning) handleScan(); }}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-900"
              />
            </div>
            <Button
              onClick={handleScan}
              disabled={scanning || !url.trim()}
              size="lg"
              className="h-12 gap-2 rounded-xl px-8 shadow-lg shadow-blue-500/25"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Start Security Scan
                </>
              )}
            </Button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="h-3.5 w-3.5" />
            Only scan websites you own or have explicit authorization to test
          </p>

          {/* Progress */}
          {scanning && (
            <div className="mt-6 animate-fade-in rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {progress?.step || 'Starting scan...'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Step {progress?.current || 0} of {progress?.total || SCAN_STEPS.length}
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {progressPercent}%
                </span>
              </div>

              <Progress value={progress?.current || 0} max={progress?.total || SCAN_STEPS.length} className="h-2.5" />

              <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {SCAN_STEPS.map((step, index) => {
                  const done = index < (progress?.current || 0) - 1;
                  const active = index === (progress?.current || 0) - 1;
                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        active
                          ? 'bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : done
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                      )}
                      <span className="truncate">{step}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success */}
          {completed && (
            <div className="mt-6 animate-scale-in flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/50">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  Scan completed successfully
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Redirecting to report...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* What We Scan */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              What We Scan — 9 Modules
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SCAN_MODULES.map((mod, i) => (
              <div
                key={mod.title}
                className="group flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900"
                style={{ animationDelay: `${0.25 + i * 0.04}s` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-400">
                  <mod.icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{mod.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Authorization notice */}
        <div className="mt-8 animate-fade-in-up rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/30 dark:from-amber-950/30 dark:to-orange-950/30" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Authorized Testing Only
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-700/90 dark:text-amber-300/80">
                This tool is for defensive security testing of websites you own or have explicit written
                authorization to test. Unauthorized scanning may violate laws and terms of service.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}