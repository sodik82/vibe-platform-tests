import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import {
  CreateSessionBody,
  GetSessionParams,
  GetSessionResponse,
  SubmitStepParams,
  SubmitStepBody,
  SubmitStepResponse,
  GetResultsResponse,
  GetFunnelStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const VARIANTS = ["variant-a"];

const MULTIPLE_CHOICE_OPTIONS = [
  "Software Development",
  "Fashion & Apparel",
  "Healthcare & Medical",
  "Finance & Banking",
  "Food & Beverage",
  "Education & E-Learning",
];

function assignVariant(): string {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

function shuffleOptions(options: string[]): string[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 5);
}

function formatSession(session: typeof sessionsTable.$inferSelect) {
  return {
    id: session.id,
    variant: session.variant,
    currentStep: session.currentStep,
    freeTextAnswer: session.freeTextAnswer ?? null,
    multipleChoiceAnswer: session.multipleChoiceAnswer ?? null,
    multipleChoiceOptions: session.multipleChoiceOptions ?? [],
    createdAt: session.createdAt,
    completedAt: session.completedAt ?? null,
  };
}

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const variant = assignVariant();
  const multipleChoiceOptions = shuffleOptions(MULTIPLE_CHOICE_OPTIONS);

  const [session] = await db
    .insert(sessionsTable)
    .values({
      variant,
      currentStep: 0,
      multipleChoiceOptions,
      userAgent: parsed.data.userAgent ?? req.headers["user-agent"] ?? null,
    })
    .returning();

  req.log.info({ sessionId: session.id, variant }, "Session created");
  res.status(201).json(GetSessionResponse.parse(formatSession(session)));
});

router.get("/sessions/:sessionId", async (req, res): Promise<void> => {
  const params = GetSessionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, params.data.sessionId));

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(GetSessionResponse.parse(formatSession(session)));
});

router.post("/sessions/:sessionId/step", async (req, res): Promise<void> => {
  const params = SubmitStepParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitStepBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, params.data.sessionId));

  if (!existing) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { step, answer } = body.data;

  const updates: Partial<typeof sessionsTable.$inferInsert> = {
    currentStep: step,
  };

  if (step === 2 && answer != null) {
    updates.freeTextAnswer = answer;
  }

  if (step === 3 && answer != null) {
    updates.multipleChoiceAnswer = answer;
    updates.completedAt = new Date();
  }

  const [updated] = await db
    .update(sessionsTable)
    .set(updates)
    .where(eq(sessionsTable.id, params.data.sessionId))
    .returning();

  req.log.info({ sessionId: updated.id, step }, "Step submitted");
  res.json(SubmitStepResponse.parse(formatSession(updated)));
});

router.get("/results", async (_req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(sessionsTable)
    .orderBy(sessionsTable.createdAt);

  res.json(
    GetResultsResponse.parse({
      sessions: sessions.map(formatSession),
      total: sessions.length,
    }),
  );
});

router.get("/results/funnel", async (_req, res): Promise<void> => {
  const allSessions = await db.select().from(sessionsTable);

  const totalStarted = allSessions.length;
  const viewedImage = allSessions.filter((s) => s.currentStep >= 1).length;
  const answeredFreeText = allSessions.filter((s) => s.currentStep >= 2).length;
  const completed = allSessions.filter((s) => s.currentStep >= 3).length;

  const variantMap = new Map<
    string,
    { totalStarted: number; viewedImage: number; answeredFreeText: number; completed: number }
  >();

  for (const session of allSessions) {
    if (!variantMap.has(session.variant)) {
      variantMap.set(session.variant, {
        totalStarted: 0,
        viewedImage: 0,
        answeredFreeText: 0,
        completed: 0,
      });
    }
    const stats = variantMap.get(session.variant)!;
    stats.totalStarted++;
    if (session.currentStep >= 1) stats.viewedImage++;
    if (session.currentStep >= 2) stats.answeredFreeText++;
    if (session.currentStep >= 3) stats.completed++;
  }

  const byVariant = Array.from(variantMap.entries()).map(([variant, stats]) => ({
    variant,
    ...stats,
  }));

  res.json(
    GetFunnelStatsResponse.parse({
      totalStarted,
      viewedImage,
      answeredFreeText,
      completed,
      byVariant,
    }),
  );
});

export default router;
