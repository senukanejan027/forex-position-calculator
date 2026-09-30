import { supabase } from '../lib/supabase'
import { CloudError, MESSAGES, toCloudError } from '../lib/errors'
import { fromRow, toRow, isUuid, newUuid } from './tradeMapper'

const TABLE = 'trades'
const PAGE = 1000 // PostgREST returns at most 1000 rows per request
const CHUNK = 200

// Every call scopes to the signed-in user's id taken from their session. RLS (auth.uid() = user_id)
// is the real enforcement; these filters are a second layer so a bug can never widen a query.
async function currentUserId() {
  if (!supabase) throw new CloudError('config', MESSAGES.config)
  const { data, error } = await supabase.auth.getSession()
  if (error) throw toCloudError(error)
  if (!data.session) throw new CloudError('session', MESSAGES.session)
  return data.session.user.id
}

const check = (error, key) => { if (error) throw toCloudError(error, key) }
const chunks = (list, n) => { const out = []; for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n)); return out }

export async function getTrades() {
  const uid = await currentUserId()
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', uid)
      .order('trade_date', { ascending: false }).order('id').range(from, from + PAGE - 1)
    check(error, 'load')
    rows.push(...data)
    if (data.length < PAGE) break
  }
  return rows.map(fromRow)
}

export async function getTrade(id) {
  const uid = await currentUserId()
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).eq('user_id', uid).maybeSingle()
  check(error, 'load')
  return data ? fromRow(data) : null
}

export async function createTrade(trade) {
  const uid = await currentUserId()
  const t = isUuid(trade.id) ? trade : { ...trade, id: newUuid(), clientId: trade.clientId || trade.id || '' }
  const { data, error } = await supabase.from(TABLE).insert(toRow(t, uid)).select().single()
  check(error, 'save')
  return fromRow(data)
}

export async function updateTrade(id, trade) {
  const uid = await currentUserId()
  const { id: _omit, user_id: _u, created_at: _c, ...patch } = toRow({ ...trade, id }, uid)
  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', id).eq('user_id', uid).select().maybeSingle()
  check(error, 'save')
  if (!data) throw new CloudError('database', MESSAGES.save)
  return fromRow(data)
}

export async function deleteTrade(id) {
  const uid = await currentUserId()
  const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', uid)
  check(error, 'save')
}

export async function deleteAllTrades() {
  const uid = await currentUserId()
  const { error } = await supabase.from(TABLE).delete().eq('user_id', uid)
  check(error, 'save')
}

// Batch helpers used by the sync queue, backup import and local-data migration.
export async function upsertTrades(trades) {
  const uid = await currentUserId()
  for (const part of chunks(trades, CHUNK)) {
    const { error } = await supabase.from(TABLE).upsert(part.map((t) => toRow(t, uid)), { onConflict: 'id' })
    check(error, 'save')
  }
}

// Insert-only: a row whose (user_id, client_id) already exists is skipped by the database itself,
// so retrying an interrupted import can never create duplicates.
export async function importTrades(trades) {
  const uid = await currentUserId()
  for (const part of chunks(trades, CHUNK)) {
    const { error } = await supabase.from(TABLE).upsert(part.map((t) => toRow(t, uid)), { onConflict: 'user_id,client_id', ignoreDuplicates: true })
    check(error, 'save')
  }
}

export async function deleteTradesByIds(ids) {
  const uid = await currentUserId()
  for (const part of chunks(ids, 100)) {
    const { error } = await supabase.from(TABLE).delete().in('id', part).eq('user_id', uid)
    check(error, 'save')
  }
}
