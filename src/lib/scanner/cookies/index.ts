import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, CookieResult } from '@/types';

export class CookiesScanner extends BaseScanner {
  name = 'Cookie Security Scanner';
  category = 'Cookies';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const { response } = await this.fetchWithRedirects(target, { method: 'GET' });
      const cookies = this.parseCookies(response.headers.get('set-cookie') || '');
      
      if (cookies.length === 0) {
        findings.push(this.createFinding(
          'SEC-CK-001',
          'No Cookies Set',
          'informational',
          'pass',
          'No Set-Cookie headers found in response',
          'The website does not set any cookies on the initial response.',
          'No cookie-related security concerns on initial load.',
          'No action needed if cookies are not required. If cookies are used, ensure they are set securely.'
        ));
        return findings;
      }
      
      for (const cookie of cookies) {
        findings.push(...this.analyzeCookie(cookie));
      }
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-CK-GENERAL', 'Cookie Security Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private parseCookies(setCookieHeader: string): CookieResult[] {
    const cookies: CookieResult[] = [];
    const cookieStrings = this.splitCookies(setCookieHeader);
    
    for (const cookieStr of cookieStrings) {
      const cookie = this.parseCookie(cookieStr);
      if (cookie) cookies.push(cookie);
    }
    
    return cookies;
  }
  
  private splitCookies(header: string): string[] {
    const cookies: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < header.length; i++) {
      const char = header[i];
      if (char === '"' && header[i - 1] !== '\\') {
        inQuotes = !inQuotes;
      }
      if (char === ',' && !inQuotes) {
        cookies.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) cookies.push(current.trim());
    
    return cookies;
  }
  
  private parseCookie(cookieStr: string): CookieResult | null {
    const parts = cookieStr.split(';').map(p => p.trim());
    if (parts.length === 0) return null;
    
    const [nameValue, ...attributes] = parts;
    const eqIndex = nameValue.indexOf('=');
    if (eqIndex === -1) return null;
    
    const name = nameValue.substring(0, eqIndex).trim();
    const value = nameValue.substring(eqIndex + 1).trim();
    
    const cookie: CookieResult = {
      name,
      value,
      secure: false,
      httpOnly: false,
      sameSite: 'unknown',
      domain: '',
      path: '/',
      expires: null,
      maxAge: null
    };
    
    for (const attr of attributes) {
      const lower = attr.toLowerCase();
      if (lower === 'secure') cookie.secure = true;
      else if (lower === 'httponly') cookie.httpOnly = true;
      else if (lower.startsWith('samesite=')) {
        const value = attr.split('=')[1]?.toLowerCase();
        if (value === 'strict' || value === 'lax' || value === 'none') {
          cookie.sameSite = value;
        }
      }
      else if (lower.startsWith('domain=')) {
        cookie.domain = attr.split('=')[1] || '';
      }
      else if (lower.startsWith('path=')) {
        cookie.path = attr.split('=')[1] || '/';
      }
      else if (lower.startsWith('expires=')) {
        cookie.expires = attr.substring(8).trim();
      }
      else if (lower.startsWith('max-age=')) {
        cookie.maxAge = parseInt(attr.split('=')[1] || '0', 10);
      }
    }
    
    return cookie;
  }
  
