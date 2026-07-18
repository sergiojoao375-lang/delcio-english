// Netlify Function mirror of src/routes/api/tts.ts

const VALID_VOICE_IDS = new Set([
  "EXAVITQu4vr4xnSDxMaL",
  "FGY2WhTYpPnrIDTdsKH5",
  "pFZP5JQG7iQjIQuC4Bku",
  "XrExE9yKIg1WjnnlVkGX",
  "cgSgspJ2msm6clMCkdW9",
  "IKne3meq5aSn9XLyUdCD",
  "JBFqnCBsd6RMkjVDRZzb",
  "TX3LPaxmHKxFdv7VOQHJ",
  "nPczCjzI2devNBz1zQrb",
]);
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export default async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ELEVENLABS_API_KEY not configured on Netlify" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) {
    return new Response(JSON.stringify({ error: "Invalid text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const voiceId = body.voiceId && VALID_VOICE_IDS.has(body.voiceId) ? body.voiceId : DEFAULT_VOICE_ID;

  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
          speed: 1.0,
        },
      }),
    }
  );

  const reqId = request.headers.get("X-Client-Request-Id") || "";
  if (!resp.ok) {
    const err = await resp.text();
    console.error(JSON.stringify({ scope: "tts", requestId: reqId, upstreamStatus: resp.status, message: err.slice(0, 300) }));
    if (resp.status === 401 || resp.status === 403) {
      return new Response(
        JSON.stringify({ error: "key_rotated", retryable: true, message: "TTS auth failed — key may be rotating." }),
        { status: 503, headers: { "Content-Type": "application/json", "X-Backend-Request-Id": reqId } }
      );
    }
    return new Response(JSON.stringify({ error: err || "TTS failed" }), {
      status: resp.status,
      headers: { "Content-Type": "application/json", "X-Backend-Request-Id": reqId },
    });
  }

  const audio = await resp.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Backend-Request-Id": reqId },
  });
};

export const config = { path: "/api/tts" };
