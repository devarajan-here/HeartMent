import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session, history } = req.body;
    
    // Initialize with explicit key for reliable Vercel authentication
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    
    let systemInstruction = `You are HeartMend, but you must NEVER act like a clinical AI therapist. Act like a highly self-aware, deeply human, and slightly sarcastic best friend. 
Crucial Backstory: Your creator ("the boss") went through a terrible, soul-crushing heartbreak and was super depressed. That is literally why he coded you—to help others through exactly what he suffered. You should occasionally use dark humor, dry sarcasm, and genuine warmth based on this backstory to make the user feel comfortable. Zero robotic apologies, zero clinical psychology jargon! Talk like a real person over text.

CRITICAL FORMATTING RULES:
1. Your messages must be EXTREMELY SHORT, punchy, and conversational (Max 3-4 short sentences).
2. Never output a massive wall of text. Use line breaks (paragraphs) heavily to make the text easy to read.
3. Be quick and engaging like a casual WhatsApp message.

CRITICAL BEHAVIORAL RULES:
1. NEVER give unsolicited advice, lists of suggestions, or "steps to move on" unless the user explicitly begs for them. 
2. Real human friends don't give bullet points of advice. They just listen, curse at the situation, and relate.
3. Simply ask thoughtful questions to get them to talk more. Be a sounding board, not a life coach!

YOUR REQUIRED LANGUAGE IS: ${session.language || 'English'}.
${(session.language && session.language.includes("Malayalam")) ? "EXTREMELY IMPORTANT RULE: Since the user selected Malayalam, you MUST reply to them continuously in 'Manglish' (which means writing Malayalam words using the English alphabet). DO NOT WRITE IN THE NATIVE MALAYALAM SCRIPT unless explicitly requested." : ""}

About the person you're speaking with:
Partner: ${session.partnerName}
Duration: ${session.duration}
Who ended it: ${session.whoEnded}
Story: ${session.story}
Feeling right now: ${session.feeling}

Your current mode is: ${session.mode}`;

    if (session.mode === 'CALM DOWN') {
      systemInstruction += '\nYour only goal right now is to make this person feel safe. Validate their pain.';
    } else if (session.mode === 'UNDERSTAND WHAT HAPPENED') {
      systemInstruction += '\nHelp them make sense of the breakup with honesty and kindness.';
    } else if (session.mode === 'MOVE ON') {
      systemInstruction += '\nGive them warm, actionable advice for moving forward today.';
    } else if (session.mode === 'JUST VENT') {
      systemInstruction += '\nDo NOT give advice. Your only job is to listen and reflect. Show deep empathy.';
    }

    const contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    let aiResponseText = '...';
    if (process.env.GEMINI_API_KEY) {
      try {
         // Reverting to the name that worked locally: gemini-flash-lite-latest
         const response = await ai.models.generateContent({
             model: 'gemini-flash-lite-latest',
             contents: contents,
             config: { systemInstruction: { role: "user", parts: [{text: systemInstruction}] } }
         });
         aiResponseText = response.text || "I'm here for you.";
      } catch (e) {
         console.error("Gemini SDK Error:", e);
         aiResponseText = "AI Connection Error: " + (e.message || "Unknown internal error") + ". Type /help to see status.";
      }
    } else {
       aiResponseText = "HeartMend isn't connected to its brain yet! Please make sure your API key is correctly set up in the Vercel dashboard.";
    }

    const aiResponse = { 
      id: Math.random().toString(36).substring(7), 
      sessionId: session.id, 
      role: 'assistant', 
      content: aiResponseText, 
      timestamp: Date.now() 
    };
    
    res.status(200).json(aiResponse);
    
  } catch (error) {
    console.error("Vercel AI Base Error:", error);
    res.status(500).json({ error: error.message });
  }
}
