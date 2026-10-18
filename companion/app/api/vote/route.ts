import { database, identity, json, state } from "../../../lib/http";
import { ensureRound, submitVote, type Choice } from "../../../lib/game";
import artwork from "../../../lib/artwork.json";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const voter = identity(request);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json(request, voter, { error: "Please vote from the voting page." }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return json(request, voter, {error: "Invalid vote."}, 415);
  if (Number(request.headers.get("content-length") ?? 0) > 512) return json(request, voter, {error: "Invalid vote."}, 413);
  try {
    const body = await request.text();
    if (body.length > 512) return json(request, voter, {error: "Invalid vote."}, 413);
    const input = JSON.parse(body);
    if (!input || typeof input !== "object") return json(request, voter, {error: "Invalid vote."}, 400);
    if (!["keep", "change"].includes(input.choice) || !Number.isInteger(input.round_id)) return json(request, voter, { error: "Choose Keep or Change." }, 400);
    const current = await ensureRound(database(), Date.now(), artwork.length);
    if (input.round_id !== current.id || input.image_id !== artwork[current.image].id) return json(request, voter, { error: "A new round has started. Your vote was not submitted; please choose again.", refresh: true }, 409);
    const accepted = await submitVote(database(), current, voter, input.choice as Choice);
    if (accepted === null) return json(request, voter, { error: "The round has just closed. Please refresh for the new round.", refresh: true }, 409);
    const updated = await state(request, voter);
    if (updated.round_id !== current.id) return json(request, voter, {error: "The round has closed. Please refresh for the next decision.", refresh: true}, 409);
    return json(request, voter, updated);
  } catch (error) {
    if (error instanceof SyntaxError) return json(request, voter, {error: "Invalid vote."}, 400);
    return json(request, voter, {error: "Your vote could not be confirmed. Please try again."}, 503);
  }
}
