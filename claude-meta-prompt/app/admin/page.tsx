export const dynamic = 'force-dynamic'

import { supabase, ExperimentResult } from '@/lib/supabase'
import DownloadButton from './DownloadButton'

const STEP_LABELS: Record<number, string> = {
  1: 'Intro',
  2: 'Exposure',
  3: 'Free Text',
  4: 'Multiple Choice',
  5: 'Complete',
}

export default async function AdminPage() {
  const { data, error } = await supabase
    .from('experiment_results')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (data as ExperimentResult[]) ?? []

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: '100%' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Experiment Results — Admin</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        {error ? `Error: ${error.message}` : `${rows.length} records`}
      </p>

      {!error && <DownloadButton rows={rows} />}

      <div style={{ overflowX: 'auto', marginTop: '1.5rem' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: '0.8rem', width: '100%' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              {['Session ID', 'Variant', 'Highest Step', 'Free Text Answer', 'Multiple Choice', 'Created At'].map(
                (h) => (
                  <th
                    key={h}
                    style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #ddd', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>
                  No results yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.session_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px 12px', color: '#888', fontSize: '0.75rem' }}>
                    {r.session_id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{r.variant_assigned}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {r.highest_step_reached} — {STEP_LABELS[r.highest_step_reached] ?? '?'}
                  </td>
                  <td
                    style={{ padding: '8px 12px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={r.free_text_answer ?? ''}
                  >
                    {r.free_text_answer ?? '—'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>{r.multiple_choice_answer ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#888', whiteSpace: 'nowrap' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
