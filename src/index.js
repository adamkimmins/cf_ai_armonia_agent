/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// src/index.js (or index.js if that's what your wrangler "main" is)

const MODEL_ID = "@cf/meta/llama-3.1-8b-instruct"; 
// Llama 3.1 8B Instruct is Cloudflare's recommended general chat model.:contentReference[oaicite:1]{index=1}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Simple health/label endpoint used by the frontend
    if (request.method === "GET" && url.pathname === "/message") {
      return new Response("Armonia • AI Assistant", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Chat endpoint: accepts JSON { history: [...], message: "..." }
    if (request.method === "POST" && url.pathname === "/chat") {
      if (!env.AI) {
        return new Response(
          "Workers AI binding (env.AI) is not configured. Add an 'ai' binding to wrangler.jsonc.",
          { status: 500 },
        );
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const history = Array.isArray(body?.history) ? body.history : [];
      const message = typeof body?.message === "string" ? body.message.trim() : "";

      if (!message) {
        return new Response(
          JSON.stringify({ error: "Missing 'message' string in request body." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Build the chat messages array for Workers AI
      const messages = [
        {
          role: "system",
          content:
            "Armonia" +
            "" +
            "" +
            "",
        },
        // previous turns the browser sends up
        ...history,
        // the new user message for this turn
        { role: "user", content: message },
      ];

      try {
        // Call Workers AI
        const result = await env.AI.run(MODEL_ID, {
          messages,
          max_tokens: 512,
          temperature: 0.7,
        }); // env.AI.run is the recommended binding API for Workers AI.:contentReference[oaicite:2]{index=2}

        // Workers AI generally returns { response: "text", ... } for text models.:contentReference[oaicite:3]{index=3}
        let answerText;
        if (typeof result === "string") {
          answerText = result;
        } else if (typeof result?.response === "string") {
          answerText = result.response;
        } else if (typeof result?.output_text === "string") {
          answerText = result.output_text;
        } else {
          // Fallback: return the raw object for debugging
          answerText = JSON.stringify(result);
        }

        return new Response(
          JSON.stringify({ answer: answerText }),
          { headers: { "Content-Type": "application/json" } },
        );
      } catch (err) {
        console.error("AI error:", err);
        return new Response(
          JSON.stringify({ error: "AI request failed." }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Optional: keep the old UUID endpoint for debugging if you want
    if (request.method === "GET" && url.pathname === "/random") {
      return new Response(crypto.randomUUID(), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Static asset fallback if you're using Wrangler `assets.directory`
    // (e.g. public/index.html).
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // Basic fallback
    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Armonia AI worker is running, but no static UI was found.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
};
