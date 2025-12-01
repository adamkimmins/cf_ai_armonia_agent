/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import armoniaProtocol from "./prompts/armonia_protocol.txt";

const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ---------- HELP CHAT ----------
    if (url.pathname === "/chat" && request.method === "POST") {
      const { history, message } = await request.json();
      const system = makeSystemPrompt("DAW_HELP", {}, armoniaProtocol);

      const messages = [
        { role: "system", content: system },
        ...(history || []),
        { role: "user", content: message }
      ];

      const result = await env.AI.run(MODEL_ID, { messages });
      return json({ answer: extract(result) });
    }

if (url.pathname === "/lyric" && request.method === "POST") {
  const data = await request.json();

  const {
    dialect,
    genres,
    tone,
    diction,
    message
  } = data;

  // Build a system prompt from your Armonia protocol
  const system = `
You are Armonia-AI, an assistant that writes original lyrics.
Follow all user style controls strictly.

Dialect: ${dialect}
Genres: ${genres.join(", ")}
Tone: ${tone}
Diction Style: ${diction}

Write lyrics that match all parameters closely.
`;

  const messages = [
    { role: "system", content: system },
    { role: "user", content: message }
  ];

  const result = await env.AI.run(MODEL_ID, { messages });
  const output = extract(result);

  return json({ lyrics: output });
}

    //TODO
    // ---------------- LYRIC GENERATOR ROUTE ----------------
if (url.pathname === "/lyric" && request.method === "POST") {
  const data = await request.json();

  const {
    dialect,
    genres,
    tone,
    diction,
    message
  } = data;

  // Build a system prompt using the Armonia Protocol
  const system = armoniaProtocol
    .replace(/{{MODE}}/g, "LYRIC_GENERATOR")
    .replace(/{{DIALECT}}/g, dialect || "Default")
    .replace(/{{GENRE}}/g, genres?.join(", ") || "None")
    .replace(/{{MOOD}}/g, tone || "Neutral")
    .replace(/{{DICTION}}/g, diction || "Conversational");

  const messages = [
    { role: "system", content: system },
    { role: "user", content: message }
  ];

  let result;

  try {
    result = await env.AI.run(MODEL_ID, { messages });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.toString() }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const output = extract(result);
  return Response.json({ lyrics: output });
}

//TODOOO

    // ---------- THESAURUS ----------
    if (url.pathname === "/synonyms" && request.method === "POST") {
      const { lines } = await request.json();

      const system = makeSystemPrompt("THESAURUS", {}, armoniaProtocol);

      const msg = lines.map((line, i) => `${i + 1}. ${line}`).join("\n");

      const messages = [
        { role: "system", content: system },
        { role: "user", content: `Analyze synonyms by line:\n${msg}` }
      ];

      const result = await env.AI.run(MODEL_ID, { messages });
      return json({ output: extract(result) });
    }

    // ---------- RHYME ENGINE ----------

    if (url.pathname === "/rhyme") {
      const { target, dialect, genres } = await req.json();

      const system = armoniaProtocol
        .replace(/{{MODE}}/g, "RHYME_ENGINE")
        .replace(/{{TARGET}}/g, target)
        .replace(/{{DIALECT}}/g, dialect)
        .replace(/{{GENRE}}/g, genres.join(", "));

      const messages = [
        { role: "system", content: system },
        { role: "user", content: `Give me 5 true rhymes and 5 slant rhymes for "${target}". Include slang.` }
      ];

      const result = await env.AI.run(MODEL_ID, { messages });
      const output = extract(result);

      return Response.json({ rhymes: output });
    }

    return new Response("Not found", { status: 404 });
  }
};

function extract(result) {
  if (result?.response) return result.response;
  if (result?.output_text) return result.output_text;
  if (typeof result === "string") return result;
  return JSON.stringify(result);
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json" }
  });
}

// Build System Prompt
function makeSystemPrompt(mode, attributes, template) {
  return template
    .replace("{{MODE}}", mode)
    .replace("{{DIALECT}}", attributes.dialect || "Default")
    .replace("{{GENRES}}", (attributes.genres || []).join(", "))
    .replace("{{TONE}}", attributes.tone || "Neutral")
    .replace("{{DICTION}}", attributes.diction || "Conversational")
    .replace("{{TEMPO}}", attributes.tempo || "Mid");
}
