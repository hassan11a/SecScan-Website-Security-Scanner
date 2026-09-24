import { ScanConfig, ScanFinding, ScanResult, ScanProgress } from '@/types';
import { HeadersScanner } from './headers';
import { TLSScanner } from './tls';
import { CookiesScanner } from './cookies';
import { DNSScanner } from './dns';
import { CORSScanner } from './cors';
import { RedirectsScanner } from './redirects';
import { TechnologyScanner } from './technology';
import { SecurityTxtScanner } from './security-txt';
import { RobotsTxtScanner } from './robots';
import { SCAN_CONFIG, validateScanUrl } from '@/lib/security';

export interface ScannerOptions {
  url: string;
  allowLocal?: boolean;
  scanId?: string;
  onProgress?: (progress: ScanProgress) => void;
}

const SCANNERS = [
  { name: 'URL Validation', key: 'url-validation', scanner: null as any },
  { name: 'HTTPS Check', key: 'https', scanner: new TLSScanner(SCAN_CONFIG) },
  { name: 'Security Headers', key: 'headers', scanner: new HeadersScanner(SCAN_CONFIG) },
  { name: 'Cookies', key: 'cookies', scanner: new CookiesScanner(SCAN_CONFIG) },
  { name: 'DNS', key: 'dns', scanner: new DNSScanner(SCAN_CONFIG) },
  { name: 'CORS', key: 'cors', scanner: new CORSScanner(SCAN_CONFIG) },
  { name: 'Technology Detection', key: 'technology', scanner: new TechnologyScanner(SCAN_CONFIG) },
  { name: 'security.txt', key: 'security-txt', scanner: new SecurityTxtScanner(SCAN_CONFIG) },
  { name: 'robots.txt', key: 'robots', scanner: new RobotsTxtScanner(SCAN_CONFIG) },
  { name: 'Redirect Analysis', key: 'redirects', scanner: new RedirectsScanner(SCAN_CONFIG) },
];

class TargetUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TargetUnreachableError';
  }
}

async function preflightCheck(normalizedUrl: string): Promise<void> {
  const url = new URL(normalizedUrl);
  const hostname = url.hostname;

  let resolved = false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const doh = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`,
        { signal: controller.signal }
      );
      const data = await doh.json() as { Status?: number; Answer?: unknown[] };
      resolved = data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
      if (!resolved && Array.isArray(data.Answer) && data.Answer.length > 0) {
        resolved = true;
      }
    } finally {
      clearTimeout(timer);
    }
  } catch {
    resolved = false;
  }

  if (!resolved) {
    try {
      const head = await fetch(`https://${hostname}/`, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': SCAN_CONFIG.userAgent }
      });
      resolved = head.status < 500;
    } catch {
      resolved = false;
    }
  }

  if (!resolved) {
    throw new TargetUnreachableError(
      `DNS resolution failed for "${hostname}" — domain does not exist or is not reachable. No scan was performed.`
    );
  }

  const errors: string[] = [];

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SCAN_CONFIG.timeout);
    try {
      const res = await fetch(normalizedUrl, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': SCAN_CONFIG.userAgent }
      });
      if (res.status >= 500) {
        errors.push(`server returned HTTP ${res.status}`);
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort') || msg.includes('Abort')) {
      errors.push(`connection timed out after ${SCAN_CONFIG.timeout}ms`);
    } else {
      errors.push(msg);
    }
  }

  if (errors.length > 0) {
    const httpsUrl = normalizedUrl.replace(/^http:/, 'https:');
    const altUrl = normalizedUrl.startsWith('https:')
      ? normalizedUrl.replace(/^https:/, 'http:')
      : httpsUrl;

    let altOk = false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(altUrl, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'manual',
          headers: { 'User-Agent': SCAN_CONFIG.userAgent }
        });
        altOk = res.status < 500;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      altOk = false;
    }

    if (!altOk) {
      throw new TargetUnreachableError(
        `Target is not reachable (${errors.join('; ')}). The website did not respond over HTTP or HTTPS. No scan was performed.`
      );
    }
  }
}

