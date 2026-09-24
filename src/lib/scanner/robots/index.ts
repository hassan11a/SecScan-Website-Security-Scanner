import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, RobotsTxtResult } from '@/types';

export class RobotsTxtScanner extends BaseScanner {
  name = 'robots.txt Scanner';
  category = 'robots.txt';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const url = new URL(target);
      const baseUrl = `${url.protocol}//${url.host}`;
      const robotsUrl = `${baseUrl}/robots.txt`;
      
      const result = await this.checkRobotsTxt(robotsUrl);
      
      if (result.found) {
        findings.push(this.createFinding(
          'SEC-ROBOTS-001',
          'robots.txt Found',
          'informational',
          'pass',
          `Found at: ${robotsUrl}`,
          'The robots.txt file instructs web crawlers which parts of the site should not be indexed.',
          'robots.txt is publicly accessible and may reveal sensitive paths that administrators prefer not to be indexed.',
          'Review robots.txt for sensitive path disclosure. Do not rely on robots.txt for access control - use authentication instead.'
        ));
        
        if (result.disallowedPaths.length > 0) {
          findings.push(this.createFinding(
            'SEC-ROBOTS-002',
            'Disallowed Paths',
            'informational',
            'informational',
            `Disallowed paths: ${result.disallowedPaths.slice(0, 20).join(', ')}${result.disallowedPaths.length > 20 ? '...' : ''}`,
            'Paths listed in Disallow directives that crawlers should not access.',
            'Disallowed paths may reveal administrative interfaces, backup files, or other sensitive locations.',
            'Ensure disallowed paths are not the only protection for sensitive resources. Use proper authentication.'
          ));
        }
        
        if (result.allowedPaths.length > 0) {
          findings.push(this.createFinding(
            'SEC-ROBOTS-003',
            'Explicitly Allowed Paths',
            'informational',
            'informational',
            `Allowed paths: ${result.allowedPaths.join(', ')}`,
            'Paths explicitly allowed via Allow directives (often to override broader Disallow rules).',
            'Allowed paths within disallowed directories may indicate specific resources intended for crawling.',
            'Review allowed paths for appropriateness.'
          ));
        }
        
        if (result.sitemaps.length > 0) {
          findings.push(this.createFinding(
            'SEC-ROBOTS-004',
            'Sitemap References',
            'informational',
            'informational',
            `Sitemaps: ${result.sitemaps.join(', ')}`,
            'Sitemap URLs declared in robots.txt for search engine discovery.',
            'Sitemaps help search engines discover content but may also reveal site structure.',
            'Ensure sitemaps do not contain sensitive URLs.'
          ));
        }
        
        findings.push(this.createFinding(
          'SEC-ROBOTS-005',
          'Full robots.txt Content',
          'informational',
          'informational',
          result.content || 'Content not available',
          'Complete content of the robots.txt file for review.',
          'Allows manual analysis of all directives.',
          'Review all directives for appropriateness and potential information disclosure.'
        ));
        
      } else {
        findings.push(this.createFinding(
          'SEC-ROBOTS-001',
          'robots.txt Not Found',
          'informational',
          'informational',
          `No robots.txt found at ${robotsUrl}`,
          'The robots.txt file is not present. This is not a vulnerability.',
          'Without robots.txt, crawlers will attempt to index all accessible content.',
          'Create a robots.txt if you need to control crawler behavior. Not having one is not a security issue.'
        ));
      }
      
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-ROBOTS-GENERAL', 'robots.txt Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private async checkRobotsTxt(url: string): Promise<RobotsTxtResult> {
    const result: RobotsTxtResult = {
      found: false,
      content: null,
      disallowedPaths: [],
      allowedPaths: [],
      sitemaps: []
    };
    
    try {
      const response = await this.fetchWithTimeout(url, { method: 'GET' });
      
      if (response.ok) {
        const text = await response.text();
        result.found = true;
        result.content = text;
        
        const lines = text.split('\n');
        let currentUserAgent = '*';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const [directive, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          const lowerDirective = directive.toLowerCase().trim();
          
          switch (lowerDirective) {
            case 'user-agent':
              currentUserAgent = value.toLowerCase();
              break;
            case 'disallow':
              if (value && currentUserAgent === '*') {
                result.disallowedPaths.push(value);
              }
              break;
            case 'allow':
              if (value && currentUserAgent === '*') {
                result.allowedPaths.push(value);
              }
              break;
            case 'sitemap':
              result.sitemaps.push(value);
              break;
          }
        }
      }
    } catch (error) {
      console.error('robots.txt check error:', error);
    }
    
    return result;
  }
}