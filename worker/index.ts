export interface Env {
  AI: any;
  MEMVEC: VectorizeIndex;
  KV: KVNamespace;
  debateflow: any; // workflow binding
  ASSETS: Fetcher;
}

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);

    // Add CORS headers for local development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method === "POST" && url.pathname === "/api/debate") {
      const { userId: _userId, topic, userMessage, userStance } = await req.json() as {
        userId: string;
        topic: string;
        userMessage: string;
        userStance: string;
      };

      // Simple debate logic without workflows for now
      // userId is available for future use (e.g., user-specific memory, analytics)
      const aiStance = userStance === "pro" ? "con" : "pro";
      
      // Generate AI rebuttal
      const systemPrompt = `
You are a rigorous debate coach. You must argue the opposite stance of the user on the given topic.
Be civil, concise, and cite at least 2 concrete points. It is crucial that you are concise and say no more than 5 - 6 sentences per response. Be sure to split up the sentences with line breaks so it doesn't look like a wall of text.
Topic: ${topic}
AI stance: ${aiStance}
User stance: ${userStance}
If the user is making statements that goes against their stance, you should call them out for it in one sentence and ask them to reconsider the point they made. DO NOT write more than one sentence in this situation. NEVER say anything that is the opposite of your stance.
`;
      
      const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        temperature: 0.6,
        max_tokens: 400
      });

      return Response.json({ rebuttal: aiResponse.response }, { headers: corsHeaders });
    }

    // Remove session endpoint for now - just handle debate API

    // Serve static assets
    return env.ASSETS.fetch(req);
  }
};

// No exports needed for this simple worker
