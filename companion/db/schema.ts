import { sqliteTable, integer, text, primaryKey } from "drizzle-orm/sqlite-core";
export const rounds = sqliteTable("rounds", {
  id: integer("id").primaryKey(), image: integer("image").notNull(), imageStart: integer("image_start").notNull(),
  settled: integer("settled").notNull().default(0), keepCount: integer("keep_count").notNull().default(0), changeCount: integer("change_count").notNull().default(0),
});
export const votes = sqliteTable("votes", {
  roundId: integer("round_id").notNull().references(() => rounds.id), voter: text("voter").notNull(),
  choice: text("choice", { enum: ["keep", "change"] }).notNull(),
}, table => [primaryKey({ columns: [table.roundId, table.voter] })]);
