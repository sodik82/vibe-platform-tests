'use client'

import { ExperimentResult } from '@/lib/supabase'

function toCSV(rows: ExperimentResult[]): string {
  if (rows.length === 0) return ''
  const headers: (keyof ExperimentResult)[] = [
    'id',
    'session_id',
    'variant_assigned',
    'highest_step_reached',
    'free_text_answer',
    'multiple_choice_answer',
    'created_at',
  ]
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')
}

export default function DownloadButton({ rows }: { rows: ExperimentResult[] }) {
  function handleDownload() {
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiment_results_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={rows.length === 0}
      style={{
        padding: '0.5rem 1.25rem',
        background: '#111',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: rows.length === 0 ? 'not-allowed' : 'pointer',
        fontSize: '0.875rem',
        opacity: rows.length === 0 ? 0.4 : 1,
      }}
    >
      Download CSV ({rows.length} rows)
    </button>
  )
}