export async function runScan(options: ScannerOptions): Promise<ScanResult> {
  const scanId = options.scanId || `scan-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  const startTime = new Date();

  const validation = validateScanUrl(options.url, options.allowLocal);
  if (!validation.isValid || validation.blocked) {
    throw new Error(validation.error || validation.reason || 'Invalid URL');
  }

  const normalizedUrl = validation.url;

  options.onProgress?.({
    step: 'Reachability Check',
    completed: false,
    current: 0,
    total: SCANNERS.length + 1
  });

  await preflightCheck(normalizedUrl);

  options.onProgress?.({
    step: 'Reachability Check',
    completed: true,
    current: 1,
    total: SCANNERS.length + 1
  });

  const allFindings: ScanFinding[] = [];
  const totalSteps = SCANNERS.length;
  let completedModules = 0;

  for (let i = 0; i < SCANNERS.length; i++) {
    const step = SCANNERS[i];

    options.onProgress?.({
      step: step.name,
      completed: false,
      current: i + 2,
      total: totalSteps + 1
    });

    try {
      let findings: ScanFinding[] = [];

      if (step.key === 'url-validation') {
        findings.push({
          checkId: 'SEC-URL-001',
          category: 'URL Validation',
          title: 'URL Format Valid',
          severity: 'informational',
          status: 'pass',
          evidence: `Normalized URL: ${normalizedUrl}`,
          description: 'The provided URL has been validated and normalized.',
          impact: 'Valid URL format ensures consistent scanning.',
          recommendation: 'No action needed.'
        });
        findings.push({
          checkId: 'SEC-URL-002',
          category: 'URL Validation',
          title: 'Target Reachable',
          severity: 'informational',
          status: 'pass',
          evidence: `DNS resolved and HTTP response received from ${normalizedUrl}`,
          description: 'Preflight check confirmed the target host resolves and responds.',
          impact: 'Scan results below are based on live responses from the target.',
          recommendation: 'No action needed.'
        });
      } else if (step.scanner) {
        findings = await step.scanner.scan(normalizedUrl, SCAN_CONFIG);
      }

      const real = findings.filter(f => f.status !== 'not-verified');
      const unverified = findings.filter(f => f.status === 'not-verified');

      allFindings.push(...real);
      if (unverified.length > 0 && real.length === 0) {
        for (const f of unverified) {
          allFindings.push(f);
        }
      } else {
        for (const f of unverified) {
          allFindings.push(f);
        }
      }
      completedModules++;

      options.onProgress?.({
        step: step.name,
        completed: true,
        current: i + 2,
        total: totalSteps + 1
      });
    } catch (error) {
      console.error(`Scanner ${step.name} failed:`, error);
      allFindings.push({
        checkId: `SEC-ERR-${step.key.toUpperCase()}`,
        category: step.name,
        title: `${step.name} — Not Verified`,
        severity: 'informational',
        status: 'not-verified',
        evidence: error instanceof Error ? error.message : String(error),
        description: `The ${step.name} check could not be completed against the live target.`,
        impact: 'This check was skipped; no result is claimed.',
        recommendation: 'Ensure the target is accessible and try again.'
      });

      options.onProgress?.({
        step: step.name,
        completed: true,
        current: i + 2,
        total: totalSteps + 1
      });
    }
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  const securityScore = calculateSecurityScore(allFindings);
  const passedChecks = allFindings.filter(f => f.status === 'pass').length;
  const informationalCount = allFindings.filter(f => f.severity === 'informational').length;
  const lowCount = allFindings.filter(f => f.severity === 'low').length;
  const mediumCount = allFindings.filter(f => f.severity === 'medium').length;
  const highCount = allFindings.filter(f => f.severity === 'high').length;

  return {
    scanId,
    url: options.url,
    normalizedUrl,
    startTime,
    endTime,
    duration,
    status: 'completed',
    securityScore,
    totalChecks: allFindings.length,
    passedChecks,
    findings: allFindings,
    informationalCount,
    lowCount,
    mediumCount,
    highCount
  };
}

function calculateSecurityScore(findings: ScanFinding[]): number {
  const scorable = findings.filter(f => f.status !== 'not-verified' && f.status !== 'informational');
  if (scorable.length === 0) return 0;

  const severityWeight: Record<string, number> = {
    high: 4,
    medium: 3,
    low: 2,
    informational: 1
  };

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const finding of scorable) {
    const weight = severityWeight[finding.severity] || 1;
    totalWeight += weight;
    if (finding.status === 'pass') {
      earnedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;

  return Math.round((earnedWeight / totalWeight) * 100);
}

export function getSecurityScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Strong Configuration', color: 'text-emerald-600', bg: 'bg-emerald-500' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500' };
  if (score >= 50) return { label: 'Needs Improvement', color: 'text-amber-600', bg: 'bg-amber-500' };
  return { label: 'High Number of Configuration Issues', color: 'text-red-600', bg: 'bg-red-500' };
}