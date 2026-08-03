"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { blobAWavValido } from "@/lib/audio";

const MAX_SEGUNDOS = 30;

export type EstadoVoz = "idle" | "recording" | "processing";

export function useVoiceRecorder() {
  const [estado, setEstado] = useState<EstadoVoz>("idle");
  const [duracion, setDuracion] = useState(0);
  const [nivel, setNivel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onBlobRef = useRef<((blob: Blob) => void) | null>(null);
  const canceladaRef = useRef(false);
  const inicioRef = useRef(0);
  const picoRef = useRef(0);

  const detenerGrabacion = useCallback(() => {
    canceladaRef.current = true;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    setNivel(0);
    setEstado("idle");
  }, []);

  const empezarGrabacion = useCallback(
    (onBlob: (blob: Blob) => void) => {
      onBlobRef.current = onBlob;
      setError(null);
      canceladaRef.current = false;
      picoRef.current = 0;

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (canceladaRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            setError("La grabación fue muy corta. Mantené presionado y hablá.");
            return;
          }
          streamRef.current = stream;
          const mime = [
            "audio/mp4;codecs=mp4a.40.2",
            "audio/mp4",
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
          ].find((t) => MediaRecorder.isTypeSupported(t));
          const recorder = new MediaRecorder(
            stream,
            mime ? { mimeType: mime } : undefined
          );
          chunksRef.current = [];
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, {
              type: mime || "audio/webm",
            });
            const duracionMs = Date.now() - inicioRef.current;
            console.info("[voz] grabación terminada:", {
              duracionMs,
              pico: Math.round(picoRef.current),
              tipo: blob.type,
              size: blob.size,
            });
            if (duracionMs < 400) {
              setError(
                "La grabación fue muy corta. Mantené presionado y hablá."
              );
              return;
            }
            void blobAWavValido(blob).then((wav) => {
              onBlobRef.current?.(wav);
            });
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
          inicioRef.current = Date.now();

          const ctx = new AudioContext();
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          audioCtxRef.current = ctx;
          analyserRef.current = analyser;

          setDuracion(0);
          setEstado("recording");
          timerRef.current = setInterval(() => {
            setDuracion((d) => {
              if (d + 1 >= MAX_SEGUNDOS) {
                detenerGrabacion();
                return MAX_SEGUNDOS;
              }
              return d + 1;
            });
          }, 1000);

          const data = new Uint8Array(analyser.frequencyBinCount);
          const loop = () => {
            analyser.getByteFrequencyData(data);
            const promedio = data.reduce((a, b) => a + b, 0) / data.length;
            setNivel(promedio);
            picoRef.current = Math.max(picoRef.current, promedio);
            rafRef.current = requestAnimationFrame(loop);
          };
          loop();
        })
        .catch(() => {
          setEstado("idle");
          setError("No pudimos acceder al micrófono. Revisá los permisos.");
        });
    },
    [detenerGrabacion]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const limpiarError = useCallback(() => {
    setError(null);
  }, []);

  return {
    estado,
    duracion,
    nivel,
    error,
    empezarGrabacion,
    detenerGrabacion,
    limpiarError,
  };
}
