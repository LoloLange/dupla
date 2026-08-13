"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  onClick?: () => void;
  ariaHidden?: boolean;
  children?: React.ReactNode;
};

export function BloquearScroll({
  className,
  onClick,
  ariaHidden,
  children,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bloquear = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", bloquear, { passive: false });
    return () => el.removeEventListener("wheel", bloquear);
  }, []);

  return (
    <div ref={ref} className={className} onClick={onClick} aria-hidden={ariaHidden}>
      {children}
    </div>
  );
}

export function useContenidoScrollable(
  ref: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const manejar = (e: WheelEvent) => {
      const alInicio = el.scrollTop === 0 && e.deltaY < 0;
      const alFinal =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
      if (alInicio || alFinal) e.preventDefault();
    };
    el.addEventListener("wheel", manejar, { passive: false });
    return () => el.removeEventListener("wheel", manejar);
  }, [ref]);
}
