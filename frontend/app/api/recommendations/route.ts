import { NextResponse } from "next/server";
import { getComplaints, generatePredictions, generateRecommendations } from "@/lib/data";

export async function GET() {
  const complaints = getComplaints();
  const predictions = generatePredictions(complaints);
  const recs = generateRecommendations(complaints, predictions);
  return NextResponse.json(recs);
}
