import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using 1.5 flash since flash-lite might not be in this old SDK version, but we can try 'gemini-1.5-flash-latest'

export async function analyzeIncidentReport(text: string, imageBase64?: string, mimeType?: string): Promise<string> {
  const prompt = `You are an expert disaster response analyst for the Jakarta Pulse application. 
A field officer has submitted an incident report via Telegram.
Analyze the report and extract key information (Location, Severity, Recommended Immediate Actions).
If an image is provided, analyze the visual evidence of the disaster (e.g., fire size, drought severity).
Please provide your response in English, formatted in Markdown for Telegram.

Officer's Message:
"${text}"
`;

  const contents: any[] = [prompt];
  
  if (imageBase64 && mimeType) {
    contents.push({
      inlineData: {
        data: imageBase64,
        mimeType: mimeType,
      }
    });
  }

  const result = await model.generateContent(contents);
  const response = await result.response;
  return response.text() || "No analysis could be generated.";
}
