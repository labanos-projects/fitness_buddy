#!/usr/bin/env node
// ─── Generate exercise illustrations via Gemini (Imagen / Nano Banana) ───────
// Usage:
//   GEMINI_API_KEY=xxx API_TOKEN=xxx node scripts/generate-illustrations.js [exercise-id]
//
// If exercise-id is provided, generates only that exercise.
// Otherwise generates all exercises that lack illustrations.
//
// Environment variables:
//   GEMINI_API_KEY  — Google AI API key
//   API_TOKEN       — Bearer token for the illustrations PHP endpoint
//   API_BASE        — Base URL for PHP backend (default: https://labanos.dk)
//   GEMINI_MODEL    — Model to use (default: gemini-2.0-flash-exp)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_TOKEN      = process.env.API_TOKEN;
const API_BASE       = process.env.API_BASE || 'https://labanos.dk/fitnessbuddy';
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.5-flash-image';

if (!GEMINI_API_KEY) { console.error('❌ GEMINI_API_KEY required'); process.exit(1); }
if (!API_TOKEN)      { console.error('❌ API_TOKEN required'); process.exit(1); }

// ── Load exercises ───────────────────────────────────────────────────────────
const exercisesPath = join(__dirname, '..', 'src', 'data', 'exercises.json');
const exercises = JSON.parse(readFileSync(exercisesPath, 'utf-8'));

// ── Frame analysis ───────────────────────────────────────────────────────────
async function analyzeFrameCount(exerciseName, description) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          frame_count: { type: 'integer', description: 'Number of key positions (1-3)' },
          positions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Brief description of each key position',
          },
        },
        required: ['frame_count', 'positions'],
      },
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  });

  const prompt = `For the exercise "${exerciseName}", determine how many key positions are needed to clearly illustrate the movement.

Description: ${description}

Rules:
- Static holds (plank, wall sit, child's pose) = 1 position
- Simple two-phase movements (squats, lunges, crunches) = 2 positions  
- Complex multi-phase movements (push-up with rotation, burpees, cat-cow flow) = 3 positions
- Never more than 3`;

  try {
    const result = await model.generateContent(prompt);
    // .text() on the SDK response already filters out thinking parts
    let text;
    try {
      text = result.response.text();
    } catch {
      const parts = result.response.candidates?.[0]?.content?.parts || [];
      text = (parts.find(p => !p.thought) || parts[parts.length - 1])?.text || '';
    }
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    // Try direct parse, then extract JSON object from text
    let parsed;
    try { parsed = JSON.parse(cleaned); } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
      if (!parsed) throw new Error('No JSON found in response');
    }
    return {
      frame_count: Math.min(Math.max(parsed.frame_count || 2, 1), 3),
      positions: parsed.positions || [],
    };
  } catch (err) {
    console.warn(`     ⚠️  Analysis failed (${err.message}), defaulting to 2 frames`);
    return { frame_count: 2, positions: [] };
  }
}

// ── Prompt template ──────────────────────────────────────────────────────────
function buildPrompt(exerciseName, description, frameCount, positions) {
  const positionText = positions?.length
    ? `The ${frameCount} key position(s) to show: ${positions.join(', ')}.`
    : `Show ${frameCount} key position(s) of the movement.`;

  return `Flat vector illustration of a female figure performing ${exerciseName}, shown in ${frameCount} key position${frameCount > 1 ? 's side by side' : ''} on a white background. The figure has a simple, minimal design with solid color fills (teal/cyan sports bra and dark gray/navy leggings), no facial details, light skin tone, brown hair in a ponytail. Clean geometric body proportions, no outlines, soft flat shading. ${positionText} Fitness app UI style, consistent character design across all poses. No text, no background elements, no shadows on the ground.

Exercise description for pose accuracy: ${description}`;
}

// ── Fetch existing illustrations ─────────────────────────────────────────────
async function getExistingIllustrations() {
  try {
    const res = await fetch(`${API_BASE}/illustrations.php`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(d => d.exercise_id) : [];
  } catch (e) {
    console.warn('⚠️  Could not fetch existing illustrations:', e.message);
    return [];
  }
}

// ── Generate image via Gemini ────────────────────────────────────────────────
async function generateImage(prompt) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseModalities: ['image', 'text'],
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts || [];

  // Find image parts
  const imageParts = parts.filter(p => p.inlineData?.mimeType?.startsWith('image/'));

  if (imageParts.length === 0) {
    // Fallback: try the Imagen-style API directly
    throw new Error('No image parts in response. Model may not support image generation.');
  }

  return imageParts.map(p => ({
    base64: p.inlineData.data,
    mimeType: p.inlineData.mimeType,
  }));
}

// ── Upload to PHP backend ────────────────────────────────────────────────────
async function uploadFrame(exerciseId, frameNumber, base64Data, mimeType, prompt) {
  const res = await fetch(`${API_BASE}/illustrations.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
    },
    body: JSON.stringify({
      exercise_id:  exerciseId,
      frame_number: frameNumber,
      image_base64: base64Data,
      mime_type:    mimeType,
      prompt_used:  prompt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed (${res.status}): ${err}`);
  }

  return res.json();
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const regenerate = args.includes('--regenerate');
  const targetId = args.find(a => !a.startsWith('--'));

  const existing = await getExistingIllustrations();
  console.log(`📦 ${existing.length} exercises already have illustrations`);

  let toGenerate;
  if (targetId) {
    toGenerate = exercises.filter(e => e.id === targetId);
  } else if (regenerate) {
    toGenerate = [...exercises];
  } else {
    toGenerate = exercises.filter(e => !existing.includes(e.id));
  }

  if (toGenerate.length === 0) {
    console.log('✅ Nothing to generate — all exercises have illustrations');
    console.log('   Use --regenerate to overwrite existing ones');
    return;
  }

  console.log(`🎨 Generating illustrations for ${toGenerate.length} exercises...\n`);

  for (const exercise of toGenerate) {
    console.log(`  🖌️  ${exercise.name} (${exercise.id})...`);

    try {
      // Step 1: Analyze how many frames this exercise needs
      console.log(`     → Analyzing movement complexity...`);
      const analysis = await analyzeFrameCount(exercise.name, exercise.description);
      const frameCount = Math.min(Math.max(analysis.frame_count || 2, 1), 3);
      const positions = analysis.positions || [];
      console.log(`     → ${frameCount} position(s): ${positions.join(' → ')}`);

      // Rate limit between analysis and generation
      await new Promise(r => setTimeout(r, 1000));

      // Step 2: Generate the illustration with the right frame count
      const prompt = buildPrompt(exercise.name, exercise.description, frameCount, positions);
      const images = await generateImage(prompt);
      console.log(`     → Got ${images.length} image(s) from Gemini`);

      // Upload frames
      for (let i = 0; i < images.length; i++) {
        await uploadFrame(
          exercise.id,
          i + 1,
          images[i].base64,
          images[i].mimeType,
          prompt,
        );
        console.log(`     → Uploaded frame ${i + 1}`);
      }

      console.log(`  ✅ ${exercise.name} done\n`);

      // Rate limit: wait 3s between exercises
      if (toGenerate.indexOf(exercise) < toGenerate.length - 1) {
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error(`  ❌ ${exercise.name}: ${err.message}\n`);
    }
  }

  console.log('🏁 Generation complete');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
