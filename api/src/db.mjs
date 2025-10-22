import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()
const { Pool } = pg

let cs = (process.env.DATABASE_URL || '').trim()
if (cs && !/sslmode=/i.test(cs)) {
  cs += (cs.includes('?') ? '&' : '?') + 'sslmode=require'
}
export const pool = new Pool(
  cs ? { connectionString: cs, ssl: { rejectUnauthorized: false } }
     : { host: process.env.PGHOST, port: Number(process.env.PGPORT || 5432),
         database: process.env.PGDATABASE, user: process.env.PGUSER,
         password: process.env.PGPASSWORD, ssl: { rejectUnauthorized: false } }
)