import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import axios from "axios";
import { Resend } from "resend";
import dotenv from "dotenv";

// Load environment variables from .env file in production / local
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Robust JSON parsing utility to make sure model output format issues don't crash
function safeParseJsonArray(text: string): string[] {
  if (!text) return [];
  try {
    let cleaned = text.trim();
    // Strip markdown code blocks if the model wrapped the JSON in backticks
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
      cleaned = cleaned.replace(/\s*```$/, "");
    }
    cleaned = cleaned.trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item));
    }
    return [];
  } catch (e) {
    console.error("Failed to parse JSON array from Gemini response, fallback parsing matches:", text, e);
    const titles: string[] = [];
    const lines = text.split("\n");
    for (let line of lines) {
      line = line.replace(/^[-*•\d.]+\s*/, "").replace(/^["']|["']$/g, "").trim();
      if (line && line.length > 5 && line.length < 150) {
        titles.push(line);
      }
    }
    return titles.slice(0, 5);
  }
}

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
      model: "gemini-3.5-flash",
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

app.post("/api/ai/ask-question", async (req, res) => {
  const { content, question } = req.body;
  const ai = getAI();
  if (!ai) return res.status(503).json({ error: "AI service unavailable" });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert co-reader and intelligence analyst. Answer the following question about the provided article content. Keep your response insightful, objective, and clear.

Question: ${question}

Article Content:
${content}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    res.json({ answer: result.text });
  } catch (error: any) {
    console.error("Ask question error:", error?.message || error);
    res.status(500).json({ error: error?.message || "AI assistant failed to answer" });
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
      model: "gemini-3.5-flash",
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
      model: "gemini-3.5-flash",
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
    res.json({ titles: safeParseJsonArray(result.text || "[]") });
  } catch (error: any) {
    console.error("Titles error:", error?.message || error);
    const status = error?.status === "UNAVAILABLE" ? 503 : 500;
    res.status(status).json({ error: error?.message || "Failed to generate titles" });
  }
});

function generateFallbackStory(title: string, category: string): string {
  const normalizedTitle = title ? title.toLowerCase() : "";
  const cat = category || "General Feed";

  let body = "";

  if (normalizedTitle.includes("ethics") || normalizedTitle.includes("agi") || normalizedTitle.includes("ai")) {
    body = `
The acceleration of computing power has brought us to a profound crossroad. As deep learning models transition from narrow task execution into broader cognitive agents, we are forced to redefine the boundaries of artificial intelligence. It is no longer a question of *when* these models will influence our lives, but *to what degree* we can align their development with fundamental human values.

> "The true metric of technology is not its absolute power, but the refinement of its alignment with human thriving." 
> — Synapse Editorial Board

## Core Architectures and Modern Paradigms

Synthesizing human intent is not merely a technical challenge of fine-tuning weights. It requires a fundamental paradigm shift in how we structure our systems:

1. **Neuro-Symbolic Integration**: Fusing deep neural learning with rule-based symbolic reasoning to establish deterministic guardrails.
2. **Dynamic Constitutional Training**: Training models in multi-agent environments where reward mechanisms are tied to robust ethical frameworks.
3. **Decentralized Verification Arrays**: Running independent validation nodes to monitor model boundaries in real-time.

## The Human-Machine Synthesis

As we build these systems, our goal must not be substitution, but amplification. Designing interfaces that facilitate bidirectional understanding allows humans and machines to operate as high-bandwidth cognitive collectives. This symbiotic union holds the key to solving our most complex scientific, social, and philosophical frontiers.
    `;
  } else if (normalizedTitle.includes("ui") || normalizedTitle.includes("design") || normalizedTitle.includes("desktop") || normalizedTitle.includes("interface")) {
    body = `
The classical computer interface has remained practically unchanged for over three decades. Folders, windows, and pointer cursors are desktop abstractions built for another century. Today, as context-aware computing and spatial technologies reach maturity, we are witnessing the dawn of a new design ecosystem.

> "The screen is no longer a canvas; it is an active conversational partner."
> — Curator's Lounge, v4.0

## Principles of Fluid Spatial Design

Creating interfaces for this new paradigm requires departing from static layouts. Instead, we must embrace three core pillars of responsive spatial architecture:

* **Intent-Driven Contextuality**: Interfaces that dynamically reconstruct themselves based on user gaze, biometric rhythms, and historical tasks.
* **Low-Latency Kinetic Feedback**: Multi-modal physical response structures that synchronize virtual actions with high-fidelity haptic feedback.
* **Cross-Reality Semantic Interoperability**: Seamlessly translating digital assets from 2D viewports into spatial environments.

## The Next Interface Shift

We are moving away from traditional app boundaries toward dynamic, agentic interactions. In this near future, you will not open an application; you will orchestrate streams of intelligence that manifest contextually, precisely when and where your cognitive focus demands them.
    `;
  } else if (normalizedTitle.includes("quantum") || normalizedTitle.includes("cryptograph") || normalizedTitle.includes("cipher")) {
    body = `
In a fully connected digital ecosystem, security is not just a feature—it is the bedrock of sovereignty. As quantum processing capabilities advance toward cryptographic viability, our current secure standards risk obsolescence. The race is on to deploy encryption architectures that remain impenetrable to quantum attacks.

> "Security is a continuous movement of adaptive resistance, not a final state of perfection."
> — Cyber-Security Network Bulletin

## Pillars of Quantum-Resistant Sovereignty

To secure modern communications, Lumina is pioneering a multi-layered cryptographic paradigm across all network entrypoints:

1. **Lattice-Based Encryption Protocols**: Standardizing complex mathematical lattices that are theoretically impossible for quantum computers to solve.
2. **Ephemeral Quantum Key Distribution (QKD)**: Utilizing fiber-optic networks to send keys encoded in single light photons, ensuring immediate detection of any eavesdropping.
3. **Multi-Signature Peer Authentication**: Distributing trust across diverse, independent verification nodes to eliminate single failure routes.

## Securing the Neural Streams

As high-speed cognitive networks expand, safeguarding the sanity of data transfers becomes paramount. We are building the next generation of transport architectures to guarantee that human and machine transmissions remain absolutely private, verified, and safe from observation.
    `;
  } else {
    // Generically beautiful essay
    body = `
Every epoch has a defining technological narrative. In ours, it is the integration of computing arrays, design philosophy, and human creativity. As unified information layers begin to synthesize complex human systems, we are entering a phase of rapid evolutionary discovery.

> "True digital craft is the elegant marriage of complex technological backends with frictionless, human-centric design."
> — Synapse Publication, 2026

## The Architectural Blueprint

To thrive in the age of dynamic information, we must coordinate our design systems with complex backend pipelines:

* **Bidirectional Interface Bridges**: Crafting fluid UIs that respond instantly to incoming intelligence streams.
* **Decentralized Cognitive Nodes**: Operating processing modules locally to ensure absolute speed and data security.
* **Semantic Grounding Models**: Ensuring all output data is strictly linked to authentic, helpful real-world evidence.

## Looking Toward the Horizon

The journey has just begun. As we build platforms that elevate discussions, spark ideas, and foster creative spaces, we are laying the foundational plumbing of tomorrow's intellectual community.
    `;
  }

  return `
*This synthesis represents a collaborative curated narrative of the Synapse editorial array.*

${body}

---

*Transmission finalized. Published in **${cat}**.*
  `.trim();
}

app.post("/api/ai/generate-story", async (req, res) => {
  const { title, category } = req.body;
  const ai = getAI();
  if (!ai) {
    console.warn("AI service not configured, returning custom fallback story content.");
    return res.json({ content: generateFallbackStory(title, category) });
  }

  try {
    const prompt = `You are a visionary futurist and lead curator of "Synapse".
Write an extensive, engaging, and highly professional blog post or analytical essay on the following topic.
Topic Title: "${title}"
Category: "${category || 'General'}"

Ensure the output is beautifully formatted in Markdown, with:
- A strong introductory hook (1-2 paragraphs)
- Highly structured subheadings (using markdown ## or ###) discussing the core architectures, challenges, and future paradigm shifts
- At least one insightful blockquote (using markdown >)
- A detailed bullet or numbered list
- A concluding thought reflecting on the human impact of this technological narrative

Make the writing style sophisticated, intellectual, and exciting (matching a premium technology publication style). Return ONLY the Markdown content. Do NOT include the article title as an h1 at the very beginning (as it's already displayed in the UI).`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    res.json({ content: result.text });
  } catch (error: any) {
    console.error("Story generation error, returning custom fallback story content instead:", error?.message || error);
    res.json({ content: generateFallbackStory(title, category) });
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
