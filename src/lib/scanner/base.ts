import { ScanFinding, Severity, CheckStatus, ScanConfig } from '@/types';

export interface ScannerModule {
  name: string;
  category: string;
  scan(target: string, config: ScanConfig): Promise<ScanFinding[]>;
}

export abstract class BaseScanner implements ScannerModule {
  abstract name: string;
  abstract category: string;
  
  protected config: ScanConfig;
  
  constructor(config: ScanConfig) {
    this.config = config;
  }
  
  abstract scan(target: string, config: ScanConfig): Promise<ScanFinding[]>;
  
  protected createFinding(
    checkId: string,
    title: string,
    severity: Severity,
    status: CheckStatus,
    evidence: string,
    description: string,
    impact: string,
    recommendation: string
  ): ScanFinding {
    return {
      checkId,
      category: this.category,
      title,
      severity,
      status,
      evidence,
      description,
      impact,
      recommendation
    };
  }
  
  protected async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': this.config.userAgent,
          ...options.headers
        },
        redirect: 'manual'
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  protected async fetchWithRedirects(url: string, options: RequestInit = {}): Promise<{ response: Response; redirectChain: string[] }> {
    let currentUrl = url;
    const redirectChain: string[] = [url];
    let redirectCount = 0;
    
    while (redirectCount < this.config.maxRedirects) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      try {
        const response = await fetch(currentUrl, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': this.config.userAgent,
            ...options.headers
          },
          redirect: 'manual'
        });
        
        clearTimeout(timeoutId);
        
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (location) {
            try {
              currentUrl = new URL(location, currentUrl).toString();
              redirectChain.push(currentUrl);
              redirectCount++;
              continue;
            } catch {
              break;
            }
          }
        }
        
        return { response, redirectChain };
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }
    
    throw new Error('Maximum redirects exceeded');
  }
}

export function createNotVerifiedFinding(checkId: string, title: string, error: string, category: string): ScanFinding {
  return {
    checkId,
    category,
    title,
    severity: 'informational',
    status: 'not-verified',
    evidence: `Unable to verify: ${error}`,
    description: `The check could not be completed due to an error: ${error}`,
    impact: 'Unable to determine security impact due to verification failure',
    recommendation: 'Ensure the target is accessible and try again. Check network connectivity and target availability.'
  };
}