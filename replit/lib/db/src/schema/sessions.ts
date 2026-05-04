import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionsTable = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  variant: text("variant").notNull(),
  currentStep: integer("current_step").notNull().default(0),
  freeTextAnswer: text("free_text_answer"),
  multipleChoiceAnswer: text("multiple_choice_answer"),
  multipleChoiceOptions: text("multiple_choice_options").array().notNull().default([]),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
