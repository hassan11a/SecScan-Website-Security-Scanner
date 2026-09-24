import { NextRequest, NextResponse } from 'next/server';
import { getAllScans, getScansCount } from '@/lib/Database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const scans = getAllScans(limit, offset);
    const total = getScansCount();

    return NextResponse.json({
      scans: scans.map(scan => ({
        id: scan.id,
        scanId: scan.scan_id,
        url: scan.url,
        dateTime: scan.created_at,
        securityScore: scan.security_score,
        findingCount: scan.total_checks,
        status: scan.status,
        high_count: scan.high_count,
        medium_count: scan.medium_count,
        low_count: scan.low_count,
        informational_count: scan.informational_count,
        passed_checks: scan.passed_checks,
        duration: scan.duration
      })),
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get scans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    );
  }
}