import { GoogleGenAI } from "@google/genai";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface TraderDNA {
  archetype: string;
  traits: string[];
  biases: string[];
  summary: string;
  riskScore: number;
  disciplineScore: number;
  updatedAt: string;
}

export interface DocumentaryScript {
  title: string;
  scenes: {
    time: string;
    narration: string;
    onScreenText: string;
    visualHint: string; 
    sentiment: 'positive' | 'negative' | 'neutral';
    metric?: string;
  }[];
  closingReflectionHindi: string;
  closingReflectionEnglish: string;
}

export const analyzeTraderDNA = async (userId: string, trades: any[]) => {
  if (trades.length < 5) return null;

  const prompt = `
    Analyze these latest trading logs for a trader in India. 
    Trades: ${JSON.stringify(trades.slice(0, 20))}
    
    You are a professional performance coach. Provide a DEEP behavioral analysis.
    
    Identify:
    1. Archetype: A punchy title (e.g., 'The Revenge Seeker', 'Analysis Paralysis Artist', 'Disciplined Sniper', 'The Hesitant Pro').
    2. Traits: 3 specific behavioral traits observed in the entry/exit patterns.
    3. Biases: Behavioral psychology biases (e.g., Sunk Cost Fallacy, Disposition Effect, Overconfidence).
    4. Summary: A 2-sentence brutal but helpful summary of their current psychological state.
    5. Risk Score (0-100): High score = reckless/high risk.
    6. Discipline Score (0-100): High score = strictly follows rules/stop-loss.
    
    Format accurately as JSON: { "archetype": "...", "traits": [...], "biases": [...], "summary": "...", "riskScore": 0, "disciplineScore": 0 }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const dnaData = JSON.parse(result.text || "{}");

    const dna: TraderDNA = {
      ...dnaData,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, "dna", userId), dna);
    return dna;
  } catch (error) {
    console.error("DNA Analysis Error:", error);
    return null;
  }
};

export const getPrediction = async (trades: any[], currentSettings: any) => {
  if (trades.length < 3) return "Insufficient data for prediction.";

  const prompt = `
    Based on past trades: ${JSON.stringify(trades.slice(0, 10))}
    Current User Limits: ${JSON.stringify(currentSettings)}
    
    Predict the most likely psychological mistake this trader will make in the next session.
    Keep it sharp, professional, and helpful. Max 20 words.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return result.text?.trim() || "Stay disciplined.";
  } catch (error) {
    return "Stay disciplined. Focus on your process.";
  }
};

