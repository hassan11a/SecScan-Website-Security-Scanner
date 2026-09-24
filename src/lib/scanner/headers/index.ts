import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, SecurityHeadersResult, HeaderCheck } from '@/types';

export class HeadersScanner extends BaseScanner {
  name = 'Security Headers Scanner';
  category = 'Security Headers';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const { response } = await this.fetchWithRedirects(target, { method: 'HEAD' });
      const headers = this.normalizeHeaders(response.headers);
      const results = this.checkHeaders(headers);
      
      for (const [key, check] of Object.entries(results)) {
        const checkId = `SEC-HDR-${key.toUpperCase().replace(/-/g, '-')}`;
        
        if (check.present) {
          findings.push(this.createFinding(
            checkId,
            `${this.formatHeaderName(key)} Present`,
            'informational',
            'pass',
            `Header value: ${check.value}`,
            check.description,
            'This security header is properly configured.',
            'Maintain current configuration.'
          ));
        } else {
          const severity = this.getHeaderSeverity(key);
          findings.push(this.createFinding(
            checkId,
            `Missing ${this.formatHeaderName(key)}`,
            severity,
            'fail',
            'Header not present in response',
            check.description,
            check.impact,
            check.recommended
          ));
        }
      }
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-HDR-GENERAL', 'Security Headers Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private normalizeHeaders(headers: Headers): Record<string, string> {
    const normalized: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalized[key.toLowerCase()] = value;
    });
    return normalized;
  }
  
  private checkHeaders(headers: Record<string, string>): SecurityHeadersResult {
    const getHeader = (name: string): HeaderCheck => {
      const value = headers[name.toLowerCase()];
      return {
        present: !!value,
        value: value || null,
        recommended: this.getRecommendedValue(name),
        description: this.getHeaderDescription(name),
        impact: this.getHeaderImpact(name)
      };
    };
    
    return {
      'content-security-policy': getHeader('content-security-policy'),
      'strict-transport-security': getHeader('strict-transport-security'),
      'x-content-type-options': getHeader('x-content-type-options'),
      'x-frame-options': getHeader('x-frame-options'),
      'referrer-policy': getHeader('referrer-policy'),
      'permissions-policy': getHeader('permissions-policy'),
      'cross-origin-opener-policy': getHeader('cross-origin-opener-policy'),
      'cross-origin-resource-policy': getHeader('cross-origin-resource-policy')
    };
  }
  
  private getRecommendedValue(name: string): string {
    const recommendations: Record<string, string> = {
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin'
    };
    return recommendations[name] || '';
  }
  
  private getHeaderDescription(name: string): string {
    const descriptions: Record<string, string> = {
      'content-security-policy': 'Controls which resources the browser is allowed to load, preventing XSS and data injection attacks.',
      'strict-transport-security': 'Instructs browsers to only communicate with the server over HTTPS, preventing protocol downgrade attacks.',
      'x-content-type-options': 'Prevents browsers from MIME-sniffing a response away from the declared content-type.',
      'x-frame-options': 'Controls whether the page can be embedded in frames, preventing clickjacking attacks.',
      'referrer-policy': 'Controls how much referrer information is sent with requests.',
      'permissions-policy': 'Controls which browser features and APIs can be used in the document.',
      'cross-origin-opener-policy': 'Controls whether documents can share browsing context with cross-origin documents.',
      'cross-origin-resource-policy': 'Controls which origins can include the resource in a cross-origin request.'
    };
    return descriptions[name] || '';
  }
  
  private getHeaderImpact(name: string): string {
    const impacts: Record<string, string> = {
      'content-security-policy': 'Without CSP, the site is more vulnerable to XSS attacks and unauthorized resource loading.',
      'strict-transport-security': 'Without HSTS, browsers may allow HTTP connections, enabling SSL stripping attacks.',
      'x-content-type-options': 'Without this header, browsers may interpret files as different MIME types, leading to XSS.',
      'x-frame-options': 'Without frame protection, the site can be embedded in malicious pages for clickjacking.',
      'referrer-policy': 'Without a policy, full URLs may be leaked to third-party sites via the Referer header.',
      'permissions-policy': 'Without permissions policy, the site may inadvertently allow access to sensitive APIs.',
      'cross-origin-opener-policy': 'Without COOP, cross-origin documents may access window references, enabling side-channel attacks.',
      'cross-origin-resource-policy': 'Without CORP, resources may be loaded by unauthorized origins, enabling speculative execution attacks.'
    };
    return impacts[name] || '';
  }
  
  private getHeaderSeverity(name: string): Severity {
    const severities: Record<string, Severity> = {
      'content-security-policy': 'high',
      'strict-transport-security': 'medium',
      'x-content-type-options': 'medium',
      'x-frame-options': 'medium',
      'referrer-policy': 'low',
      'permissions-policy': 'low',
      'cross-origin-opener-policy': 'low',
      'cross-origin-resource-policy': 'low'
    };
    return severities[name] || 'informational';
  }
  
  private formatHeaderName(name: string): string {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  }
}