'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Separator } from '@/components/ui/Separator';
import { formatDate, formatDuration, getSeverityBadgeColor, getStatusBadgeColor, getSecurityScoreLabel } from '@/lib/utils';
import { CheckCircle, XCircle, Info, AlertTriangle, Shield, Download, FileText, Clock, Search, Link2 } from 'lucide-react';

interface ScanFinding {
  checkId: string;
  category: string;
  title: string;
  severity: 'informational' | 'low' | 'medium' | 'high';
  status: 'pass' | 'fail' | 'informational' | 'not-verified';
  evidence: string;
  description: string;
  impact: string;
  recommendation: string;
}

interface ScanResult {
  scanId: string;
  url: string;
  normalizedUrl: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  securityScore: number;
  totalChecks: number;
  passedChecks: number;
  findings: ScanFinding[];
  informationalCount: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
}

const SEVERITY_ICONS = {
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  informational: Info
};

const STATUS_ICONS = {
  pass: CheckCircle,
  fail: XCircle,
  informational: Info,
  'not-verified': AlertTriangle
};

export default function ScanResultPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    async function fetchResult() {
      try {
        const response = await fetch(`/api/report/${scanId}`);
        if (!response.ok) {
          throw new Error('Scan not found');
        }
        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scan result');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [scanId]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading scan results...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>{error || 'Scan not found'}</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }
  
  const scoreLabel = getSecurityScoreLabel(result.securityScore);
  
  const findingsByCategory = result.findings.reduce((acc, finding) => {
    if (!acc[finding.category]) acc[finding.category] = [];
    acc[finding.category].push(finding);
    return acc;
  }, {} as Record<string, ScanFinding[]>);
  
  const categories = Object.keys(findingsByCategory).sort();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Scan Report</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{result.url}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <FileText className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 mb-6 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Security Score</p>
                  <p className="text-4xl font-bold {scoreLabel.color}">{result.securityScore}</p>
                  <p className="text-sm {scoreLabel.color}">{scoreLabel.label}</p>
                </div>
                <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600" />
              </div>
              <Progress value={result.securityScore} max={100} className="mt-4 h-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Checks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{result.totalChecks}</p>
              <p className="text-sm text-green-600 dark:text-green-400">{result.passedChecks} passed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Scan Duration</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(result.duration)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(result.startTime)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">Findings</p>
              <div className="flex items-baseline gap-4 mt-1">
                <Badge variant="danger">{result.highCount} High</Badge>
                <Badge variant="warning">{result.mediumCount} Medium</Badge>
                <Badge variant="secondary">{result.lowCount} Low</Badge>
                <Badge variant="default">{result.informationalCount} Info</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="findings">Findings ({result.findings.length})</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
            ))}
            <TabsTrigger value="details">Target Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Scan Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Scan ID</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100">{result.scanId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Target URL</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{result.url}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Normalized URL</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{result.normalizedUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Start Time</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(result.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">End Time</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDate(result.endTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatDuration(result.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                    <Badge variant={result.status === 'completed' ? 'success' : 'default'}>
                      {result.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Finding Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.highCount}</p>
                      <p className="text-sm text-red-600 dark:text-red-400">High Severity</p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{result.mediumCount}</p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Medium Severity</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.lowCount}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Low Severity</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{result.informationalCount}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Informational</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="findings">
            <div className="space-y-4">
              {result.findings.length === 0 ? (
                <Alert variant="success">
                  <AlertDescription>No findings detected. All checks passed!</AlertDescription>
                </Alert>
              ) : (
                result.findings.map((finding, index) => (
                  <FindingCard key={`${finding.checkId}-${index}`} finding={finding} index={index + 1} />
                ))
              )}
            </div>
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="space-y-4">
                {findingsByCategory[category].map((finding, index) => (
                  <FindingCard key={`${finding.checkId}-${index}`} finding={finding} index={index + 1} />
                ))}
              </div>
            </TabsContent>
          ))}
          
          <TabsContent value="details">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    HTTP Response Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Detailed HTTP response information would be displayed here in a full implementation.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Headers Raw
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Raw security headers would be displayed here in a full implementation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function FindingCard({ finding, index }: { finding: ScanFinding; index: number }) {
  const SeverityIcon = SEVERITY_ICONS[finding.severity];
  const StatusIcon = STATUS_ICONS[finding.status];
  const isExpanded = false;
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400 w-8">{index}.</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">{finding.title}</h4>
              <Badge className={getSeverityBadgeColor(finding.severity)}>{finding.severity}</Badge>
              <Badge className={getStatusBadgeColor(finding.status)}>{finding.status}</Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{finding.checkId}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{finding.description}</p>
          </div>
          <SeverityIcon className={finding.severity === 'high' ? 'h-5 w-5 text-red-500' : finding.severity === 'medium' ? 'h-5 w-5 text-yellow-500' : 'h-5 w-5 text-blue-500'} />
        </div>
      </div>
      
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Evidence</p>
            <p className="mt-1 text-sm font-mono text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900 p-2 rounded border">{finding.evidence}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{finding.category}</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Security Impact</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{finding.impact}</p>
        </div>
        
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recommendation</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{finding.recommendation}</p>
        </div>
      </div>
    </Card>
  );
}