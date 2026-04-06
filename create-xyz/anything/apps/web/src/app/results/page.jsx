"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Download,
  Table as TableIcon,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

export default function ResultsPage() {
  const {
    data: results,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["experiment-results"],
    queryFn: async () => {
      const response = await fetch("/api/experiment/sessions");
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });

  const downloadCSV = () => {
    if (!results) return;

    const headers = [
      "ID",
      "Variant",
      "Step",
      "Free Text",
      "MCQ",
      "Started At",
      "Updated At",
    ];
    const csvContent = [
      headers.join(","),
      ...results.map((row) =>
        [
          row.id,
          row.variant,
          row.current_step,
          `"${(row.free_text_response || "").replace(/"/g, '""')}"`,
          `"${(row.multiple_choice_response || "").replace(/"/g, '""')}"`,
          row.created_at,
          row.updated_at,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `experiment_results_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Error: {error.message}
      </div>
    );
  }

  const stats = {
    total: results.length,
    completed: results.filter((r) => r.current_step === "completed").length,
    variantA: results.filter((r) => r.variant === "A").length,
    variantB: results.filter((r) => r.variant === "B").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Experiment Results
            </h1>
            <p className="text-gray-500">
              Real-time data collection and funnel analysis
            </p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              label: "Total Sessions",
              value: stats.total,
              icon: Activity,
              color: "text-blue-600",
            },
            {
              label: "Completion Rate",
              value: `${((stats.completed / stats.total) * 100 || 0).toFixed(1)}%`,
              icon: CheckCircle2,
              color: "text-green-600",
            },
            {
              label: "Variant A",
              value: stats.variantA,
              icon: TableIcon,
              color: "text-purple-600",
            },
            {
              label: "Variant B",
              value: stats.variantB,
              icon: TableIcon,
              color: "text-orange-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gray-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Session ID
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Variant
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Current Step
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Free Text Response
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    MCQ Choice
                  </th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {row.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${row.variant === "A" ? "bg-purple-100 text-purple-700" : "bg-orange-100 text-orange-700"}`}
                      >
                        {row.variant}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium uppercase tracking-wider">
                        {row.current_step.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {row.free_text_response || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {row.multiple_choice_response || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(row.updated_at), "MMM d, HH:mm")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {results.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No responses collected yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
