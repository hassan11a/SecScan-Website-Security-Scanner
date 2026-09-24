import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig, DNSResult } from '@/types';

export class DNSScanner extends BaseScanner {
  name = 'DNS Security Scanner';
  category = 'DNS';
  
  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    try {
      const url = new URL(target);
      const hostname = url.hostname;
      
      const dnsResults = await this.queryDNS(hostname);
      
      if (dnsResults.a.length === 0 && dnsResults.aaaa.length === 0 && dnsResults.cname.length === 0) {
        throw new Error(`Domain "${hostname}" has no A/AAAA/CNAME records — it does not resolve. DNS check aborted.`);
      }
      
      findings.push(this.createFinding(
        'SEC-DNS-001',
        'DNS A Records',
        'informational',
        dnsResults.a.length > 0 ? 'pass' : 'informational',
        dnsResults.a.length > 0 ? `Found ${dnsResults.a.length} A record(s): ${dnsResults.a.join(', ')}` : 'No A records found',
        'A records map the domain to IPv4 addresses.',
        'Missing A records may indicate the domain does not resolve to an IPv4 address.',
        'Ensure at least one A record points to the correct web server IP.'
      ));
      
      findings.push(this.createFinding(
        'SEC-DNS-002',
        'DNS AAAA Records',
        'informational',
        dnsResults.aaaa.length > 0 ? 'pass' : 'informational',
        dnsResults.aaaa.length > 0 ? `Found ${dnsResults.aaaa.length} AAAA record(s): ${dnsResults.aaaa.join(', ')}` : 'No AAAA records found (IPv6 not configured)',
        'AAAA records map the domain to IPv6 addresses.',
        'Missing IPv6 records may limit accessibility for IPv6-only clients.',
        'Consider adding AAAA records for IPv6 support.'
      ));
      
      if (dnsResults.cname.length > 0) {
        findings.push(this.createFinding(
          'SEC-DNS-003',
          'DNS CNAME Records',
          'informational',
          'pass',
          `Found CNAME record(s): ${dnsResults.cname.join(', ')}`,
          'CNAME records alias the domain to another hostname.',
          'CNAME records can introduce additional DNS lookup latency and potential hijacking if the target is compromised.',
          'Verify CNAME targets are trusted and consider using A/AAAA records for apex domains.'
        ));
      }
      
      findings.push(this.createFinding(
        'SEC-DNS-004',
        'DNS MX Records',
        dnsResults.mx.length > 0 ? 'informational' : 'low',
        dnsResults.mx.length > 0 ? 'pass' : 'informational',
        dnsResults.mx.length > 0 ? `Found ${dnsResults.mx.length} MX record(s): ${dnsResults.mx.join(', ')}` : 'No MX records found',
        'MX records specify mail servers for the domain.',
        'Missing MX records mean the domain cannot receive email.',
        'Configure MX records if email service is required for the domain.'
      ));
      
      findings.push(this.createFinding(
        'SEC-DNS-005',
        'DNS NS Records',
        'informational',
        dnsResults.ns.length > 0 ? 'pass' : 'fail',
        dnsResults.ns.length > 0 ? `Found ${dnsResults.ns.length} NS record(s): ${dnsResults.ns.join(', ')}` : 'No NS records found',
        'NS records delegate the domain to authoritative name servers.',
        'NS records should point to trusted, reliable name servers.',
        'Ensure NS records point to your authorized DNS provider.'
      ));
      
      if (dnsResults.spf) {
        const spfAnalysis = this.analyzeSPF(dnsResults.spf);
        findings.push(this.createFinding(
          'SEC-DNS-006',
          'SPF Record',
          spfAnalysis.severity,
          spfAnalysis.status,
          `SPF record: ${dnsResults.spf}`,
          'SPF (Sender Policy Framework) specifies authorized mail servers for the domain.',
          spfAnalysis.impact,
          spfAnalysis.recommendation
        ));
      } else {
        findings.push(this.createFinding(
          'SEC-DNS-006',
          'Missing SPF Record',
          'medium',
          'fail',
          'No SPF record found in TXT records',
          'SPF helps prevent email spoofing by specifying authorized mail servers.',
          'Without SPF, attackers can forge emails appearing to come from your domain.',
          'Add an SPF record to your DNS TXT records (e.g., "v=spf1 include:_spf.google.com ~all")'
        ));
      }
      
      if (dnsResults.dmarc) {
        const dmarcAnalysis = this.analyzeDMARC(dnsResults.dmarc);
        findings.push(this.createFinding(
          'SEC-DNS-007',
          'DMARC Record',
          dmarcAnalysis.severity,
          dmarcAnalysis.status,
          `DMARC record: ${dnsResults.dmarc}`,
          'DMARC (Domain-based Message Authentication, Reporting, and Conformance) builds on SPF/DKIM for email authentication.',
          dmarcAnalysis.impact,
          dmarcAnalysis.recommendation
        ));
      } else {
        findings.push(this.createFinding(
          'SEC-DNS-007',
          'Missing DMARC Record',
          'medium',
          'fail',
          'No DMARC record found at _dmarc subdomain',
          'DMARC provides policy for handling emails that fail SPF/DKIM checks.',
          'Without DMARC, there is no policy for receivers to handle unauthenticated emails.',
          'Add a DMARC record at _dmarc.yourdomain.com (e.g., "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com")'
        ));
      }
      
      for (const txt of dnsResults.txt) {
        if (txt.includes('v=spf1') || txt.includes('v=DMARC1')) continue;
        findings.push(this.createFinding(
          'SEC-DNS-008',
          'DNS TXT Record',
          'informational',
          'informational',
          `TXT record: ${txt}`,
          'TXT records can contain arbitrary text data for various purposes.',
          'TXT records may reveal information about services or configurations.',
          'Review TXT records for sensitive information disclosure.'
        ));
      }
      
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-DNS-GENERAL', 'DNS Security Check', String(error), this.category));
    }
    
