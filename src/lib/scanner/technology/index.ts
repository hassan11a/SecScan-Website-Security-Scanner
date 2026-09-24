import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, TechnologyResult } from '@/types';

export class TechnologyScanner extends BaseScanner {
  name = 'Technology Detection Scanner';
  category = 'Technology Detection';
  
  private signatures = {
    webServer: [
      { pattern: /nginx/i, name: 'nginx' },
      { pattern: /apache/i, name: 'Apache' },
      { pattern: /IIS/i, name: 'Microsoft IIS' },
      { pattern: /lighttpd/i, name: 'lighttpd' },
      { pattern: /openresty/i, name: 'OpenResty' },
      { pattern: /cloudflare/i, name: 'Cloudflare' },
      { pattern: /AkamaiGHost/i, name: 'Akamai' },
      { pattern: /Varnish/i, name: 'Varnish' },
      { pattern: /Caddy/i, name: 'Caddy' }
    ],
    framework: [
      { pattern: /\bexpress(?:\.js)?\b/i, name: 'Express.js' },
      { pattern: /\bnext\.?js\b|_next\/static/i, name: 'Next.js' },
      { pattern: /\bnuxt\b/i, name: 'Nuxt.js' },
      { pattern: /\bdjango\b/i, name: 'Django' },
      { pattern: /\brails\b|action.?controller/i, name: 'Ruby on Rails' },
      { pattern: /\blaravel\b/i, name: 'Laravel' },
      { pattern: /\bx-spring\b|spring.?framework/i, name: 'Spring' },
      { pattern: /\basp\.net\b|x-aspnet/i, name: 'ASP.NET' },
      { pattern: /\bflask\b/i, name: 'Flask' },
      { pattern: /\bfastapi\b/i, name: 'FastAPI' },
      { pattern: /\bgo-gin\b|gin\/v\d/i, name: 'Gin' },
      { pattern: /\bfiber\b(?:\/v\d)?/i, name: 'Fiber' }
    ],
    cms: [
      { pattern: /\bwordpress\b|wp-content|wp-includes/i, name: 'WordPress' },
      { pattern: /\bdrupal\b/i, name: 'Drupal' },
      { pattern: /\bjoomla\b/i, name: 'Joomla' },
      { pattern: /\bmagento\b/i, name: 'Magento' },
      { pattern: /\bshopify\b/i, name: 'Shopify' },
      { pattern: /\bwix\.com\b/i, name: 'Wix' },
      { pattern: /\bsquarespace\b/i, name: 'Squarespace' },
      { pattern: /\bghost\b(?:-frontend)?/i, name: 'Ghost' },
      { pattern: /\bstrapi\b/i, name: 'Strapi' },
      { pattern: /\bcontentful\b/i, name: 'Contentful' }
    ],
    javascript: [
      { pattern: /\breact(?:-dom)?\b|data-reactroot|__react/i, name: 'React' },
      { pattern: /\bvue(?:\.js|js)?\b|data-v-[a-f0-9]/i, name: 'Vue.js' },
      { pattern: /\bangular(?:js)?\b|ng-app|ng-controller/i, name: 'Angular' },
      { pattern: /\bsvelte\b/i, name: 'Svelte' },
      { pattern: /\bjquery\b/i, name: 'jQuery' },
      { pattern: /\bbootstrap\b/i, name: 'Bootstrap' },
      { pattern: /\btailwind\b/i, name: 'Tailwind CSS' },
      { pattern: /\bwebpack\b/i, name: 'Webpack' },
      { pattern: /\bvite\b/i, name: 'Vite' },
      { pattern: /\bastro\b/i, name: 'Astro' },
      { pattern: /\bremix\b/i, name: 'Remix' }
    ],
    cdn: [
      { pattern: /\bcloudflare\b|cf-ray/i, name: 'Cloudflare' },
      { pattern: /\bakamai\b/i, name: 'Akamai' },
      { pattern: /\bfastly\b/i, name: 'Fastly' },
      { pattern: /\bcloudfront\b|x-amz-cf/i, name: 'Amazon CloudFront' },
      { pattern: /\bazure cdn\b|azureedge/i, name: 'Azure CDN' },
      { pattern: /\bgoogleusercontent\b|gcdn/i, name: 'Google Cloud CDN' },
      { pattern: /\bmaxcdn\b|netdna/i, name: 'MaxCDN/StackPath' },
      { pattern: /\bkeycdn\b/i, name: 'KeyCDN' },
      { pattern: /\bbunnycdn\b/i, name: 'BunnyCDN' }
    ]
  };
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const { response } = await this.fetchWithRedirects(target, { method: 'GET' });
      const html = await response.text();
      const headers = this.normalizeHeaders(response.headers);
      
      const techResult = this.detectTechnology(headers, html);
      
