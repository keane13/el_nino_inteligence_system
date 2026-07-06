import { NextResponse } from "next/server";
import { fetchPredictionsFromBigQuery } from "@/lib/bigquery";

export async function GET() {
  const predictions = await fetchPredictionsFromBigQuery();
  return NextResponse.json(predictions);
}
