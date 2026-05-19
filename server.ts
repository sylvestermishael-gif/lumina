import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import axios from "axios";
import { Resend } from "resend";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
      return null;
    }
    aiClient = new GoogleGenAI({ 
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

// Resend Client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// AI Endpoints
app.post("/api/ai/summarize", async (req, res) => {
  const { content } = req.body;
  const ai = getAI();
  if (!ai) return res.status(503).json({ error: "AI service unavailable" });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Summarize the following blog post in 2-3 sentences. Keep it engaging.\n\n${content}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    res.json({ summary: result.text });
  } catch (error: any) {
    console.error("Summarization error:", error?.message || error);
    const status = error?.status === "UNAVAILABLE" ? 503 : 500;
    res.status(status).json({ error: error?.message || "Failed to generate summary" });
  }
});

app.post("/api/ai/writing-assistant", async (req, res) => {
  const { content, task } = req.body; // task: "improve", "complete", "shorten"
  const ai = getAI();
  if (!ai) return res.status(503).json({ error: "AI service unavailable" });

  const prompts: Record<string, string> = {
    improve: `Improve the grammar, tone, and narrative flow of this blog post. Make it professional yet conversational. Return ONLY the improved text:\n\n${content}`,
    complete: `Based on the context, finish this paragraph or section naturally. Return ONLY the new content:\n\n${content}`,
    shorten: `Condense this text for maximum impact without losing core meaning. Return ONLY the condensed text:\n\n${content}`,
  };

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompts[task] || prompts.improve,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    res.json({ result: result.text });
  } catch (error: any) {
    console.error("Writing assistant error:", error?.message || error);
    const status = error?.status === "UNAVAILABLE" ? 503 : 500;
    res.status(status).json({ error: error?.message || "AI assistant failed" });
  }
});

app.post("/api/ai/titles", async (req, res) => {
  const { content, currentTitle } = req.body;
  const ai = getAI();
  if (!ai) return res.status(503).json({ error: "AI service unavailable" });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 viral, SEO-optimized, and catchy titles for this blog content: "${content.substring(0, 500)}". ${currentTitle ? `Current Title: "${currentTitle}". Ensure suggestions match the existing tone.` : ""}`,
      config: { 
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    res.json({ titles: JSON.parse(result.text || "[]") });
  } catch (error: any) {
    console.error("Titles error:", error?.message || error);
    const status = error?.status === "UNAVAILABLE" ? 503 : 500;
    res.status(status).json({ error: error?.message || "Failed to generate titles" });
  }
});

// Paystack Integration
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

app.post("/api/paystack/initialize", async (req, res) => {
  if (!PAYSTACK_SECRET) return res.status(503).json({ error: "Payment service unavailable" });
  
  const { email, amount, metadata } = req.body;
  
  try {
    const response = await axios.post("https://api.paystack.co/transaction/initialize", {
      email,
      amount: amount * 100, // Paystack expects kobo/cents
      metadata,
      callback_url: `${process.env.APP_URL || 'http://localhost:3000'}/settings?payment=success`
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json"
      }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error("Paystack Init Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initialize payment" });
  }
});

app.get("/api/paystack/verify/:reference", async (req, res) => {
  if (!PAYSTACK_SECRET) return res.status(503).json({ error: "Payment service unavailable" });
  
  const { reference } = req.params;
  
  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`
      }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error("Paystack Verify Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

app.post("/api/newsletter/subscribe", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // In a real app, you might save to Firestore here too if you don't do it from client
    // For this app, the client already saves to Firestore, but the user expects an email.
    
    if (resend) {
      await resend.emails.send({
        from: 'Synapse <onboarding@resend.dev>', // Resend default testing address
        to: email,
        subject: 'Neural Uplink Secured: Welcome to Synapse',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #ffffff; padding: 40px; border-radius: 24px;">
            <h1 style="text-transform: uppercase; letter-spacing: -0.05em; font-weight: 900; italic: true;">Synapse <span style="color: #6366f1;">Discovery</span></h1>
            <p style="font-size: 18px; line-height: 1.6; color: #94a3b8;">Human, your connection to the grid has been established.</p>
            <p style="color: #94a3b8;">You are now part of a community of 12,000+ pioneers receiving the definitive synthesis of AI, design philosophy, and digital craftsmanship.</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em;">
              Neural Uplink Finalized | Synapse Archive
            </div>
          </div>
        `
      });
      console.log(`Confirmation email sent to ${email}`);
    } else {
      console.warn("RESEND_API_KEY is missing. Email skipped.");
    }

    res.json({ success: true, message: "Subscription successful" });
  } catch (error: any) {
    console.error("Newsletter email error:", error);
    res.status(500).json({ error: "Failed to send confirmation email" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