    return findings;
  }
  
  private async queryDNS(hostname: string): Promise<DNSResult> {
    const result: DNSResult = {
      a: [],
      aaaa: [],
      cname: [],
      mx: [],
      ns: [],
      txt: [],
      spf: null,
      dmarc: null
    };
    
    try {
      const [aRecords, aaaaRecords, cnameRecords, mxRecords, nsRecords, txtRecords] = await Promise.allSettled([
        this.resolveDNS(hostname, 'A'),
        this.resolveDNS(hostname, 'AAAA'),
        this.resolveDNS(hostname, 'CNAME'),
        this.resolveDNS(hostname, 'MX'),
        this.resolveDNS(hostname, 'NS'),
        this.resolveDNS(hostname, 'TXT')
      ]);
      
      if (aRecords.status === 'fulfilled') result.a = aRecords.value;
      if (aaaaRecords.status === 'fulfilled') result.aaaa = aaaaRecords.value;
      if (cnameRecords.status === 'fulfilled') result.cname = cnameRecords.value;
      if (mxRecords.status === 'fulfilled') result.mx = mxRecords.value;
      if (nsRecords.status === 'fulfilled') result.ns = nsRecords.value;
      if (txtRecords.status === 'fulfilled') {
        result.txt = txtRecords.value;
        for (const txt of result.txt) {
          if (txt.startsWith('v=spf1')) result.spf = txt;
          if (txt.startsWith('v=DMARC1')) result.dmarc = txt;
        }
      }
      
      if (!result.spf) {
        try {
          const spfRecords = await this.resolveDNS(`_spf.${hostname}`, 'TXT');
          for (const txt of spfRecords) {
            if (txt.startsWith('v=spf1')) result.spf = txt;
          }
        } catch {}
      }
      
      if (!result.dmarc) {
        try {
          const dmarcRecords = await this.resolveDNS(`_dmarc.${hostname}`, 'TXT');
          for (const txt of dmarcRecords) {
            if (txt.startsWith('v=DMARC1')) result.dmarc = txt;
          }
        } catch {}
      }
      
    } catch (error) {
      console.error('DNS query error:', error);
    }
    
    return result;
  }
  
  private async resolveDNS(hostname: string, type: string): Promise<string[]> {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=${type}`, {
        signal: AbortSignal.timeout(this.config.timeout)
      });
      const data = await response.json();
      return data.Answer?.map((r: any) => r.data) || [];
    } catch {
      return [];
    }
  }
  
  private analyzeSPF(spf: string): { severity: Severity; status: CheckStatus; impact: string; recommendation: string } {
    if (spf.includes('+all')) {
      return {
        severity: 'high',
        status: 'fail',
        impact: 'SPF "+all" allows any server to send email for this domain, completely defeating SPF protection.',
        recommendation: 'Change "+all" to "~all" (softfail) or "-all" (hardfail).'
      };
    }
    if (spf.includes('?all')) {
      return {
        severity: 'medium',
        status: 'fail',
        impact: 'SPF "?all" (neutral) provides no policy enforcement.',
        recommendation: 'Change "?all" to "~all" (softfail) or "-all" (hardfail).'
      };
    }
    if (spf.includes('~all')) {
      return {
        severity: 'low',
        status: 'pass',
        impact: 'SPF softfail (~all) marks unauthorized emails but does not reject them.',
        recommendation: 'Consider changing to "-all" (hardfail) for stricter enforcement after testing.'
      };
    }
    if (spf.includes('-all')) {
      return {
        severity: 'informational',
        status: 'pass',
        impact: 'SPF hardfail (-all) rejects emails from unauthorized servers.',
        recommendation: 'Maintain current configuration.'
      };
    }
    return {
      severity: 'medium',
      status: 'fail',
      impact: 'SPF record lacks an "all" mechanism, defaulting to neutral behavior.',
      recommendation: 'Add "~all" or "-all" to the end of the SPF record.'
    };
  }
  
  private analyzeDMARC(dmarc: string): { severity: Severity; status: CheckStatus; impact: string; recommendation: string } {
    const pMatch = dmarc.match(/p=([^;]+)/);
    const policy = pMatch ? pMatch[1] : 'none';
    
    switch (policy) {
      case 'none':
        return {
          severity: 'medium',
          status: 'fail',
          impact: 'DMARC policy "none" (monitor only) does not enforce any action on failed emails.',
          recommendation: 'Change policy to "quarantine" or "reject" after verifying SPF/DKIM alignment.'
        };
      case 'quarantine':
        return {
          severity: 'low',
          status: 'pass',
          impact: 'DMARC "quarantine" policy sends failed emails to spam/junk folder.',
          recommendation: 'Consider upgrading to "reject" after monitoring reports.'
        };
      case 'reject':
        return {
          severity: 'informational',
          status: 'pass',
          impact: 'DMARC "reject" policy blocks failed emails entirely.',
          recommendation: 'Maintain current configuration. Monitor aggregate reports.'
        };
      default:
return {
      severity: 'medium',
      status: 'fail',
      impact: `Unknown DMARC policy: ${policy}`,
      recommendation: 'Set a valid DMARC policy (none, quarantine, or reject).'
    };
  }
}
}