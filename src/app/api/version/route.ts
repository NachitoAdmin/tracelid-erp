import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: 'supabase-no-prisma-2026-02-19',
    buildTime: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
  })
}
