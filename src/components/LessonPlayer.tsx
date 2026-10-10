"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Props = {
  lessonId: string;
  videoUrl?: string | null;
  youtubeId?: string | null;
  duration: number;
  initialWatched: number;
  initialPosition: number;
  attended: boolean;
  threshold: number;
};

const SEND_EVERY = 15; // segundos reproducidos entre cada envío
const nextCheck = () => (8 + Math.random() * 7) * 60; // control de presencia cada 8–15 min de reproducción

/**
 * Reproductor que registra la asistencia: cuenta sólo los segundos realmente reproducidos
 * (adelantar no suma) y pide confirmar presencia cada cierto tiempo.
 */
export default function LessonPlayer(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytRef = useRef<any>(null);
  const ytHost = useRef<HTMLDivElement>(null);
  const pending = useRef(0);
  const lastTime = useRef<number | null>(null);
  const untilCheck = useRef(nextCheck());
  const position = useRef(props.initialPosition);
  const realDuration = useRef(props.duration);

  const [watched, setWatched] = useState(props.initialWatched);
  const [attended, setAttended] = useState(props.attended);
  const [askPresence, setAskPresence] = useState(false);

  const effectiveDuration = props.duration || realDuration.current || 0;

  const send = useCallback(
    async (presence = false, beacon = false) => {
      const seconds = Math.floor(pending.current);
      if (!seconds && !presence) return;
      pending.current -= seconds;
      const payload = JSON.stringify({
        lessonId: props.lessonId,
        seconds,
        position: Math.floor(position.current),
        duration: Math.floor(realDuration.current || 0),
        presence,
      });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/progreso", new Blob([payload], { type: "application/json" }));
        return;
      }
      try {
        const res = await fetch("/api/progreso", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
        if (res.ok) {
          const data = await res.json();
          setWatched(data.watched_seconds);
          if (data.attended) setAttended(true);
        }
      } catch {
        pending.current += seconds;
      }
    },
    [props.lessonId],
  );

  const pause = useCallback(() => {
    videoRef.current?.pause();
    ytRef.current?.pauseVideo?.();
  }, []);

  /** Suma segundos reproducidos y dispara envíos / control de presencia. */
  const tick = useCallback(
    (delta: number) => {
      pending.current += delta;
      untilCheck.current -= delta;
      if (pending.current >= SEND_EVERY) send();
      if (untilCheck.current <= 0 && !attended) {
        pause();
        setAskPresence(true);
      }
    },
    [send, pause, attended],
  );

  // Video propio (HTML5)
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || askPresence) return;
    position.current = v.currentTime;
    if (lastTime.current !== null) {
      const d = v.currentTime - lastTime.current;
      if (d > 0 && d < 2) tick(d); // saltos grandes = el alumno adelantó: no cuentan
    }
    lastTime.current = v.currentTime;
  };

  // YouTube
  useEffect(() => {
    if (!props.youtubeId) return;
    let interval: ReturnType<typeof setInterval>;
    const create = () => {
      ytRef.current = new window.YT.Player(ytHost.current, {
        videoId: props.youtubeId,
        playerVars: { rel: 0, modestbranding: 1, start: props.initialPosition || undefined },
        events: {
          onReady: (e: any) => {
            realDuration.current = e.target.getDuration?.() || realDuration.current;
          },
        },
      });
      interval = setInterval(() => {
        const p = ytRef.current;
        if (!p?.getPlayerState) return;
        if (p.getPlayerState() === 1) {
          const t = p.getCurrentTime();
          if (lastTime.current !== null) {
            const d = t - lastTime.current;
            if (d > 0 && d < 3) tick(d);
          }
          lastTime.current = t;
          position.current = t;
        } else {
          lastTime.current = null;
        }
      }, 1000);
    };
    if (window.YT?.Player) create();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        create();
      };
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(s);
      }
    }
    return () => {
      clearInterval(interval);
      ytRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.youtubeId]);

  // Enviar lo pendiente al salir de la página
  useEffect(() => {
    const flush = () => send(false, true);
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [send]);

  const confirmPresence = () => {
    setAskPresence(false);
    untilCheck.current = nextCheck();
    lastTime.current = null;
    send(true);
    if (videoRef.current) videoRef.current.play();
    else ytRef.current?.playVideo?.();
  };

  const required = Math.ceil(effectiveDuration * props.threshold);
  const pct = required ? Math.min(100, Math.round((watched / required) * 100)) : 0;

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-black">
        {props.videoUrl ? (
          <video
            ref={videoRef}
            src={props.videoUrl}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            playsInline
            className="aspect-video w-full"
            onLoadedMetadata={(e) => {
              realDuration.current = e.currentTarget.duration;
              if (props.initialPosition && props.initialPosition < e.currentTarget.duration - 5)
                e.currentTarget.currentTime = props.initialPosition;
            }}
            onTimeUpdate={onTimeUpdate}
            onSeeking={() => (lastTime.current = null)}
            onPause={() => send()}
            onEnded={() => send()}
          />
        ) : (
          <div className="aspect-video w-full">
            <div ref={ytHost} className="h-full w-full" />
          </div>
        )}
        {askPresence && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-navy-900/90 p-6 text-center text-white">
            <p className="font-serif text-2xl text-gold-300">¿Seguís ahí?</p>
            <p className="text-sm text-gray-200">Confirmá tu presencia para continuar la clase y registrar tu asistencia.</p>
            <button onClick={confirmPresence} className="btn-gold">Estoy presente</button>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-gold-100 bg-white p-4">
        {attended ? (
          <p className="font-semibold text-emerald-700">✓ Asistencia registrada para esta clase</p>
        ) : (
          <>
            <div className="mb-1 flex justify-between text-xs text-gray-600">
              <span>Asistencia: mirá al menos el {Math.round(props.threshold * 100)}% de la clase (adelantar no cuenta)</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-gold-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
