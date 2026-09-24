import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, RedirectResult, RedirectStep } from '@/types';

export class RedirectsScanner extends BaseScanner {
  name = 'Redirect Analysis Scanner';
  category = 'Redirects';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const redirectResult = await this.analyzeRedirects(target);
      
      findings.push(this.createFinding(
        'SEC-REDIR-001',
        'Redirect Chain',
        'informational',
        'pass',
        redirectResult.chain.length > 1 
          ? `Chain length: ${redirectResult.chain.length} hops`
          : 'No redirects (direct response)',
        'Analyzes the HTTP redirect chain from initial request to final destination.',
        'Long redirect chains increase latency and may indicate configuration issues.',
        redirectResult.chain.length > 5 
          ? 'Consider reducing redirect chain length for better performance.'
          : 'Redirect chain length is acceptable.'
      ));
      
      if (redirectResult.chain.length > 1) {
        const chainDetails = redirectResult.chain.map((step, i) => 
          `${i + 1}. ${step.from} → ${step.to} (${step.statusCode})`
        ).join('\n');
        
        findings.push(this.createFinding(
          'SEC-REDIR-002',
          'Redirect Chain Details',
          'informational',
          'informational',
          chainDetails,
          'Detailed view of each redirect in the chain.',
          'Each redirect adds latency and potential failure points.',
          'Review chain for unnecessary hops.'
        ));
      }
      
      findings.push(this.createFinding(
        'SEC-REDIR-003',
        'HTTP to HTTPS Redirect',
        redirectResult.httpToHttps ? 'informational' : 'medium',
        redirectResult.httpToHttps ? 'pass' : 'fail',
        redirectResult.httpToHttps 
          ? 'HTTP requests redirect to HTTPS'
          : 'No HTTP to HTTPS redirect detected',
        'Checks if the site properly redirects HTTP traffic to HTTPS.',
        redirectResult.httpToHttps
          ? 'Users are automatically directed to the secure version.'
          : 'Users accessing via HTTP remain on unencrypted connection.',
        redirectResult.httpToHttps
          ? 'Maintain HTTPS redirect configuration.'
          : 'Configure web server to redirect all HTTP traffic to HTTPS (301/308).'
      ));
      
      if (redirectResult.suspiciousRedirects.length > 0) {
        for (const suspicious of redirectResult.suspiciousRedirects) {
          findings.push(this.createFinding(
            'SEC-REDIR-004',
            'Suspicious External Redirect',
            'high',
            'fail',
            suspicious,
            'Detected a redirect to an external domain that may be unexpected.',
            'Unexpected external redirects can indicate compromise or misconfiguration, potentially leading to phishing or malware delivery.',
            'Investigate the redirect source. Ensure all redirects are intentional and point to trusted domains.'
          ));
        }
      }
      
      if (redirectResult.redirectLoop) {
        findings.push(this.createFinding(
          'SEC-REDIR-005',
          'Redirect Loop Detected',
          'high',
          'fail',
          'Redirect loop detected in the chain',
          'The redirect chain contains a loop that would cause browsers to fail loading the page.',
          'Redirect loops break site accessibility and indicate configuration errors.',
          'Fix the redirect configuration to remove the loop.'
        ));
      }
      
      findings.push(this.createFinding(
        'SEC-REDIR-006',
        'Final Destination',
        'informational',
        'pass',
        `Final URL: ${redirectResult.finalDestination}`,
        'The final URL after following all redirects.',
        'The final destination should match the expected target.',
        'Verify the final destination is the intended target.'
      ));
      
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-REDIR-GENERAL', 'Redirect Analysis Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private async analyzeRedirects(target: string): Promise<RedirectResult> {
    const result: RedirectResult = {
      chain: [],
      finalDestination: target,
      httpToHttps: false,
      suspiciousRedirects: [],
      redirectLoop: false
    };
    
    const visited = new Set<string>();
    let currentUrl = target;
    let redirectCount = 0;
    const maxRedirects = Math.min(this.config.maxRedirects, 20);
    const initialHostname = new URL(target).hostname;
    
    while (redirectCount < maxRedirects) {
      if (visited.has(currentUrl)) {
        result.redirectLoop = true;
        break;
      }
      visited.add(currentUrl);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          signal: controller.signal,
          headers: { 'User-Agent': this.config.userAgent },
          redirect: 'manual'
        });
        
        clearTimeout(timeoutId);
        
        const statusCode = response.status;
        const location = response.headers.get('location');
        
        if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
          let nextUrl: string;
          try {
            nextUrl = new URL(location, currentUrl).toString();
          } catch {
            break;
          }
          
          const fromHostname = new URL(currentUrl).hostname;
          const toHostname = new URL(nextUrl).hostname;
          
          const step: RedirectStep = {
            from: currentUrl,
            to: nextUrl,
            statusCode
          };
          
          result.chain.push(step);
          
          if (fromHostname !== toHostname) {
            if (redirectCount === 0 && currentUrl.startsWith('http:') && nextUrl.startsWith('https:') && fromHostname === toHostname) {
              result.httpToHttps = true;
            } else if (fromHostname !== toHostname) {
              result.suspiciousRedirects.push(
                `Redirect from ${fromHostname} to external domain ${toHostname} (${currentUrl} → ${nextUrl})`
              );
            }
          }
          
          currentUrl = nextUrl;
          redirectCount++;
        } else {
          result.finalDestination = currentUrl;
          break;
        }
      } catch (error) {
        if (result.chain.length === 0) {
          throw error instanceof Error ? error : new Error(String(error));
        }
        console.error('Redirect analysis error:', error);
        break;
      }
    }
    
    if (redirectCount >= maxRedirects) {
      result.suspiciousRedirects.push(`Maximum redirects (${maxRedirects}) exceeded - possible redirect loop`);
    }
    
    return result;
  }
}