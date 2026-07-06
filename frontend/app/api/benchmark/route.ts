import { NextResponse } from "next/server";
import { generateBenchmark } from "@/lib/data";

export async function GET() {
  return NextResponse.json(generateBenchmark());
}
