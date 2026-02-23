import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    has_service_key: !!process.env.SUPABASE_SERVICE_KEY,
    has_service_key_dev: !!process.env.SUPABASE_SERVICE_KEY_DEV,
    has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}
