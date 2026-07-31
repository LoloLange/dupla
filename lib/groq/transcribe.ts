import { groqTranscription } from "@/lib/groq/client";

export const MODELO_WHISPER = "whisper-large-v3-turbo";

export async function transcribirAudio(blob: Blob): Promise<string> {
  const extension = blob.type.includes("webm")
    ? "webm"
    : blob.type.includes("ogg")
      ? "ogg"
      : blob.type.includes("wav")
        ? "wav"
        : blob.type.includes("mp4")
          ? "mp4"
          : "mp3";
  const formData = new FormData();
  formData.append("file", blob, `audio.${extension}`);
  formData.append("model", MODELO_WHISPER);
  formData.append("language", "es");
  formData.append("response_format", "json");

  return groqTranscription(formData);
}
