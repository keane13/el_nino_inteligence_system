import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Backend responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.reply || "No response." });
  } catch (error) {
    console.error("Chat Proxy Error:", error);
    return NextResponse.json({ 
      reply: "Maaf, backend sedang tidak dapat diakses saat ini. Pastikan server Python (FastAPI) sudah berjalan di port 8000." 
    });
  }
}
