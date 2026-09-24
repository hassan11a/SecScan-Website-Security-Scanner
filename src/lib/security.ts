import { URL } from 'url';

export interface NormalizedUrl {
  url: string;
  hostname: string;
  protocol: string;
  port: string;
  isValid: boolean;
  error?: string;
}

export function normalizeUrl(input: string): NormalizedUrl {
  try {
    let url = input.trim();
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const parsed = new URL(url);
    
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        url: input,
        hostname: '',
        protocol: '',
        port: '',
        isValid: false,
        error: 'Only HTTP and HTTPS protocols are supported'
      };
    }
    
    const normalized = `${parsed.protocol}//${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}${parsed.search}`;
    
    return {
      url: normalized,
      hostname: parsed.hostname,
      protocol: parsed.protocol,
      port: parsed.port,
      isValid: true
    };
  } catch {
    return {
      url: input,
      hostname: '',
      protocol: '',
      port: '',
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

export function isPrivateIP(hostname: string): boolean {
  try {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^\[?([0-9a-fA-F:]+)\]?$/;
    
    let ip = hostname;
    if (ipv6Regex.test(hostname) && hostname.startsWith('[')) {
      ip = hostname.slice(1, -1);
    }
    
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.').map(Number);
      const [a, b, c, d] = parts;
      
      if (a === 10) return true;
      if (a === 172 && b >= 16 && b <= 31) return true;
      if (a === 192 && b === 168) return true;
      if (a === 127) return true;
      if (a === 169 && b === 254) return true;
      if (a === 0) return true;
      if (a >= 224) return true;
    }
    
    if (ip === '::1' || ip === 'fe80::' || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
      return true;
    }
    
    return false;
  } catch {
    return true;
  }
}

export function isLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === 'localhost' || lower === 'localhost.localdomain' || lower.endsWith('.local');
}

export function isBlockedHost(hostname: string, allowLocal: boolean = false): { blocked: boolean; reason?: string } {
  if (!allowLocal) {
    if (isLocalhost(hostname)) {
      return { blocked: true, reason: 'Localhost scanning is not allowed unless explicitly enabled for local lab testing' };
    }
    if (isPrivateIP(hostname)) {
      return { blocked: true, reason: 'Private/internal IP ranges are not allowed for scanning' };
    }
  }
  return { blocked: false };
}

export function validateScanUrl(url: string, allowLocal: boolean = false): NormalizedUrl & { blocked?: boolean; reason?: string } {
  const normalized = normalizeUrl(url);
  
  if (!normalized.isValid) {
    return { ...normalized, blocked: true, reason: normalized.error };
  }
  
  const blockCheck = isBlockedHost(normalized.hostname, allowLocal);
  if (blockCheck.blocked) {
    return { ...normalized, blocked: true, reason: blockCheck.reason };
  }
  
  return normalized;
}

export const SCAN_CONFIG = {
  timeout: 10000,
  maxRedirects: 10,
  maxResponseSize: 10 * 1024 * 1024,
  rateLimit: 100,
  userAgent: 'SecurityScanner/1.0 (+https://github.com/security-scanner)'
};

export function generateScanId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `scan-${timestamp}-${random}`;
}