  private analyzeCookie(cookie: CookieResult): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const prefix = `SEC-CK-${cookie.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    
    if (!cookie.secure) {
      findings.push(this.createFinding(
        `${prefix}-001`,
        `Cookie "${cookie.name}" Missing Secure Flag`,
        'medium',
        'fail',
        `Cookie "${cookie.name}" does not have the Secure attribute`,
        'The Secure flag ensures the cookie is only sent over HTTPS connections.',
        'Without Secure flag, the cookie can be transmitted over unencrypted HTTP, exposing it to interception.',
        'Add the Secure attribute to the cookie. Ensure the site is fully HTTPS before enabling.'
      ));
    } else {
      findings.push(this.createFinding(
        `${prefix}-001`,
        `Cookie "${cookie.name}" Has Secure Flag`,
        'informational',
        'pass',
        `Cookie "${cookie.name}" has the Secure attribute`,
        'The cookie is only transmitted over HTTPS.',
        'Cookie is protected from transmission over unencrypted connections.',
        'Maintain current configuration.'
      ));
    }
    
    if (!cookie.httpOnly) {
      findings.push(this.createFinding(
        `${prefix}-002`,
        `Cookie "${cookie.name}" Missing HttpOnly Flag`,
        'medium',
        'fail',
        `Cookie "${cookie.name}" does not have the HttpOnly attribute`,
        'The HttpOnly flag prevents client-side JavaScript from accessing the cookie.',
        'Without HttpOnly, cookies are accessible via document.cookie, increasing XSS impact.',
        'Add the HttpOnly attribute to the cookie unless JavaScript access is explicitly required.'
      ));
    } else {
      findings.push(this.createFinding(
        `${prefix}-002`,
        `Cookie "${cookie.name}" Has HttpOnly Flag`,
        'informational',
        'pass',
        `Cookie "${cookie.name}" has the HttpOnly attribute`,
        'The cookie cannot be accessed via JavaScript.',
        'Cookie is protected from XSS-based theft.',
        'Maintain current configuration.'
      ));
    }
    
    if (cookie.sameSite === 'unknown' || cookie.sameSite === 'none') {
      const severity = cookie.sameSite === 'none' && cookie.secure ? 'low' : 'medium';
      findings.push(this.createFinding(
        `${prefix}-003`,
        `Cookie "${cookie.name}" SameSite Configuration`,
        severity,
        cookie.sameSite === 'unknown' ? 'fail' : 'informational',
        `Cookie "${cookie.name}" SameSite: ${cookie.sameSite}`,
        'The SameSite attribute controls cross-site request forgery (CSRF) protection.',
        cookie.sameSite === 'none' 
          ? 'SameSite=None with Secure allows cross-site requests but requires HTTPS.'
          : 'Without SameSite, the cookie is sent with cross-site requests, enabling CSRF attacks.',
        'Set SameSite=Strict for maximum CSRF protection, or SameSite=Lax for a balance of security and usability.'
      ));
    } else {
      findings.push(this.createFinding(
        `${prefix}-003`,
        `Cookie "${cookie.name}" Has SameSite=${cookie.sameSite}`,
        'informational',
        'pass',
        `Cookie "${cookie.name}" has SameSite=${cookie.sameSite}`,
        'The cookie has CSRF protection via SameSite attribute.',
        `${cookie.sameSite === 'strict' ? 'Strict' : 'Lax'} SameSite provides CSRF protection.`,
        'Maintain current configuration.'
      ));
    }
    
    if (cookie.domain && !cookie.domain.startsWith('.')) {
      findings.push(this.createFinding(
        `${prefix}-004`,
        `Cookie "${cookie.name}" Domain Scope`,
        'low',
        'informational',
        `Cookie domain: ${cookie.domain}`,
        'The Domain attribute controls which hosts receive the cookie.',
        'Overly broad domain settings may expose cookies to subdomains unnecessarily.',
        'Restrict the Domain attribute to the minimum required scope.'
      ));
    }
    
    if (cookie.expires) {
      const expDate = new Date(cookie.expires);
      const now = new Date();
      if (expDate > now) {
        const days = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 365) {
          findings.push(this.createFinding(
            `${prefix}-005`,
            `Cookie "${cookie.name}" Long Expiration`,
            'low',
            'informational',
            `Cookie expires in ${days} days (${cookie.expires})`,
            'Long-lived cookies increase the window of exposure if compromised.',
            'Long expiration increases risk if cookie is stolen.',
            'Consider shorter expiration periods (e.g., 30-90 days) for session cookies.'
          ));
        }
      }
    }
    
    return findings;
  }
}