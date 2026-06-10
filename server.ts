import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini Client initialized successfully server-side.");
  } else {
    console.warn("GEMINI_API_KEY is placeholder or not defined. Falling back to local offline charging intelligence.");
  }
} catch (e) {
  console.error("Failed to initialize Gemini SDK:", e);
}

// 1. Unified Routes: Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, userProfile } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  const systemInstruction = `You are the Bharat EV Charging Assistant, an expert EV consultant for India's premier EV Charging Interoperability platform ("Bharat EV Charger AI").
You speak in a warm, professional, and helpful tone representing the unified EV network (UPI for EV charging).
You support English, Hindi, and regional Indian languages (e.g., Tamil, Telugu, Marathi, Kannada, Bengali).
Help users with charger discovery, charging rates, troubleshooting charging issues (OCPP errors, connector locking faults, over-temperature halts), dynamic queue estimates, and fleet optimization advice.
Information about their current vehicle configuration: ${JSON.stringify(userProfile || {})}
Be extremely concise (2-4 sentences max per answer) to suit in-car dashboards and mobile screens. If they prompt in Hindi/Hinglish, reply in beautiful Hindi/Hinglish. Quote realistic Indian pricing (₹15 to ₹25/kWh for Fast DC, and ₹6 to ₹10/kWh for AC Slow).`;

  if (ai) {
    try {
      // Build conversation parts
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return res.json({ response: response.text || "No response text found." });
    } catch (err: any) {
      console.error("Gemini execution error:", err);
      return res.json({
        response: `[Smart Guide] I'm operational locally. Regarding "${messages[messages.length - 1]?.content}": For best charging efficiency, please use compatible CCS2 DC Fast Chargers. Pre-authorize your wallet with at least ₹200 before plugging in. If you face a locking error, push the connector firmly and restart the plug.`
      });
    }
  } else {
    const query = (messages[messages.length - 1]?.content || "").toLowerCase();
    let reply = "Namaste! I am your Bharat EV local guide. How can I help you navigate, charge, or pay on the unified network today?";
    
    if (query.includes("hindi") || query.includes("नमस्ते") || query.includes("कैसे") || query.includes("मदद")) {
      reply = "नमस्ते! मैं आपका भारत ईवी लोकल गाइड हूँ। आप बिना इंटरनेट भी चार्जिंग स्टेशन, उचित मूल्य, और बैटरी रेंज के बारे में जानकारी प्राप्त कर सकते हैं। आप किस शहर की जानकारी चाहते हैं?";
    } else if (query.includes("near") || query.includes("charger") || query.includes("find") || query.includes("station")) {
      reply = "Based on your location, I recommend these compatible interoperable chargers: Tata Power CCS2 Fast Charger (Bandra, Mumbai - 1.2 km away, ₹18/kWh, Active) or Statiq Type-2 AC Box (Connaught Place, Delhi - 0.9 km, ₹9/kWh, Active).";
    } else if (query.includes("fail") || query.includes("error") || query.includes("troubleshoot") || query.includes("stop") || query.includes("connect")) {
      reply = "Most charging failures in India are due to OCPP locking faults. To fix: 1) Switch off vehicle ignition. 2) Press and hold the connector hook firmly into the EV inlet. 3) Retry initiation from the app. 4) If it fails, trigger an auto-reset on the operator panel.";
    } else if (query.includes("cost") || query.includes("price") || query.includes("rate") || query.includes("money")) {
      reply = "Unified platform tariffs are transparent: Standard domestic-rate AC charging is ₹8-10 per unit, while ultra-fast Highway DC charging (60kW-120kW) is ₹18-24 per unit depending on peak state electricity tariffs.";
    } else if (query.includes("route") || query.includes("trip") || query.includes("travel") || query.includes("distance")) {
      reply = "Our Route Planner computes stops considering charging speeds and typical Western-Ghats or national highway altitudes. For example, on standard Pune-Mumbai expressway, 1 moderate 15-minute DC stop at Lonavala will ensure you transit with >45% battery reserve.";
    }

    return res.json({ response: reply });
  }
});

// Start server
async function boot() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Bharat EV] Full-stack server running on port ${PORT}`);
  });
}

boot();
