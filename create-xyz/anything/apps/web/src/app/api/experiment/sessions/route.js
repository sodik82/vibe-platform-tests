import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const variant = Math.random() < 0.5 ? "A" : "B";
    const result = await sql`
      INSERT INTO experiment_sessions (variant, current_step)
      VALUES (${variant}, 'intro')
      RETURNING *
    `;
    return Response.json(result[0]);
  } catch (error) {
    console.error("Error creating session:", error);
    return Response.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const results = await sql`
      SELECT * FROM experiment_sessions
      ORDER BY created_at DESC
    `;
    return Response.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    return Response.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
