import { BaseScanner } from '../base';
import { createNotVerifiedFinding } from '../base';
import { ScanFinding, Severity, CheckStatus, ScanConfig } from '@/types';

export class TLSScanner extends BaseScanner {
  name = 'TLS/SSL Scanner';
  category = 'HTTPS/TLS';

  async scan(target: string, config: ScanConfig): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];

    try {
      const url = new URL(target);

      const httpsAvailable = await this.probe(url.toString().replace(/^http:/, 'https:'));
      findings.push(this.createFinding(
        'SEC-TLS-001',
        'HTTPS Availability',
        httpsAvailable.ok ? 'informational' : 'high',
        httpsAvailable.ok ? 'pass' : 'fail',
        httpsAvailable.ok
          ? `HTTPS responded with HTTP ${httpsAvailable.status} from ${url.hostname}`
          : `HTTPS probe failed: ${httpsAvailable.error}`,
        'Checks whether the website answers over TLS (HTTPS).',
        httpsAvailable.ok
          ? 'HTTPS encrypts traffic between client and server.'
          : 'Without working HTTPS, traffic is exposed to interception.',
        httpsAvailable.ok
          ? 'Maintain HTTPS configuration.'
          : 'Obtain a valid TLS certificate and enable HTTPS.'
      ));

      if (httpsAvailable.ok) {
        const httpProbe = await this.probe(url.toString().replace(/^https:/, 'http:'));
        let redirectsToHttps = false;
        if (httpProbe.ok && httpProbe.location) {
          try {
            redirectsToHttps = httpProbe.location.startsWith('https:');
          } catch {
            redirectsToHttps = false;
          }
        }

        findings.push(this.createFinding(
          'SEC-TLS-002',
          'HTTP to HTTPS Redirect',
          redirectsToHttps ? 'informational' : 'medium',
          redirectsToHttps ? 'pass' : 'fail',
          redirectsToHttps
            ? `HTTP redirects to: ${httpProbe.location}`
            : httpProbe.ok
              ? `HTTP responded directly with HTTP ${httpProbe.status} (no HTTPS redirect)`
              : `HTTP probe: ${httpProbe.error}`,
          'Checks whether plain HTTP is redirected to HTTPS.',
          redirectsToHttps
            ? 'Users are automatically directed to the secure version.'
            : 'Plain HTTP may leave traffic unencrypted.',
          redirectsToHttps
            ? 'Maintain redirect configuration.'
            : 'Configure a 301/308 redirect from HTTP to HTTPS.'
        ));

        const tlsInfo = await this.getTlsInfo(url.hostname, url.port || '443');
        if (tlsInfo) {
          findings.push(this.createFinding(
            'SEC-TLS-003',
            'TLS Protocol Version',
            this.getTLSSeverity(tlsInfo.protocol),
            tlsInfo.protocol.includes('1.0') || tlsInfo.protocol.includes('1.1') ? 'fail' : 'pass',
            `Negotiated protocol: ${tlsInfo.protocol} (real TLS handshake)`,
            'Protocol version observed during a direct TLS handshake with the server.',
            'Older TLS versions have known weaknesses.',
            tlsInfo.protocol.includes('1.3') || tlsInfo.protocol.includes('1.2')
              ? 'Current TLS version is acceptable.'
              : 'Disable TLS 1.0/1.1. Enable TLS 1.2 and 1.3 only.'
          ));

          if (tlsInfo.cipher) {
            findings.push(this.createFinding(
              'SEC-TLS-004',
              'Cipher Suite',
              'informational',
              'pass',
              `Cipher: ${tlsInfo.cipher}`,
              'Cipher suite negotiated during the TLS handshake.',
              'Weak ciphers (RC4, 3DES, export) weaken confidentiality.',
              'Prefer AEAD ciphers (AES-GCM, ChaCha20-Poly1305).'
            ));
          }

          if (tlsInfo.issuer) {
            findings.push(this.createFinding(
              'SEC-TLS-005',
              'Certificate Issuer',
              'informational',
              'pass',
              `Issuer: ${tlsInfo.issuer}`,
              'Certificate authority that issued the server certificate (from the live certificate).',
              'Issuer identity is part of the trust chain.',
              'Use a publicly trusted CA for public sites.'
            ));
          }

          if (tlsInfo.validTo) {
            const days = Math.ceil((new Date(tlsInfo.validTo).getTime() - Date.now()) / 86400000);
            findings.push(this.createFinding(
              'SEC-TLS-006',
              'Certificate Expiration',
              days < 14 ? 'high' : days < 30 ? 'medium' : 'informational',
              days > 0 ? 'pass' : 'fail',
              days > 0
                ? `Certificate valid_to=${tlsInfo.validTo} (${days} days remaining)`
                : `Certificate expired: valid_to=${tlsInfo.validTo}`,
              'Expiration date read from the live server certificate.',
              days > 0 ? 'Certificate is currently valid.' : 'Expired certificates break HTTPS trust.',
              days > 0 ? 'Renew before expiry.' : 'Renew immediately.'
            ));
          }

          if (tlsInfo.subject) {
            findings.push(this.createFinding(
              'SEC-TLS-007',
              'Certificate Subject / Hostname',
              tlsInfo.subjectMatch ? 'informational' : 'high',
              tlsInfo.subjectMatch ? 'pass' : 'fail',
              `Subject: ${tlsInfo.subject}; matches host: ${tlsInfo.subjectMatch}`,
              'CN/SAN from the live certificate compared to the scanned hostname.',
              tlsInfo.subjectMatch
                ? 'Hostname validation passes.'
                : 'Hostname mismatch triggers browser warnings (MITM risk).',
              tlsInfo.subjectMatch
                ? 'No action needed.'
                : 'Obtain a certificate for this hostname.'
            ));
          }
        }
      }
    } catch (error) {
      findings.push(createNotVerifiedFinding('SEC-TLS-GENERAL', 'TLS/SSL Check', String(error), this.category));
    }

    return findings;
  }

  private async probe(url: string): Promise<{ ok: boolean; status?: number; location?: string; error?: string }> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.timeout);
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'manual',
          headers: { 'User-Agent': this.config.userAgent }
        });
        return {
          ok: res.status < 500,
          status: res.status,
          location: res.headers.get('location') || undefined
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  private async getTlsInfo(host: string, port: string): Promise<{
    protocol: string;
    cipher: string | null;
    issuer: string | null;
    subject: string | null;
    subjectMatch: boolean;
    validTo: string | null;
  } | null> {
    if (typeof window !== 'undefined') return null;
    try {
      const nodeTls = 'node:tls';
      const { connect } = await import(/* webpackIgnore: true */ nodeTls) as typeof import('tls');
      return await new Promise((resolve, reject) => {
        const socket = connect({
          host,
          port: parseInt(port, 10) || 443,
          servername: host,
          rejectUnauthorized: false,
          timeout: this.config.timeout
        });

        const cleanup = () => {
          socket.removeAllListeners();
          socket.destroy();
        };

        socket.once('secureConnect', () => {
          try {
            const cert = socket.getPeerCertificate(false);
            const protocol = socket.getProtocol() || 'unknown';
            const cipher = socket.getCipher()?.name || null;
            const issuerRaw = cert?.issuer?.CN || cert?.issuer?.organizationName || null;
            const subjectRaw = cert?.subject?.CN || null;
            const issuer = Array.isArray(issuerRaw) ? issuerRaw[0] || null : issuerRaw;
            const subject = Array.isArray(subjectRaw) ? subjectRaw[0] || null : subjectRaw;
            const validTo = cert?.valid_to || null;

            let subjectMatch = false;
            if (subject) {
              subjectMatch = subject === host || host.endsWith(`.${subject}`);
            }
            const san = cert?.subjectaltname;
            if (san) {
              const names = san.split(',').map(s => s.trim().replace(/^DNS:/, ''));
              if (names.includes(host) || names.some(n => n.startsWith('*.') && host.endsWith(n.slice(1)))) {
                subjectMatch = true;
              }
            }

            cleanup();
            resolve({ protocol, cipher, issuer, subject, subjectMatch, validTo });
          } catch (e) {
            cleanup();
            reject(e);
          }
        });

        socket.once('error', (err) => {
          cleanup();
          reject(err);
        });

        socket.once('timeout', () => {
          cleanup();
          reject(new Error('TLS handshake timeout'));
        });
      });
    } catch {
      return null;
    }
  }

  private getTLSSeverity(version: string): Severity {
    if (version.includes('1.0') || version.includes('1.1') || version.includes('SSL')) return 'high';
    if (version.includes('1.2')) return 'low';
    if (version.includes('1.3')) return 'informational';
    return 'medium';
  }
}