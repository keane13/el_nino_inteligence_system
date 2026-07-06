import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug ? slug.join("/") : "";
  const search = req.nextUrl.search;
  const url = `${BACKEND}/api/forecast/${path}${search}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/forecast] Backend error:", err);
    return NextResponse.json({ error: "Forecast backend unavailable" }, { status: 503 });
  }
}
