import sql from "@/app/api/utils/sql";

export async function PATCH(request, { params: { id } }) {
  try {
    const body = await request.json();
    const { current_step, free_text_response, multiple_choice_response } = body;

    const setFields = [];
    const values = [];
    let paramCounter = 1;

    if (current_step) {
      setFields.push(`current_step = $${paramCounter++}`);
      values.push(current_step);
    }
    if (free_text_response !== undefined) {
      setFields.push(`free_text_response = $${paramCounter++}`);
      values.push(free_text_response);
    }
    if (multiple_choice_response !== undefined) {
      setFields.push(`multiple_choice_response = $${paramCounter++}`);
      values.push(multiple_choice_response);
    }

    if (setFields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    setFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE experiment_sessions
      SET ${setFields.join(", ")}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Error updating session:", error);
    return Response.json(
      { error: "Failed to update session" },
      { status: 500 },
    );
  }
}
