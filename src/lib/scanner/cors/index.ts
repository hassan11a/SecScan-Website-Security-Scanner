import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, CORSResult } from '@/types';

export class CORSScanner extends BaseScanner {
  name = 'CORS Configuration Scanner';
  category = 'CORS';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const corsResult = await this.checkCORS(target);
      
      findings.push(this.createFinding(
        'SEC-CORS-001',
        'Access-Control-Allow-Origin',
        this.getOriginSeverity(corsResult.allowOrigin),
        corsResult.allowOrigin ? 'informational' : 'pass',
        corsResult.allowOrigin ? `Value: ${corsResult.allowOrigin}` : 'Header not present (same-origin only)',
        'The Access-Control-Allow-Origin header controls which origins can access resources cross-origin.',
        corsResult.allowOrigin === '*' 
          ? 'Wildcard (*) allows any website to make cross-origin requests, potentially exposing sensitive data.'
          : corsResult.allowOrigin
            ? 'Specific origin allowed for cross-origin access.'
            : 'No cross-origin access allowed (same-origin policy enforced).',
        corsResult.allowOrigin === '*'
          ? 'Restrict to specific trusted origins. Never use * for resources with credentials or sensitive data.'
          : corsResult.allowOrigin
            ? 'Ensure only trusted origins are allowed.'
            : 'Maintain same-origin policy for sensitive resources.'
      ));
      
      findings.push(this.createFinding(
        'SEC-CORS-002',
        'Access-Control-Allow-Credentials',
        corsResult.allowCredentials && corsResult.allowOrigin === '*' ? 'high' : 'informational',
        corsResult.allowCredentials ? 'informational' : 'pass',
        corsResult.allowCredentials ? 'true (credentials allowed)' : 'false or not set (credentials not allowed)',
        'The Access-Control-Allow-Credentials header indicates whether cookies/auth headers are included in cross-origin requests.',
        corsResult.allowCredentials && corsResult.allowOrigin === '*'
          ? 'CRITICAL: Allow-Credentials with wildcard origin is invalid and dangerous. Browsers will reject this combination.'
          : corsResult.allowCredentials
            ? 'Credentials are allowed for the specified origin. Ensure the origin is fully trusted.'
            : 'Credentials are not allowed cross-origin, which is the secure default.',
        corsResult.allowCredentials && corsResult.allowOrigin === '*'
          ? 'Remove Allow-Credentials or specify a concrete origin (not *).'
          : corsResult.allowCredentials
            ? 'Verify the allowed origin is trusted and requires credentialed access.'
            : 'Maintain current configuration.'
      ));
      
      if (corsResult.allowMethods) {
        findings.push(this.createFinding(
          'SEC-CORS-003',
          'Access-Control-Allow-Methods',
          'informational',
          'informational',
          `Allowed methods: ${corsResult.allowMethods}`,
          'Specifies which HTTP methods are allowed for cross-origin requests.',
          'Overly permissive methods (e.g., PUT, DELETE) may increase attack surface.',
          'Restrict to only required methods (typically GET, POST, OPTIONS).'
        ));
      }
      
      if (corsResult.allowHeaders) {
        findings.push(this.createFinding(
          'SEC-CORS-004',
          'Access-Control-Allow-Headers',
          'informational',
          'informational',
          `Allowed headers: ${corsResult.allowHeaders}`,
          'Specifies which headers can be used in cross-origin requests.',
          'Allowing sensitive headers (Authorization, Cookie) may increase risk.',
          'Only allow headers required by your application.'
        ));
      }
      
      if (corsResult.exposeHeaders) {
        findings.push(this.createFinding(
          'SEC-CORS-005',
          'Access-Control-Expose-Headers',
          'informational',
          'informational',
          `Exposed headers: ${corsResult.exposeHeaders}`,
          'Specifies which response headers are accessible to client-side JavaScript.',
          'Exposing sensitive headers may leak information.',
          'Only expose headers needed by the client application.'
        ));
      }
      
      if (corsResult.maxAge) {
        findings.push(this.createFinding(
          'SEC-CORS-006',
          'Access-Control-Max-Age',
          'informational',
          'informational',
          `Preflight cache duration: ${corsResult.maxAge} seconds`,
          'Specifies how long preflight results can be cached.',
          'Long cache times may delay propagation of CORS policy changes.',
          'Use reasonable values (e.g., 600-86400 seconds).'
        ));
      }
      
      for (const issue of corsResult.issues) {
        findings.push(this.createFinding(
          'SEC-CORS-007',
          'CORS Configuration Issue',
          'medium',
          'fail',
          issue,
          'A potential CORS misconfiguration was detected.',
          'CORS misconfigurations can lead to data leakage or unauthorized cross-origin access.',
          'Review and fix the CORS configuration according to security best practices.'
        ));
      }
      
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-CORS-GENERAL', 'CORS Configuration Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private async checkCORS(target: string): Promise<CORSResult> {
    const result: CORSResult = {
      allowOrigin: null,
      allowCredentials: false,
      allowMethods: null,
      allowHeaders: null,
      exposeHeaders: null,
      maxAge: null,
      issues: []
    };
    
    try {
      const origin = 'https://evil.example.com';
      const response = await this.fetchWithTimeout(target, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      const headers = this.normalizeHeaders(response.headers);
      
      result.allowOrigin = headers['access-control-allow-origin'] || null;
      result.allowCredentials = headers['access-control-allow-credentials']?.toLowerCase() === 'true';
      result.allowMethods = headers['access-control-allow-methods'] || null;
      result.allowHeaders = headers['access-control-allow-headers'] || null;
      result.exposeHeaders = headers['access-control-expose-headers'] || null;
      result.maxAge = headers['access-control-max-age'] || null;
      
      if (result.allowOrigin === '*') {
        result.issues.push('Wildcard (*) Access-Control-Allow-Origin allows any origin to access the resource');
        if (result.allowCredentials) {
          result.issues.push('CRITICAL: Allow-Credentials: true with wildcard origin is invalid - browsers will reject this');
        }
      } else if (result.allowOrigin && result.allowOrigin !== origin) {
        result.issues.push(`Server reflects a different origin (${result.allowOrigin}) than requested (${origin}) - possible misconfiguration`);
      } else if (result.allowOrigin === origin) {
        result.issues.push('Server reflects the request Origin header - this may indicate overly permissive configuration');
      }
      
      if (result.allowMethods) {
        const methods = result.allowMethods.toUpperCase().split(',').map(m => m.trim());
        const dangerous = ['PUT', 'DELETE', 'PATCH', 'TRACE', 'CONNECT'];
        const found = methods.filter(m => dangerous.includes(m));
        if (found.length > 0) {
          result.issues.push(`Potentially dangerous HTTP methods allowed: ${found.join(', ')}`);
        }
      }
      
      if (result.allowHeaders) {
        const headers = result.allowHeaders.toLowerCase().split(',').map(h => h.trim());
        const sensitive = ['authorization', 'cookie', 'x-csrf-token', 'x-requested-with'];
        const found = headers.filter(h => sensitive.includes(h));
        if (found.length > 0) {
          result.issues.push(`Sensitive headers allowed in CORS: ${found.join(', ')}`);
        }
      }
      
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
    
    return result;
  }
  
  private normalizeHeaders(headers: Headers): Record<string, string> {
    const normalized: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalized[key.toLowerCase()] = value;
    });
    return normalized;
  }
  
  private getOriginSeverity(origin: string | null): Severity {
    if (!origin) return 'informational';
    if (origin === '*') return 'high';
    if (origin.includes('*')) return 'medium';
    return 'low';
  }
}