import { NextRequest, NextResponse } from "next/server";
import { getComplaints, computeSummary } from "@/lib/data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const kota = searchParams.get("kota");
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "priority_score";
  const limit = parseInt(searchParams.get("limit") || "300");
  const type = searchParams.get("type");

  let data = getComplaints();

  if (type === "summary") {
    return NextResponse.json(computeSummary(data));
  }

  if (status) data = data.filter(c => c.status === status);
  if (kota) data = data.filter(c => c.kota === kota);
  if (category) data = data.filter(c => c.category === category);

  data = [...data].sort((a, b) => {
    if (sort === "priority_score") return b.priority_score - a.priority_score;
    if (sort === "upvotes") return b.upvotes - a.upvotes;
    if (sort === "days_ago") return a.days_ago - b.days_ago;
    return 0;
  });

  return NextResponse.json(data.slice(0, limit));
}
