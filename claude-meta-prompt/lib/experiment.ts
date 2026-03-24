import { supabase, ExperimentResult } from './supabase'

export async function createSession(sessionId: string, variant: 'A' | 'B') {
  const { error } = await supabase.from('experiment_results').insert({
    session_id: sessionId,
    variant_assigned: variant,
    highest_step_reached: 1,
  })
  if (error) console.error('Error creating session:', error)
}

export async function updateSession(sessionId: string, updates: Partial<ExperimentResult>) {
  const { error } = await supabase
    .from('experiment_results')
    .update(updates)
    .eq('session_id', sessionId)
  if (error) console.error('Error updating session:', error)
}
