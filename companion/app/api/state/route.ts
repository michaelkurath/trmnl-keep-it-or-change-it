import { identity, json, state } from "../../../lib/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const voter = identity(request);
  try { return json(request, voter, await state(request, voter)); }
  catch { return json(request, voter, { error: "Voting is temporarily unavailable. Please try again shortly." }, 503); }
}
