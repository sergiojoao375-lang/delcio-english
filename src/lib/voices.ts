export type VoiceOption = {
  id: string;
  name: string;
  description: string;
  gender: "f" | "m";
};

// Vozes multilingues (funcionam bem em EN e PT-BR)
export const VOICES: VoiceOption[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Feminina, calma e amigável", gender: "f" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Feminina, animada e jovem", gender: "f" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Feminina, doce e suave", gender: "f" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Feminina, quente e acolhedora", gender: "f" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Feminina, natural e expressiva", gender: "f" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Masculina, natural e clara", gender: "m" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Masculina, calma e madura", gender: "m" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Masculina, jovem e amigável", gender: "m" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Masculina, casual e descontraída", gender: "m" },
];

export const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export function isValidVoiceId(id: string): boolean {
  return VOICES.some((v) => v.id === id);
}
