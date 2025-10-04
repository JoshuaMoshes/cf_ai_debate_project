export class SessionDO {
  state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }

  async fetch(req: Request) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname.endsWith("/api/session")) {
      const { userId } = await req.json() as { userId: string };
      await this.state.storage.put("userId", userId);
      return new Response("saved");
    }
    if (req.method === "GET" && url.pathname.endsWith("/api/session")) {
      const userId = await this.state.storage.get<string>("userId");
      return Response.json({ userId });
    }
    return new Response("Method not allowed", { status: 405 });
  }
}
