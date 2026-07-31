export const GROQ_API_URL = "https://api.groq.com/openai/v1";

function getApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Falta GROQ_API_KEY en el entorno");
  }
  return key;
}

async function groqFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${GROQ_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      ...init.headers,
    },
  });
}

export class GroqError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

export async function groqTranscription(formData: FormData): Promise<string> {
  const res = await groqFetch("/audio/transcriptions", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new GroqError(
      `Groq transcripción falló (${res.status}): ${detalle.slice(0, 300)}`,
      res.status
    );
  }

  const data = (await res.json()) as { text?: string };
  const texto = data.text?.trim() ?? "";
  if (!texto) throw new GroqError("Transcripción vacía", 422);
  return texto;
}

export async function groqChatJson(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  model = "llama-3.3-70b-versatile"
): Promise<unknown> {
  const res = await groqFetch("/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 400,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new GroqError(`Groq chat falló (${res.status}): ${detalle.slice(0, 300)}`, res.status);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const contenido = data.choices?.[0]?.message?.content;
  if (!contenido) throw new GroqError("Respuesta vacía del modelo", 502);

  try {
    return JSON.parse(contenido);
  } catch {
    const inicio = contenido.indexOf("{");
    const fin = contenido.lastIndexOf("}");
    if (inicio >= 0 && fin > inicio) {
      return JSON.parse(contenido.slice(inicio, fin + 1));
    }
    throw new GroqError("El modelo no devolvió JSON válido", 502);
  }
}