export const generateWeeklyDocumentaryScript = async (trades: any[]) => {
  if (trades.length === 0) return null;

  const prompt = `
    Create a LEGENDARY HISTORIC weekly documentary script in HINDI for a trader's performance.
    Trades Data: ${JSON.stringify(trades)}
    
    Narrator Style: Voice of a powerful epic narrator.
    Visual Style: A mix of 'Cinematic Cartoons' and 'Stock Market Atmosphere'.
    
    Return JSON:
    { 
      "title": "A grand cinematic title in ENGLISH (e.g., 'The Week of Reckoning')", 
      "scenes": [ 
        { 
          "time": "0:0x", 
          "narration": "Deep, powerful HINDI narration in Devanagari script. Max 25 words.",
          "onScreenText": "Short, punchy ENGLISH callout. Max 5 words.",
          "visualHint": "Detailed prompt for cinematic imagery", 
          "sentiment": "positive|negative|neutral", 
          "metric": "Include ₹ value if relevant" 
        } 
      ],
      "closingReflectionHindi": "A historic Hindi proverb about the week's destiny.",
      "closingReflectionEnglish": "The week's core lesson in English for the screen."
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      const text = result.text;
      if (!text) throw new Error("Empty response from AI");
      return JSON.parse(text) as DocumentaryScript;
    } catch (parseError) {
      console.error("Parse Error:", parseError);
      return {
        title: "The Trader's Journey",
        scenes: [{
          time: "0:01",
          narration: "Bazaar ki gehraiyon mein, ek naya sangharsh shuru hota hai.",
          onScreenText: "THE JOURNEY BEGINS",
          visualHint: "stormy market, digital charts",
          sentiment: "neutral",
          metric: "₹0"
        }],
        closingReflectionHindi: "Sabr hi sarvottam rann-neeti hai.",
        closingReflectionEnglish: "Patience is the ultimate strategy."
      };
    }
  } catch (error) {
    console.error("Documentary Script Error:", error);
    return null;
  }
};

export const generateTradeDocumentaryScript = async (trade: any, genre: string = 'Conversational Analysis') => {
  const points = Math.abs((trade.exit || 0) - (trade.entry || 0));
  
  const prompt = `
    Create a relaxed, friendly trade analysis script in HINDI.
    Trade Details:
    - ID: ${trade.index}
    - PnL: ₹${trade.pnl}
    - Strategy: ${trade.strategy}
    - Entry Price: ${trade.entry || 'N/A'}
    - Exit Price: ${trade.exit || 'N/A'}
    - Points Captured: ${points}
    - Mistakes: ${trade.mistakes?.join(', ') || 'None'}
    - Rules Followed: ${trade.rules?.length || 0} rules
    
    Narrator Style: A calm, normal person explaining trade execution in HINDI. 
    Flow: Ensure the narration feels like a continuous conversation without dramatic pauses.
    
    Return JSON:
    { 
      "title": "Trade Breakdown: ${trade.strategy}",
      "scenes": [ 
        { 
          "time": "0:01", 
          "narration": "Namaste. Chaliye is ${trade.index} trade ka analysis karte hain. Humne stock ko ${trade.entry} price par kharida jab setup ne entry trigger ki.",
          "onScreenText": "ENTRY: ${trade.entry} | SETUP OK",
          "visualHint": "Cinematic 3D render of a futuristic trading cockpit, high-tech screens showing ${trade.entry} entry price, professional atmosphere, soft neon depth of field", 
          "sentiment": "positive", 
          "metric": "${trade.entry}" 
        },
        { 
          "time": "0:05", 
          "narration": "Target achieve hone par humne ${trade.exit} par exit kiya, aur kul ${points} points capture kiye. Hamari strategy ${trade.strategy} bilkul sahi rahi.",
          "onScreenText": "EXIT: ${trade.exit} | ${points} POINTS",
          "visualHint": "Cinematic cartoon of a trader celebrating in a digital trading room, golden charts rising in background, high-detail octane render style, ${trade.pnl >= 0 ? "shining gold aura" : "determined focus"}", 
          "sentiment": "${trade.pnl >= 0 ? 'positive' : 'neutral'}", 
          "metric": "₹${Math.abs(trade.pnl)}" 
        },
        { 
          "time": "0:10", 
          "narration": "Is trade mein hamari mistakes ${trade.mistakes?.length > 0 ? trade.mistakes.join(' aur ') : 'kuch bhi nahi'} rahi. Rules follow karne ka yehi nateeja hai.",
          "onScreenText": "${trade.mistakes?.length > 0 ? 'MISTAKE ALERT' : 'DISCIPLINE WIN'}",
          "visualHint": "A high-tech digital checklist floating in a server room, green holographic ticks, cinematic lighting, ${trade.mistakes?.length > 0 ? "subtle red warning glow" : "pure tech-blue aesthetic"}", 
          "sentiment": "${trade.mistakes?.length > 0 ? 'negative' : 'positive'}", 
          "metric": "${trade.mistakes?.length || 0} Mistakes" 
        }
      ],
      "closingReflectionHindi": "A simple Hindi takeaway about discipline or strategy based on this specific trade.",
      "closingReflectionEnglish": "Final Verdict: ${trade.pnl >= 0 ? 'Disciplined Execution' : 'Room for Improvement'}"
    }
    
    IMPORTANT: Narration must be in HINDI. OnScreenText must be in ENGLISH.
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    try {
      const text = result.text;
      if (!text) throw new Error("Empty response from AI");
      return JSON.parse(text) as DocumentaryScript;
    } catch (parseError) {
      return {
        title: "Single Combat: The Trade",
        scenes: [{
          time: "0:01",
          narration: "Ek akela yoddha, bazaar ke maidan mein.",
          onScreenText: "ONE TRADE, ONE DESTINY",
          visualHint: "lonely warrior, bright screens",
          sentiment: trade.pnl >= 0 ? 'positive' : 'negative',
          metric: `₹${Math.abs(trade.pnl)}`
        }],
        closingReflectionHindi: "Har sauda ek naya sabaq hai.",
        closingReflectionEnglish: "Every trade is a new lesson."
      };
    }
  } catch (error) {
    console.error("Trade Documentary Error:", error);
    return null;
  }
};

