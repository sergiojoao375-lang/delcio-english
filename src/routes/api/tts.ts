import { createFileRoute } from "@tanstack/react-router";
import { isValidVoiceId, DEFAULT_VOICE_ID } from "@/lib/voices";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let body: { text?: string; voiceId?: string };
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

        const voiceId = body.voiceId && isValidVoiceId(body.voiceId) ? body.voiceId : DEFAULT_VOICE_ID;

        const resp = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
          {
            method: "POST",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
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

        if (!resp.ok) {
          const err = await resp.text();
          return new Response(JSON.stringify({ error: err || "TTS failed" }), {
            status: resp.status,
            headers: { "Content-Type": "application/json" },
          });
        }

        const audio = await resp.arrayBuffer();
        return new Response(audio, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
