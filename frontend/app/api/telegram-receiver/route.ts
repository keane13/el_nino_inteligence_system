import { NextResponse } from "next/server";
import { uploadImageToGCS } from "@/lib/gcs";
import { analyzeIncidentReport } from "@/lib/gemini";

const TOKEN = "8942942706:AAEISjs6E9ldLr7sAttxWCGgLu0nchHcLO0";

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Check if the update contains a message
    if (!update.message) {
      return NextResponse.json({ success: true });
    }

    const { chat, text, caption, photo } = update.message;
    const chatId = chat.id;
    const messageText = text || caption || "No text provided.";

    let imageBase64: string | undefined = undefined;
    let mimeType: string | undefined = undefined;
    let gcsUrl: string | undefined = undefined;

    // Send "typing" action to Telegram to let the user know we're processing
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });

    // If there is a photo, download it from Telegram and upload to GCS
    if (photo && photo.length > 0) {
      // Get the highest resolution photo (usually the last in the array)
      const bestPhoto = photo[photo.length - 1];
      const fileId = bestPhoto.file_id;

      // 1. Get file path from Telegram
      const fileRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      
      if (fileData.ok) {
        const filePath = fileData.result.file_path;
        
        // 2. Download the actual file buffer
        const downloadRes = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${filePath}`);
        const arrayBuffer = await downloadRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // 3. Upload to Google Cloud Storage
        try {
          gcsUrl = await uploadImageToGCS(buffer, filePath);
        } catch (e: any) {
          console.error("GCS Upload Error (Ensure credentials are set!):", e);
          gcsUrl = "Upload Failed (Check Credentials)";
        }
        
        // 4. Convert to base64 for Gemini
        imageBase64 = buffer.toString('base64');
        mimeType = filePath.endsWith('png') ? 'image/png' : 'image/jpeg';
      }
    }

    // Pass everything to Gemini LLM
    const aiAnalysis = await analyzeIncidentReport(messageText, imageBase64, mimeType);

    // Construct final response text
    let replyText = `🤖 *AI Incident Analysis Report*\n\n${aiAnalysis}`;
    if (gcsUrl && gcsUrl !== "Upload Failed (Check Credentials)") {
      replyText += `\n\n📁 *Image securely archived to Google Cloud Storage:* [View Image](${gcsUrl})`;
    } else if (photo) {
      replyText += `\n\n⚠️ *Warning:* Image received but could not be saved to Cloud Storage due to missing Google Credentials on this server.`;
    }

    // Send reply back to Telegram
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
        parse_mode: "Markdown",
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Telegram Receiver Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