export const processVoiceTranscript = async (transcript: string) => {
  const prompt = `
    You are an elite Indian Stock Market Analysis AI. Your task is to extract structured trading data from a trader's voice journal entry.
    The entry could be in English, Hindi (Devanagari), or Hinglish (Hindi written in Roman script).
    
    TRANSCRIPT to analyze: "${transcript}"
    
    CORE EXTRACTION RULES:
    1. Asset: Map to 'Bank Nifty', 'Nifty 50', 'Finnifty', 'Midcap Nifty', 'Sensex', or specific stock names (e.g., 'RELIANCE').
    2. Type: 'Buy' or 'Sell'. 'CE'/'Call' implies Buy, 'PE'/'Put' implies Sell.
    3. Quantity: 
       - If lots mentioned, convert to quantity using: Nifty=50, Bank Nifty=15, Finnifty=40, Midcap=75.
       - Example: "2 lot bank nifty" -> 30.
    4. Price/Exit/SL/TP: Extract strictly as numbers.
       - If user says "10 point sl", calculate absolute SL value based on entry and type.
       - Calculate 'exit' from PnL if user says "book kiya 5000 profit" and quantity is known.
    5. Emotion: Map to 'Happy', 'Neutral', 'Angry', 'Frustrated', 'Fearful', 'Greedy'.
    6. Mistakes: Identify: ['Fear', 'Overtrading', 'Late Entry', 'Early Exit', 'No Setup', 'Reversed Trade', 'Averaging Loss'].
    
    INTELLECTUAL INFERENCE:
    - If user says "Risk reward was 1:2", ensure SL and TP reflect this ratio.
    - If user says "Scalping kiya", set strategy to "Scalping".
    
    Return ONLY a valid JSON object.
    Format: { 
      "asset": "string", 
      "type": "Buy"|"Sell", 
      "quantity": number, 
      "price": number, 
      "exit": number, 
      "sl": number, 
      "tp": number, 
      "strategy": "Intraday"|"Scalping"|"Swing", 
      "emotion": "string", 
      "mistakes": string[], 
      "summary": "string",
      "pnl": number (if mentioned)
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Voice Processing Error:", error);
    return null;
  }
};

export interface CoachAdvice {
  criticalInsight: string;
  tacticalDrills: string[];
  brutalTruth: string;
}

export const getCoachAdvice = async (dna: TraderDNA, trades: any[]) => {
  const prompt = `
    You are an elite Performance Trading Coach specializing in behavioral psychology.
    The trader's DNA profile is: ${JSON.stringify(dna)}
    Recent trades summary: ${JSON.stringify(trades.slice(0, 10).map(t => ({ pnl: t.pnl, strategy: t.strategy, mistakes: t.mistakes })))}

    The trader has a LOW discipline score (${dna.disciplineScore}/100). 
    Provide a "Coach Mode" intervention.
    
    1. Critical Insight: Identify the single biggest psychological block holding them back.
    2. Tactical Drills: 3 actionable steps to perform before their next trade to fix this specific bias.
    3. Brutal Truth: A short, high-impact sentence that cuts through their excuses.
    
    Keep the tone firm, professional, and slightly aggressive (like an elite sports coach).
    
    Format accurately as JSON:
    {
      "criticalInsight": "...",
      "tacticalDrills": ["...", "...", "..."],
      "brutalTruth": "..."
    }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return JSON.parse(result.text || "{}") as CoachAdvice;
  } catch (error) {
    console.error("Coach Advice Error:", error);
    return null;
  }
};

export const getAlterEgoDirectives = async (personality: string, trades: any[]) => {
  const recentMistakes = trades
    .filter(t => t.mistakes && t.mistakes.length > 0)
    .slice(0, 5)
    .map(t => t.mistakes.join(', '))
    .join(' | ');

  const prompt = `
    You are the 'AlterEgo' of a trader - the most disciplined, god-level version of them.
    Personality Type: ${personality}
    Trader's Recent Mistakes: ${recentMistakes || "None, they are doing well."}
    Trader's Recent Performance: ${JSON.stringify(trades.slice(0, 5).map(t => ({ pnl: t.pnl, strategy: t.strategy })))}
    
    Provide 3 ultra-specific 'Directives' for their next trade that specifically attack their recent mistakes using the ${personality} mindset.
    Keep it intense, motivating, and actionable. Max 12 words per directive.
    
    Return JSON: { "directives": ["...", "...", "..."], "affirmation": "..." }
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(result.text || "{}");
  } catch (error) {
    return { 
      directives: ["Shield your capital; no entry without a hard SL.", "Patience is your edge; wait for the A+ setup.", "One trade at a time; ignore the noise."],
      affirmation: "I am the master of my own discipline."
    };
  }
};
