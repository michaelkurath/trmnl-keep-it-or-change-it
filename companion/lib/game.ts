export const DAY = 86_400_000;
export const CUTOFF = 20 * 3_600_000;
export const roundId = (now: number) => Math.floor((now - CUTOFF) / DAY);
export const closesAt = (id: number) => new Date((id + 1) * DAY + CUTOFF).toISOString();
export type Choice = "keep" | "change";
export type Round = { id: number; image: number; image_start: number; settled: number; keep_count: number; change_count: number };
export type Statement = { bind(...values: unknown[]): Statement; first<T = Record<string, unknown>>(): Promise<T | null>; all<T = Record<string, unknown>>(): Promise<{ results: T[] }>; run(): Promise<unknown> };
export type Database = { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown> };
export function decision(keep: number, change: number): Choice { return change > keep ? "change" : "keep"; }
export async function ensureRound(db: Database, now: number, poolSize: number): Promise<Round> {
  const id = roundId(now);
  let latest = await db.prepare("SELECT * FROM rounds ORDER BY id DESC LIMIT 1").first<Round>();
  if (!latest) {
    await db.prepare("INSERT OR IGNORE INTO rounds (id, image, image_start) VALUES (?, 0, ?)").bind(id, id).run();
    latest = await db.prepare("SELECT * FROM rounds ORDER BY id DESC LIMIT 1").first<Round>();
  }
  if (!latest) throw new Error("Could not initialise the shared round.");
  if (latest.id < id) {
    // D1 batch is transactional. Empty intervening days implicitly KEEP.
    await db.batch([
      db.prepare(`UPDATE rounds SET settled = 1,
        keep_count = (SELECT COUNT(*) FROM votes WHERE round_id = ? AND choice = 'keep'),
        change_count = (SELECT COUNT(*) FROM votes WHERE round_id = ? AND choice = 'change')
        WHERE id = ?`).bind(latest.id, latest.id, latest.id),
      db.prepare(`INSERT OR IGNORE INTO rounds (id, image, image_start)
        SELECT ?, CASE WHEN change_count > keep_count THEN (image + 1) % ? ELSE image END,
        CASE WHEN change_count > keep_count THEN ? ELSE image_start END FROM rounds WHERE id = ?`)
        .bind(id, poolSize, id, latest.id),
    ]);
  }
  const current = await db.prepare("SELECT * FROM rounds WHERE id = ?").bind(id).first<Round>();
  if (!current) throw new Error("The round is not available.");
  return current;
}
export async function submitVote(db: Database, round: Round, voter: string, choice: Choice): Promise<Choice | null> {
  // Enforce the cutoff using the database clock at execution, not request arrival.
  await db.prepare(`INSERT OR IGNORE INTO votes (round_id, voter, choice)
    SELECT id, ?, ? FROM rounds WHERE id = ? AND settled = 0
    AND id = CAST((unixepoch() - 72000) / 86400 AS INTEGER)`)
    .bind(voter, choice, round.id).run();
  const vote = await db.prepare("SELECT choice FROM votes WHERE round_id = ? AND voter = ?")
    .bind(round.id, voter).first<{ choice: Choice }>();
  return vote?.choice ?? null;
}
