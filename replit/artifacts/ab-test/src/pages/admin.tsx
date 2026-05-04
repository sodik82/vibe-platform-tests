import { useGetFunnelStats, useGetResults } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Admin() {
  const { data: funnelStats, isLoading: funnelLoading } = useGetFunnelStats();
  const { data: resultsData, isLoading: resultsLoading } = useGetResults();

  const handleDownloadCsv = () => {
    if (!resultsData?.sessions) return;

    const sessions = resultsData.sessions;
    if (sessions.length === 0) return;

    const headers = ["Session ID", "Variant", "Current Step", "Free Text Answer", "Multiple Choice Answer", "Created At", "Completed At"];
    const rows = sessions.map(s => [
      s.id,
      s.variant,
      s.currentStep,
      `"${(s.freeTextAnswer || "").replace(/"/g, '""')}"`,
      `"${(s.multipleChoiceAnswer || "").replace(/"/g, '""')}"`,
      s.createdAt,
      s.completedAt || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "experiment_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Experiment Results</h1>
            <p className="text-slate-500 mt-1">Review funnel performance and download session data.</p>
          </div>
          <Button onClick={handleDownloadCsv} disabled={!resultsData?.sessions || resultsData.sessions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Funnel Overview</CardTitle>
              <CardDescription>Aggregate completion rates across all variants</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
              ) : funnelStats ? (
                <div className="space-y-6">
                  <FunnelStep 
                    label="Started Session" 
                    value={funnelStats.totalStarted} 
                    max={funnelStats.totalStarted} 
                  />
                  <FunnelStep 
                    label="Viewed Image" 
                    value={funnelStats.viewedImage} 
                    max={funnelStats.totalStarted} 
                  />
                  <FunnelStep 
                    label="Answered Q1" 
                    value={funnelStats.answeredFreeText} 
                    max={funnelStats.totalStarted} 
                  />
                  <FunnelStep 
                    label="Completed" 
                    value={funnelStats.completed} 
                    max={funnelStats.totalStarted} 
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">No data available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variant Performance</CardTitle>
              <CardDescription>Completion rates grouped by design variant</CardDescription>
            </CardHeader>
            <CardContent>
              {funnelLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
              ) : funnelStats?.byVariant && funnelStats.byVariant.length > 0 ? (
                <div className="space-y-6">
                  {funnelStats.byVariant.map((v) => (
                    <div key={v.variant} className="border rounded-md p-4 bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-slate-900 capitalize text-sm bg-slate-100 px-2 py-1 rounded">Variant {v.variant}</span>
                        <span className="text-xs text-slate-500">{v.totalStarted} sessions</span>
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between text-xs text-slate-600">
                           <span>Completed</span>
                           <span className="font-medium">{Math.round((v.completed / (v.totalStarted || 1)) * 100)}% ({v.completed})</span>
                         </div>
                         <Progress value={(v.completed / (v.totalStarted || 1)) * 100} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No variants recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Raw data from the latest {resultsData?.sessions?.length || 0} participants</CardDescription>
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
            ) : resultsData?.sessions && resultsData.sessions.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Step</TableHead>
                      <TableHead>Free Text</TableHead>
                      <TableHead>Multiple Choice</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultsData.sessions.slice(0, 50).map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-xs text-slate-500" title={session.id}>
                          {session.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                            {session.variant}
                          </span>
                        </TableCell>
                        <TableCell>{session.currentStep}/3</TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-600" title={session.freeTextAnswer || ""}>
                          {session.freeTextAnswer || "-"}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-slate-600" title={session.multipleChoiceAnswer || ""}>
                          {session.multipleChoiceAnswer || "-"}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-12 text-slate-500 border rounded-md bg-slate-50/50">
                No sessions completed yet. Share the experiment link to gather data.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FunnelStep({ label, value, max }: { label: string, value: number, max: number }) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500 font-mono text-xs">{value} ({percentage}%)</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
