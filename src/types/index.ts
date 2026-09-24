export type Severity = 'informational' | 'low' | 'medium' | 'high';
export type CheckStatus = 'pass' | 'fail' | 'informational' | 'not-verified';

export interface ScanFinding {
  checkId: string;
  category: string;
  title: string;
  severity: Severity;
  status: CheckStatus;
  evidence: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface ScanResult {
  scanId: string;
  url: string;
  normalizedUrl: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'failed' | 'in-progress';
  securityScore: number;
  totalChecks: number;
  passedChecks: number;
  findings: ScanFinding[];
  informationalCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
}

export interface ScanHistoryItem {
  id: string;
  scanId: string;
  url: string;
  dateTime: Date;
  securityScore: number;
  findingCount: number;
  status: 'completed' | 'failed';
}

export interface SecurityHeadersResult {
  'content-security-policy': HeaderCheck;
  'strict-transport-security': HeaderCheck;
  'x-content-type-options': HeaderCheck;
  'x-frame-options': HeaderCheck;
  'referrer-policy': HeaderCheck;
  'permissions-policy': HeaderCheck;
  'cross-origin-opener-policy': HeaderCheck;
  'cross-origin-resource-policy': HeaderCheck;
}

export interface HeaderCheck {
  present: boolean;
  value: string | null;
  recommended: string;
  description: string;
  impact: string;
}

export interface TLSResult {
  httpsAvailable: boolean;
  httpToHttpsRedirect: boolean;
  certificateValid: boolean;
  certificateExpiration: string | null;
  hostnameMatch: boolean;
  tlsVersion: string | null;
  cipherSuite: string | null;
  issuer: string | null;
}

export interface CookieResult {
  name: string;
  value: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none' | 'unknown';
  domain: string;
  path: string;
  expires: string | null;
  maxAge: number | null;
}

export interface DNSResult {
  a: string[];
  aaaa: string[];
  cname: string[];
  mx: string[];
  ns: string[];
  txt: string[];
  spf: string | null;
  dmarc: string | null;
}

export interface TechnologyResult {
  webServer: string | null;
  framework: string | null;
  cms: string | null;
  javascriptFrameworks: string[];
  cdn: string | null;
  headers: Record<string, string>;
}

export interface SecurityTxtResult {
  found: boolean;
  contact: string | null;
  policy: string | null;
  encryption: string | null;
  expires: string | null;
  raw: string | null;
}

export interface RobotsTxtResult {
  found: boolean;
  content: string | null;
  disallowedPaths: string[];
  allowedPaths: string[];
  sitemaps: string[];
}

export interface CORSResult {
  allowOrigin: string | null;
  allowCredentials: boolean;
  allowMethods: string | null;
  allowHeaders: string | null;
  exposeHeaders: string | null;
  maxAge: string | null;
  issues: string[];
}

export interface RedirectResult {
  chain: RedirectStep[];
  finalDestination: string;
  httpToHttps: boolean;
  suspiciousRedirects: string[];
  redirectLoop: boolean;
}

export interface RedirectStep {
  from: string;
  to: string;
  statusCode: number;
}

export interface ScanProgress {
  step: string;
  completed: boolean;
  current: number;
  total: number;
}

export interface ScanConfig {
  timeout: number;
  maxRedirects: number;
  maxResponseSize: number;
  rateLimit: number;
  userAgent: string;
}