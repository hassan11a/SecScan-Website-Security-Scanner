import { NextRequest, NextResponse } from 'next/server';
import { runScan } from '@/lib/scanner';
import { createScan, updateScan } from '@/lib/Database';
import { generateScanId } from '@/lib/security';
import { z } from 'zod';

const scanSchema = z.object({
  url: z.string().min(1, 'URL is required').max(2048, 'URL too long'),
  allowLocal: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = scanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { url, allowLocal } = validation.data;

    const scanId = generateScanId();
    const startTime = new Date();

    createScan({
      scan_id: scanId,
      url,
      normalized_url: url,
      start_time: startTime.toISOString(),
      end_time: null,
      duration: null,
      status: 'in-progress',
      security_score: null,
      total_checks: 0,
      passed_checks: 0,
      informational_count: 0,
      low_count: 0,
      medium_count: 0,
      high_count: 0,
      findings: null
    });

    try {
      const result = await runScan({ url, allowLocal, scanId });

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      updateScan(scanId, {
        end_time: endTime.toISOString(),
        duration,
        status: 'completed',
        security_score: result.securityScore,
        total_checks: result.totalChecks,
        passed_checks: result.passedChecks,
        informational_count: result.informationalCount,
        low_count: result.lowCount,
        medium_count: result.mediumCount,
        high_count: result.highCount,
        findings: JSON.stringify(result.findings)
      });

      return NextResponse.json({
        scanId,
        url: result.url,
        normalizedUrl: result.normalizedUrl,
        securityScore: result.securityScore,
        status: 'completed',
        totalChecks: result.totalChecks,
        passedChecks: result.passedChecks,
        findings: result.findings,
        informationalCount: result.informationalCount,
        lowCount: result.lowCount,
        mediumCount: result.mediumCount,
        highCount: result.highCount,
        startTime: result.startTime.toISOString(),
        endTime: result.endTime.toISOString(),
        duration: result.duration
      });
    } catch (scanError) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const message = scanError instanceof Error ? scanError.message : 'Scan failed';
      const unreachable = message.toLowerCase().includes('not reachable')
        || message.toLowerCase().includes('dns resolution failed')
        || message.toLowerCase().includes('does not resolve');

      updateScan(scanId, {
        end_time: endTime.toISOString(),
        duration,
        status: unreachable ? 'failed' : 'failed',
        findings: JSON.stringify([{
          checkId: 'SEC-SCAN-ABORT',
          category: 'Scan',
          title: unreachable ? 'Target Unreachable — Scan Aborted' : 'Scan Failed',
          severity: 'informational',
          status: 'not-verified',
          evidence: message,
          description: unreachable
            ? 'Preflight reachability check failed. The website did not respond, so no security checks were run. No fabricated results are shown.'
            : message,
          impact: 'No security posture can be assessed without a live response from the target.',
          recommendation: 'Verify the URL is correct, the host is online, and DNS is configured, then retry.'
        }])
      });

      throw scanError;
    }
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Scan failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}