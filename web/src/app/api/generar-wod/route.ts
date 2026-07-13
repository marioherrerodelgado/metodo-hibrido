import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── Contrato con el cliente ──────────────────────────────────────────────

const RequestSchema = z.object({
  prompt: z.string().min(3).max(600),
  sport: z
    .enum(["running", "crossfit", "hyrox", "deka", "fuerza", "movilidad"])
    .optional(),
  minutes: z.number().int().min(10).max(180).optional(),
  level: z.enum(["principiante", "intermedio", "avanzado"]).optional(),
  equipment: z.array(z.string()).max(15).optional(),
  muscles: z.array(z.string()).max(12).optional(),
  /** Zonas que el atleta ya trae muy cargadas esta semana: hay que respetarlas. */
  avoid: z.array(z.string()).max(12).optional(),
});

/**
 * Esquema que la IA está OBLIGADA a devolver. Al ir en `output_config.format`,
 * la API valida la forma antes de responder: no hace falta parsear a ciegas.
 */
const WOD_SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    sport: {
      type: "string",
      enum: ["running", "crossfit", "hyrox", "deka", "fuerza", "movilidad"],
    },
    intensity: { type: "string", enum: ["baja", "media", "alta", "maxima"] },
    duration: { type: "string" },
    volume: { type: "string" },
    type: { type: "string" },
    warmup: { type: "string" },
    main: { type: "string" },
    metcon: { type: "string" },
    cooldown: { type: "string" },
    notes: { type: "string" },
    muscles: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "pecho",
          "espalda",
          "hombros",
          "biceps",
          "triceps",
          "core",
          "gluteos",
          "cuadriceps",
          "isquios",
          "gemelos",
          "antebrazos",
          "cardio",
        ],
      },
    },
  },
  required: [
    "titulo",
    "sport",
    "intensity",
    "duration",
    "volume",
    "type",
    "warmup",
    "main",
    "metcon",
    "cooldown",
    "notes",
    "muscles",
  ],
  additionalProperties: false,
} as const;

const SYSTEM = `Eres el coach de Método Híbrido, un centro de entrenamiento híbrido en Madrid que combina running, CrossFit, Hyrox y DEKA.

Diseñas una sesión de entrenamiento concreta y ejecutable a partir de lo que pide el atleta.

Reglas:
- Escribe en castellano de España, con la terminología real del box (AMRAP, EMOM, For Time, RPE, e1RM, tempo, etc.).
- Cada bloque (warmup, main, metcon, cooldown) es una lista: una línea por ejercicio o serie, sin numerar y sin viñetas. El formato de línea es directo, por ejemplo: "5 rondas: 10 Thrusters 43/30 kg + 15 Toes to Bar".
- Prescribe cargas en kg (hombre/mujer) o en % de 1RM, y distancias en metros o kilómetros. Nada de "un peso moderado".
- "metcon" solo si la sesión tiene una parte condicional diferenciada; si no, deja la cadena vacía.
- "duration" es un rango realista tipo "55-65 min". "volume" describe la carga total en una línea corta.
- "notes" es un consejo breve del coach: qué buscar en la sesión y cuándo parar.
- "muscles" lista SOLO las zonas realmente cargadas por la sesión.
- Si el atleta indica zonas a evitar por fatiga acumulada, respétalas de verdad: no las cargues y elige movimientos alternativos.
- Ajusta la dificultad al nivel indicado. Un principiante no hace muscle-ups ni snatch pesado.
- Si el atleta solo tiene el material que indica, no prescribas nada que requiera otro material.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "El generador con IA no está configurado. Falta ANTHROPIC_API_KEY en el servidor.",
        code: "missing_api_key",
      },
      { status: 503 },
    );
  }

  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Petición no válida.", code: "bad_request" },
      { status: 400 },
    );
  }

  const client = new Anthropic();

  const contexto = [
    `Petición del atleta: ${body.prompt}`,
    body.sport && `Disciplina: ${body.sport}`,
    body.minutes && `Tiempo disponible: ${body.minutes} minutos`,
    body.level && `Nivel: ${body.level}`,
    body.equipment?.length && `Material disponible: ${body.equipment.join(", ")}`,
    body.muscles?.length && `Quiere trabajar: ${body.muscles.join(", ")}`,
    body.avoid?.length &&
      `Zonas MUY cargadas esta semana, evítalas: ${body.avoid.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: WOD_SCHEMA },
      },
      system: SYSTEM,
      messages: [{ role: "user", content: contexto }],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "No he podido generar esa sesión.", code: "refusal" },
        { status: 422 },
      );
    }

    const text = response.content.find((b) => b.type === "text")?.text;
    if (!text) {
      return NextResponse.json(
        { error: "Respuesta vacía del modelo.", code: "empty" },
        { status: 502 },
      );
    }

    const wod = JSON.parse(text);

    // La disciplina que ha elegido el atleta manda sobre la que deduzca el
    // modelo: con ella filtra su calendario, y no puede pedir CrossFit y que
    // el entreno le aparezca archivado como fuerza.
    if (body.sport) wod.sport = body.sport;

    return NextResponse.json({ wod });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Demasiadas peticiones. Espera un momento.", code: "rate_limit" },
        { status: 429 },
      );
    }
    if (e instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "La clave de la API no es válida.", code: "auth" },
        { status: 500 },
      );
    }
    console.error("[generar-wod]", e);
    return NextResponse.json(
      { error: "No se ha podido generar el entrenamiento.", code: "unknown" },
      { status: 500 },
    );
  }
}
