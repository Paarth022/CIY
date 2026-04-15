import { getSystemPrompt } from '@/lib/systemPrompt';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { AI_PROVIDERS } from '@/lib/providers';

// Simple in-memory rate limiting: 3 requests per IP per minute
// Note: In production on Vercel Edge this limits per edge node, which is fine for MVP.
const rateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const minuteAgo = now - 60000;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, [now]);
    return true;
  }
  
  const requests = rateLimits.get(ip).filter(time => time > minuteAgo);
  requests.push(now);
  rateLimits.set(ip, requests);
  
  return requests.length <= 3;
}

function parseGeneratedCode(text) {
  const files = {};
  // Match === filename === \n content \n === END ===
  const blockRegex = /===\s*(.*?)\s*===[\r\n]+([\s\S]*?)===\s*END\s*===/g;
  let match;
  let pluginName = "GeneratedPlugin";

  while ((match = blockRegex.exec(text)) !== null) {
    const fileName = match[1].trim();
    // Sometimes the model wraps the code block in markdown ```java ... ```
    let content = match[2].trim();
    if (content.startsWith('```')) {
      const firstNewline = content.indexOf('\n');
      const lastBackticks = content.lastIndexOf('```');
      if (firstNewline !== -1 && lastBackticks !== -1) {
        content = content.substring(firstNewline + 1, lastBackticks).trim();
      }
    }
    
    files[fileName] = content;
    
    if (fileName.endsWith('.java')) {
      const nameMatch = content.match(/public\s+(?:final\s+)?class\s+(\w+)/);
      if (nameMatch) {
        pluginName = nameMatch[1];
      }
    }
  }
  return { files, pluginName };
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    
    if (!checkRateLimit(ip)) {
      return Response.json(
        { success: false, error: 'Please wait before generating again. (Max 3/minute)' },
        { status: 429 }
      );
    }

    const { description, version, complexity, provider, apiKey } = await req.json();

    if (!description || !provider || !apiKey) {
      return Response.json(
        { success: false, error: 'Missing required fields: description, provider, or apiKey' },
        { status: 400 }
      );
    }

    const systemPrompt = getSystemPrompt(version || '1.21.4', complexity || 'Medium', description);
    
    let generatedText = '';
    const provConfig = AI_PROVIDERS.find(p => p.id === provider);
    
    if (!provConfig) {
      return Response.json({ success: false, error: 'Invalid AI provider selected' }, { status: 400 });
    }

    // --- CALL GEMINI ---
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: provConfig.model,
        systemInstruction: systemPrompt
      });
      const result = await model.generateContent(description);
      generatedText = result.response.text();
    }
    
    // --- CALL CLAUDE ---
    else if (provider === 'claude') {
      const anthropic = new Anthropic({ apiKey: apiKey });
      const response = await anthropic.messages.create({
        model: provConfig.model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Generate the requested plugin.' }]
      });
      generatedText = response.content[0].text;
    }
    
    // --- CALL OPENAI ---
    else if (provider === 'openai') {
      const openai = new OpenAI({ apiKey: apiKey });
      const response = await openai.chat.completions.create({
        model: provConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the requested plugin.' }
        ]
      });
      generatedText = response.choices[0].message.content;
    }

    // PARSE RESPONSE
    const { files, pluginName } = parseGeneratedCode(generatedText);
    
    if (Object.keys(files).length === 0) {
      return Response.json({ 
        success: false, 
        error: "AI did not generate files in the expected format. Please try again.",
        raw: generatedText // useful for debugging
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      data: {
        files,
        pluginName
      }
    });
    
  } catch (error) {
    console.error("Generate API Error:", error);
    return Response.json(
      { success: false, error: error?.message || 'An error occurred during generation' },
      { status: 500 }
    );
  }
}
