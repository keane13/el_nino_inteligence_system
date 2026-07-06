import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const token = "8942942706:AAEISjs6E9ldLr7sAttxWCGgLu0nchHcLO0";
    const chatId = "641263426";

    let formattedText = `🚨 <b>El-Nino Critical Data Update</b> 🚨\n\n`;
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        formattedText += `<b>${index + 1}. ${item.district || "Region"}</b>\n`;
        formattedText += `⚡ <b>Action:</b> ${item.action}\n`;
        formattedText += `⚠️ <b>Rationale:</b> ${item.rationale}\n`;
        formattedText += `📈 <b>Estimated Impact:</b> ${item.estimated_impact}\n\n`;
      });
    } else {
      formattedText += `<pre><code class="language-json">${JSON.stringify(data, null, 2)}</code></pre>`;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedText,
        parse_mode: "HTML",
      }),
    });

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
