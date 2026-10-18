import { env } from "cloudflare:workers";
import { ensureRound, closesAt, decision, type Database, type Choice, type Round } from "./game";
import artwork from "./artwork.json";
export const COOKIE = "kici_voter";
export function database(): Database {
  if (!env.DB) throw new Error("Shared voting is temporarily unavailable.");
  return env.DB as unknown as Database;
}
export function identity(request: Request): string {
  const stored = request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  return stored && /^[a-f0-9]{64}$/.test(stored) ? stored : Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
}
export function json(request: Request, voter: string, data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: {
    "Cache-Control": "no-store, private", "X-Content-Type-Options": "nosniff",
    "Set-Cookie": `${COOKIE}=${voter}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
  }});
}
export async function state(request: Request, voter: string) {
  const db = database();
  const current = await ensureRound(db, Date.now(), artwork.length);
  const own = await db.prepare("SELECT choice FROM votes WHERE round_id = ? AND voter = ?").bind(current.id, voter).first<{choice: Choice}>();
  const previous = await db.prepare("SELECT * FROM rounds WHERE settled = 1 ORDER BY id DESC LIMIT 1").first<Round>();
  const origin = new URL(request.url).origin;
  const art = artwork[current.image];
  // Open-round totals never leave the server.
  return {
    round_id: current.id, image_id: art.id, image_title: art.title,
    image_url: origin + "/art/" + art.id + ".png", image_age: current.id - current.image_start + 1,
    closes_at: closesAt(current.id), choice: own?.choice ?? null, vote_url: origin + "/",
    previous: previous ? {
      round_id: previous.id, decision: decision(previous.keep_count, previous.change_count),
      keep: previous.keep_count, change: previous.change_count, total: previous.keep_count + previous.change_count,
      title: artwork[previous.image].title, image_id: artwork[previous.image].id, closed_at: closesAt(previous.id),
    } : null,
    pool_size: artwork.length,
  };
}
