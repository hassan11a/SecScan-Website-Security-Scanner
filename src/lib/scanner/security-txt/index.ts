import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, SecurityTxtResult } from '@/types';

export class SecurityTxtScanner extends BaseScanner {
  name = 'security.txt Scanner';
  category = 'security.txt';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const url = new URL(target);
      const baseUrl = `${url.protocol}//${url.host}`;
      const securityTxtUrl = `${baseUrl}/.well-known/security.txt`;
      
      const result = await this.checkSecurityTxt(securityTxtUrl);
      
      if (result.found) {
        findings.push(this.createFinding(
          'SEC-STXT-001',
          'security.txt Found',
          'informational',
          'pass',
          `Found at: ${securityTxtUrl}`,
          'The security.txt file provides a standardized way for security researchers to report vulnerabilities.',
          'Having security.txt facilitates responsible disclosure and improves security posture.',
          'Maintain the security.txt file with up-to-date contact information.'
        ));
        
        if (result.contact) {
          findings.push(this.createFinding(
            'SEC-STXT-002',
            'Contact Information',
            'informational',
            'informational',
            `Contact: ${result.contact}`,
            'The contact field specifies how security researchers can reach you.',
            'Clear contact information enables responsible vulnerability disclosure.',
            'Ensure contact information is current and monitored.'
          ));
        }
        
        if (result.policy) {
          findings.push(this.createFinding(
            'SEC-STXT-003',
            'Policy Link',
            'informational',
            'informational',
            `Policy: ${result.policy}`,
            'The policy field links to your vulnerability disclosure policy.',
            'A clear policy sets expectations for researchers and legal protections.',
            'Maintain an up-to-date vulnerability disclosure policy.'
          ));
        }
        
        if (result.encryption) {
          findings.push(this.createFinding(
            'SEC-STXT-004',
            'Encryption Key',
            'informational',
            'informational',
            `Encryption: ${result.encryption}`,
            'The encryption field provides a PGP key for encrypted vulnerability reports.',
            'Encrypted reports protect sensitive vulnerability details during disclosure.',
            'Keep the PGP key current and revoke compromised keys.'
          ));
        }
        
        if (result.expires) {
          const expiresDate = new Date(result.expires);
          const now = new Date();
          const isExpired = expiresDate < now;
          
          findings.push(this.createFinding(
            'SEC-STXT-005',
            'Expiration Date',
            isExpired ? 'medium' : 'informational',
            isExpired ? 'fail' : 'pass',
            `Expires: ${result.expires} ${isExpired ? '(EXPIRED)' : ''}`,
            'The expires field indicates when the security.txt file should be considered stale.',
            isExpired 
              ? 'Expired security.txt may indicate abandoned security practices.'
              : 'Valid expiration date shows active security maintenance.',
            isExpired 
              ? 'Update the security.txt file with a new expiration date.'
              : 'Monitor expiration and renew before expiry.'
          ));
        }
        
        findings.push(this.createFinding(
          'SEC-STXT-006',
          'Full security.txt Content',
          'informational',
          'informational',
          result.raw || 'Content not available',
          'Complete content of the security.txt file for review.',
          'Allows manual verification of all fields.',
          'Review all fields for accuracy and completeness.'
        ));
        
      } else {
        findings.push(this.createFinding(
          'SEC-STXT-001',
          'security.txt Not Found',
          'low',
          'fail',
          `No security.txt found at ${securityTxtUrl}`,
          'The security.txt file is a standard for vulnerability disclosure contact information (RFC 9116).',
          'Without security.txt, security researchers may not know how to report vulnerabilities, leading to public disclosure or missed reports.',
          'Create a security.txt file at /.well-known/security.txt with at minimum a Contact field. See RFC 9116 for format.'
        ));
      }
      
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-STXT-GENERAL', 'security.txt Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private async checkSecurityTxt(url: string): Promise<SecurityTxtResult> {
    const result: SecurityTxtResult = {
      found: false,
      contact: null,
      policy: null,
      encryption: null,
      expires: null,
      raw: null
    };
    
    try {
      const response = await this.fetchWithTimeout(url, { method: 'GET' });
      
      if (response.ok) {
        const text = await response.text();
        result.found = true;
        result.raw = text;
        
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('#') || !trimmed.includes(':')) continue;
          
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim();
          
          switch (key.toLowerCase().trim()) {
            case 'contact':
              result.contact = value;
              break;
            case 'policy':
              result.policy = value;
              break;
            case 'encryption':
              result.encryption = value;
              break;
            case 'expires':
              result.expires = value;
              break;
          }
        }
      }
    } catch (error) {
      console.error('security.txt check error:', error);
    }
    
    return result;
  }
}