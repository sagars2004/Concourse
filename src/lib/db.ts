/**
 * DigitalOcean Managed PostgreSQL client.
 * Tables are created automatically on first use (no external SQL console needed).
 */

import pg from "pg";
import type { Pool } from "pg";

let pool: Pool | null = null;
let schemaEnsured = false;

const MIGRATION_SQL = `
create extension if not exists pgcrypto;

create table if not exists searches (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  flight_number text not null,
  departure_airport_iata text,
  arrival_airport_iata text,
  flight_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_searches_session_id on searches (session_id);

create table if not exists recommendation_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  search_id uuid,
  vendor_name text not null,
  terminal text,
  gate text,
  level text,
  shown_at timestamptz not null default now(),
  clicked_at timestamptz
);

create index if not exists idx_recommendation_events_session_id on recommendation_events (session_id);
`;

async function ensureSchema(): Promise<void> {
  if (schemaEnsured || !pool) return;
  const client = await pool.connect();
  try {
    await client.query(MIGRATION_SQL);
    schemaEnsured = true;
  } catch (e) {
    // Keep the app running even if migrations fail (analytics becomes a no-op).
    console.error("DB migration failed:", e);
  } finally {
    client.release();
  }
}

function getPool(): Pool | null {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    pool = new pg.Pool({ connectionString: url });
    return pool;
  } catch {
    return null;
  }
}

export async function getDbClient(): Promise<{
  pool: Pool;
  ensureSchema: () => Promise<void>;
} | null> {
  const p = getPool();
  if (!p) return null;
  // Never throw to callers: if schema can't be ensured, treat DB as unavailable.
  await ensureSchema();
  if (!schemaEnsured) return null;
  return { pool: p, ensureSchema };
}

export async function insertSearch(
  sessionId: string,
  data: {
    flightNumber: string;
    departureAirportIata?: string | null;
    arrivalAirportIata?: string | null;
    flightDate?: string | null;
  }
): Promise<string | null> {
  const client = await getDbClient();
  if (!client) return null;
  try {
    const res = await client.pool.query(
      `insert into searches (session_id, flight_number, departure_airport_iata, arrival_airport_iata, flight_date)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [
        sessionId,
        data.flightNumber,
        data.departureAirportIata ?? null,
        data.arrivalAirportIata ?? null,
        data.flightDate ? new Date(data.flightDate).toISOString().slice(0, 10) : null,
      ]
    );
    return res.rows?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function insertRecommendationEvents(
  sessionId: string,
  searchId: string | null,
  vendors: { name: string; terminal?: string; gate?: string; level?: string }[]
): Promise<void> {
  const client = await getDbClient();
  if (!client || vendors.length === 0) return;
  try {
    for (const v of vendors) {
      await client.pool.query(
        `insert into recommendation_events (session_id, search_id, vendor_name, terminal, gate, level)
         values ($1, $2, $3, $4, $5, $6)`,
        [sessionId, searchId, v.name, v.terminal ?? null, v.gate ?? null, v.level ?? null]
      );
    }
  } catch {
    // Non-blocking
  }
}

export async function updateRecommendationClicked(
  sessionId: string,
  vendorName: string
): Promise<void> {
  const client = await getDbClient();
  if (!client) return;
  try {
    await client.pool.query(
      `update recommendation_events set clicked_at = now()
       where id = (
         select id from recommendation_events
         where session_id = $1 and vendor_name = $2 and clicked_at is null
         order by shown_at desc limit 1
       )`,
      [sessionId, vendorName]
    );
  } catch {
    // Non-blocking
  }
}
