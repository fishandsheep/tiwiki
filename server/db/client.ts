import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'

// Single DB file at repo root /data/ti.db (committed for reproducible builds).
const DB_PATH = resolve(process.cwd(), 'data/ti.db')
mkdirSync(dirname(DB_PATH), { recursive: true })

const sqlite = new Database(DB_PATH)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
export { schema }