      if (techResult.webServer) {
        findings.push(this.createFinding(
          'SEC-TECH-001',
          'Web Server Detected',
          'informational',
          'informational',
          `Web Server: ${techResult.webServer}`,
          'Identified the web server software from response headers.',
          'Web server version disclosure may aid attackers in targeting known vulnerabilities.',
          'Configure server to hide version information (e.g., ServerTokens Prod in Apache, server_tokens off in nginx).'
        ));
      } else {
        findings.push(this.createFinding(
          'SEC-TECH-001',
          'Web Server Not Detected',
          'informational',
          'informational',
          'Web server could not be identified from headers',
          'No recognizable web server signature found in response headers.',
          'Hiding server information reduces information disclosure.',
          'Maintain current configuration.'
        ));
      }
      
      if (techResult.framework) {
        findings.push(this.createFinding(
          'SEC-TECH-002',
          'Framework Detected',
          'informational',
          'informational',
          `Framework: ${techResult.framework}`,
          'Identified the backend framework from headers or HTML patterns.',
          'Framework identification helps attackers target framework-specific vulnerabilities.',
          'Remove or obfuscate framework-identifying headers (X-Powered-By, etc.).'
        ));
      }
      
      if (techResult.cms) {
        findings.push(this.createFinding(
          'SEC-TECH-003',
          'CMS Detected',
          'informational',
          'informational',
          `CMS: ${techResult.cms}`,
          'Identified the Content Management System from headers or HTML patterns.',
          'CMS identification helps attackers target CMS-specific vulnerabilities and plugins.',
          'Keep CMS and plugins updated. Hide version information where possible.'
        ));
      }
      
      if (techResult.javascriptFrameworks.length > 0) {
        findings.push(this.createFinding(
          'SEC-TECH-004',
          'JavaScript Frameworks Detected',
          'informational',
          'informational',
          `Frameworks: ${techResult.javascriptFrameworks.join(', ')}`,
          'Identified frontend JavaScript frameworks from HTML and script sources.',
          'Framework version information may aid in targeting client-side vulnerabilities.',
          'Keep frameworks updated. Consider using Subresource Integrity (SRI) for third-party scripts.'
        ));
      }
      
      if (techResult.cdn) {
        findings.push(this.createFinding(
          'SEC-TECH-005',
          'CDN Detected',
          'informational',
          'informational',
          `CDN: ${techResult.cdn}`,
          'Identified the Content Delivery Network from headers.',
          'CDN provides DDoS protection and performance benefits.',
          'Ensure CDN security features (WAF, DDoS protection) are enabled.'
        ));
      }
      
      const interestingHeaders = this.findInterestingHeaders(headers);
      for (const [header, value] of interestingHeaders) {
        findings.push(this.createFinding(
          'SEC-TECH-006',
          `Interesting Header: ${header}`,
          'informational',
          'informational',
          `${header}: ${value}`,
          `The ${header} header was found in the response.`,
          'Some headers may disclose internal information or technology stack details.',
          'Review if this header is necessary. Remove or obfuscate if not required.'
        ));
      }
      
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-TECH-GENERAL', 'Technology Detection Check', String(error), this.category));
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
  
  private detectTechnology(headers: Record<string, string>, html: string): TechnologyResult {
    const result: TechnologyResult = {
      webServer: null,
      framework: null,
      cms: null,
      javascriptFrameworks: [],
      cdn: null,
      headers
    };
    
    const headerText = JSON.stringify(headers);
    const htmlSample = html.substring(0, 50000);
    const combinedText = headerText + ' ' + htmlSample;
    
    for (const sig of this.signatures.webServer) {
      if (sig.pattern.test(headerText)) {
        result.webServer = sig.name;
        break;
      }
    }
    
    for (const sig of this.signatures.framework) {
      if (sig.pattern.test(combinedText)) {
        result.framework = sig.name;
        break;
      }
    }
    
    for (const sig of this.signatures.cms) {
      if (sig.pattern.test(combinedText)) {
        result.cms = sig.name;
        break;
      }
    }
    
    for (const sig of this.signatures.javascript) {
      if (sig.pattern.test(combinedText)) {
        result.javascriptFrameworks.push(sig.name);
      }
    }
    
    for (const sig of this.signatures.cdn) {
      if (sig.pattern.test(headerText)) {
        result.cdn = sig.name;
        break;
      }
    }
    
    return result;
  }
  
  private findInterestingHeaders(headers: Record<string, string>): [string, string][] {
    const interesting = [
      'x-powered-by',
      'x-generator',
      'x-drupal-cache',
      'x-varnish',
      'x-amz-cf-id',
      'x-cache',
      'cf-ray',
      'server-timing',
      'x-runtime',
      'x-request-id',
      'x-content-digest',
      'x-github-request-id'
    ];
    
    return interesting
      .filter(h => headers[h])
      .map(h => [h, headers[h]]);
  }
}