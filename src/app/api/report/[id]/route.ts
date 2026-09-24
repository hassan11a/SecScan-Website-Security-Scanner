import { NextRequest, NextResponse } from 'next/server';
import { getScanByScanId } from '@/lib/Database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = getScanByScanId(id);
    
    if (!record) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }
    
    const result = {
      scanId: record.scan_id,
      url: record.url,
      normalizedUrl: record.normalized_url,
      startTime: record.start_time,
      endTime: record.end_time,
      duration: record.duration,
      status: record.status,
      securityScore: record.security_score,
      totalChecks: record.total_checks,
      passedChecks: record.passed_checks,
      findings: record.findings ? JSON.parse(record.findings) : [],
      informationalCount: record.informational_count,
      lowCount: record.low_count,
      mediumCount: record.medium_count,
      highCount: record.high_count
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get scan result error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan result' },
      { status: 500 }
    );
  }
}