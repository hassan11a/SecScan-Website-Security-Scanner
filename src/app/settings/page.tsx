'use client';

import { useEffect, useRef, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import {
  Settings, Bell, Palette, Key, Globe, Database, Save, RotateCcw,
  CheckCircle2, Shield, Download, Trash2, AlertTriangle, Moon, Sun, Monitor,
  Timer, Link2, Bot
} from 'lucide-react';

const DEFAULTS = {
  theme: 'system',
  defaultTimeout: 10000,
  maxRedirects: 10,
  userAgent: 'SecurityScanner/1.0',
  allowLocal: false,
  notifications: true,
  autoSaveReports: true
};

type SettingsState = typeof DEFAULTS;

function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  if (theme === 'light') {
    root.classList.add('light');
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.add(prefersDark ? 'dark' : 'light');
  }
}

function SectionCard({
  icon: Icon,
  title,
  desc,
  gradient,
  children
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-in-up overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
          {desc && <p className="text-xs text-slate-400">{desc}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  warn
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warn?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
      warn
        ? 'border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'
        : 'border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40'
    }`}>
      <div className="min-w-0">
        <Label className="text-sm font-semibold text-slate-900 dark:text-white">{label}</Label>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} className="shrink-0" />
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  hint,
  children
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      {children}
      {hint && <p className="mt-1.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({ ...DEFAULTS });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('secscan-settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...DEFAULTS, ...parsed });
        applyTheme(parsed.theme || 'system');
      } else {
        applyTheme('system');
      }
    } catch {
      applyTheme('system');
    }
    loaded.current = true;
  }, []);

  const handleChange = (key: keyof SettingsState, value: unknown) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
    if (key === 'theme') applyTheme(value as string);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('secscan-settings', JSON.stringify(settings));
    } catch {}
    applyTheme(settings.theme);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    setDirty(true);
    setSaved(false);
    applyTheme('system');
    try {
      localStorage.removeItem('secscan-settings');
    } catch {}
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navigation />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in-up">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-500/20">
              <Settings className="h-6 w-6 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Settings
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Configure scanner behavior and preferences
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!dirty && !saved}
            className={`gap-2 shadow-lg transition-all ${
              saved
                ? 'bg-emerald-600 shadow-emerald-500/25 hover:bg-emerald-700'
                : 'shadow-blue-500/25'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="space-y-5">
          {/* Appearance */}
          <SectionCard
            icon={Palette}
            title="Appearance"
            desc="Theme applies instantly across the app"
            gradient="from-violet-500 to-purple-600"
          >
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: Sun, preview: 'bg-white', bar: 'bg-slate-200' },
                { value: 'dark', label: 'Dark', icon: Moon, preview: 'bg-slate-900', bar: 'bg-slate-700' },
                { value: 'system', label: 'System', icon: Monitor, preview: 'bg-gradient-to-r from-white from-50% to-slate-900 to-50%', bar: 'bg-slate-400' }
              ].map(theme => {
                const active = settings.theme === theme.value;
                return (
                  <button
                    key={theme.value}
                    onClick={() => handleChange('theme', theme.value)}
                    aria-pressed={active}
                    className={`group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-500/10 dark:bg-blue-950/40'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`h-10 w-14 overflow-hidden rounded-md border ${theme.preview} ${
                      theme.value === 'system' ? 'border-slate-300' : theme.value === 'dark' ? 'border-slate-600' : 'border-slate-200'
                    }`}>
                      <div className={`h-1.5 w-full ${theme.bar}`} />
                      <div className="mt-1.5 space-y-1 px-1.5">
                        <div className={`h-1 rounded-full ${theme.bar} opacity-70`} />
                        <div className={`h-1 w-2/3 rounded-full ${theme.bar} opacity-50`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <theme.icon className={`h-3.5 w-3.5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                      <span className={`text-xs font-bold ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                        {theme.label}
                      </span>
                    </div>
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow">
                        <CheckCircle2 className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Scanner Configuration */}
          <SectionCard
            icon={Globe}
            title="Scanner Configuration"
            desc="Network limits and request behavior"
            gradient="from-blue-500 to-indigo-600"
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field icon={Timer} label="Request Timeout" hint="1000 – 60000 ms">
                  <div className="relative">
                    <input
                      type="number"
                      min={1000}
                      max={60000}
                      value={settings.defaultTimeout}
                      onChange={e => handleChange('defaultTimeout', parseInt(e.target.value) || 10000)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm tabular-nums text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">ms</span>
                  </div>
                </Field>
                <Field icon={Link2} label="Max Redirects" hint="Follow up to N hops">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.maxRedirects}
                    onChange={e => handleChange('maxRedirects', parseInt(e.target.value) || 10)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm tabular-nums text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </Field>
              </div>

              <Field icon={Bot} label="User Agent" hint="Sent with every probe request">
                <input
                  type="text"
                  value={settings.userAgent}
                  onChange={e => handleChange('userAgent', e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </Field>

              <ToggleRow
                warn
                label="Allow Local / Private IP Scanning"
                desc="Enable scanning of localhost and private IP ranges — local lab testing only"
                checked={settings.allowLocal}
                onChange={v => handleChange('allowLocal', v)}
              />
            </div>
          </SectionCard>

          {/* Notifications & Reports */}
          <SectionCard
            icon={Bell}
            title="Notifications & Reports"
            desc="Control how results are surfaced and stored"
            gradient="from-amber-500 to-orange-600"
          >
            <div className="space-y-3">
              <ToggleRow
                label="Scan Notifications"
                desc="Show a notification when a scan completes"
                checked={settings.notifications}
                onChange={v => handleChange('notifications', v)}
              />
              <ToggleRow
                label="Auto-save Reports"
                desc="Automatically save every completed scan to history"
                checked={settings.autoSaveReports}
                onChange={v => handleChange('autoSaveReports', v)}
              />
            </div>
          </SectionCard>

          {/* Data Management */}
          <SectionCard
            icon={Database}
            title="Data Management"
            desc="Local SQLite storage"
            gradient="from-emerald-500 to-teal-600"
          >
            <div className="flex items-start gap-3 rounded-xl border border-blue-200/60 bg-blue-50/60 p-4 dark:border-blue-900/30 dark:bg-blue-950/25">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Local SQLite Database</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-700/90 dark:text-blue-300/80">
                  Scan data is stored locally in <code className="rounded bg-blue-100 px-1 py-0.5 text-[11px] dark:bg-blue-900/50">data/scanner.db</code>.
                  For production use, configure PostgreSQL via environment variables.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-2 rounded-lg">
                <Download className="h-4 w-4" />
                Export All Data
              </Button>
              <Button variant="danger" size="sm" className="gap-2 rounded-lg">
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            </div>
          </SectionCard>

          {/* Danger Zone */}
          <section className="animate-fade-in-up rounded-2xl border border-red-200/70 bg-white shadow-sm dark:border-red-900/40 dark:bg-slate-900" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 border-b border-red-100 px-6 py-4 dark:border-red-900/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-md shadow-red-500/20">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
                <p className="text-xs text-slate-400">Irreversible actions and legal notice</p>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-200">Authorized Testing Only</p>
                  <p className="mt-1 text-xs leading-relaxed text-red-700/90 dark:text-red-300/80">
                    This tool is for defensive security testing of websites you own or have explicit
                    written authorization to test. Unauthorized scanning may violate laws including the
                    Computer Fraud and Abuse Act (CFAA) and similar legislation worldwide.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Reset all settings</p>
                  <p className="text-xs text-slate-400">Restore configuration to factory defaults</p>
                </div>
                <Button variant="danger" size="sm" className="gap-2 rounded-lg shrink-0" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset Settings
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky save bar */}
        <div className="sticky bottom-4 z-40 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-black/20">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            {saved ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                Settings saved to this browser
              </span>
            ) : dirty ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                You have unsaved changes
              </span>
            ) : (
              'Changes are stored locally in your browser'
            )}
          </p>
          <Button onClick={handleSave} size="sm" disabled={!dirty && !saved} className="gap-2 rounded-lg">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </main>
    </div>
  );
}