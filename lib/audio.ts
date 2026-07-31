const WAV_SAMPLE_RATE = 16000;

export function audioBufferAWav(buffer: AudioBuffer): ArrayBuffer {
  const sampleRate = WAV_SAMPLE_RATE;
  const numFrames = Math.ceil(buffer.duration * sampleRate);
  const channels = 1;
  const bytesPerSample = 2;
  const dataSize = numFrames * channels * bytesPerSample;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);

  const escribir = (offset: number, texto: string) => {
    for (let i = 0; i < texto.length; i++) {
      view.setUint8(offset + i, texto.charCodeAt(i));
    }
  };

  escribir(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  escribir(8, "WAVE");
  escribir(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  escribir(36, "data");
  view.setUint32(40, dataSize, true);

  const inputRate = buffer.sampleRate;
  const inputChannels = Math.min(buffer.numberOfChannels, 2);
  const mono = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    const t = (i / sampleRate) * inputRate;
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, buffer.length - 1);
    const frac = t - i0;
    let muestra = 0;
    for (let c = 0; c < inputChannels; c++) {
      const canal = buffer.getChannelData(c);
      muestra += canal[i0] * (1 - frac) + canal[i1] * frac;
    }
    mono[i] = muestra / inputChannels;
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return out;
}

/**
 * Convierte un blob grabado con MediaRecorder a WAV PCM válido.
 * Los WebM de Chrome no llevan cues/duración y Whisper los rechaza con
 * "could not process file"; WAV 16kHz mono es aceptado universalmente.
 * Si el navegador no puede decodificar, devuelve el blob original.
 */
export async function blobAWavValido(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return blob;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const wav = audioBufferAWav(audioBuffer);
    ctx.close().catch(() => {});
    console.info("[audio] convertido a wav:", {
      tipoOriginal: blob.type,
      tamanioOriginal: blob.size,
      tamanioWav: wav.byteLength,
      duracion: Math.round(audioBuffer.duration),
    });
    return new Blob([wav], { type: "audio/wav" });
  } catch (error) {
    console.warn("[audio] no se pudo convertir a wav, envío original:", error);
    return blob;
  }
}
