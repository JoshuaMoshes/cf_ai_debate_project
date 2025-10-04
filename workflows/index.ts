// Cloudflare Workflows are accessed through the context parameter
// No direct imports needed for Workflow and step

type Payload = {
  userId: string;
  topic: string;
  userMessage: string;
  userStance: "pro" | "con";
};

export class DebateWorkflow {
  async debateflow(ctx: any) {
    const { userId, topic, userMessage, userStance } = ctx.payload as Payload;
    const { step } = ctx;

    // 1) Retrieve past weak points for this user
    const retrieved = await step("retrieve-memories", async ({ env }: { env: any }) => {
      // simple tag filter by userId
      const q = await env.MEMVEC.queryFromText(
        env.AI,
        "@cf/baai/bge-base-en-v1.5",
        userMessage,
        { topK: 6, filter: { userId } }
      );
      const notes = q.matches?.map((m: any) => m.metadata?.note ?? "").join("\n") ?? "";
      return notes;
    });

    // 2) Choose AI stance opposite to the user
    const aiStance = userStance === "pro" ? "con" : "pro";

    // 3) Generate the AI rebuttal that uses memories when relevant
    const rebuttal = await step("llm-rebuttal", async ({ env }: { env: any }) => {
      const system = `
You are a rigorous debate coach. You must argue the opposite stance of the user on the given topic.
Use the user's past weak points if helpful. Be civil, concise, and cite at least 2 concrete points.
Memories of user's weak points (may be empty):
${retrieved}
Topic: ${topic}
AI stance: ${aiStance}
`;
      const out = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage }
        ],
        temperature: 0.6,
        max_tokens: 400
      });
      return out.response;
    });

    // 4) Critique the user's last message to extract a weak point worth saving
    const extracted = await step("extract-weak-point", async ({ env }: { env: any }) => {
      const prompt = `
Extract one concise weak point from the user's last message that the coach can exploit in future.
Rules:
- 1 sentence, under 140 chars
- First person paraphrase of the user's vulnerability or recurring flaw
- If no useful weakness, return NONE
User message:
${userMessage}
`;
      const res = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 60
      });
      return res.response.trim();
    });

    // 5) Store memory if present
    await step("store-memory", async ({ env }: { env: any }) => {
      const note = extracted;
      if (!note || note === "NONE") return "skip";
      // embed and insert with userId tag
      const vec = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: note });
      await env.MEMVEC.insert([
        {
          id: crypto.randomUUID(),
          values: vec.data[0],
          metadata: { userId, note, topic }
        }
      ]);
      return "stored";
    });

    return { rebuttal };
  }
}
