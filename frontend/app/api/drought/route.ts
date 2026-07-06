import { NextResponse } from "next/server";
import { getDroughtData } from "@/lib/data";

let _cache: ReturnType<typeof getDroughtData> | null = null;
let _cacheTime = 0;

export async function GET() {
  const now = Date.now();
  if (!_cache || now - _cacheTime > 600_000) {
    _cache = getDroughtData();
    _cacheTime = now;
  }
  return NextResponse.json(_cache);
}
