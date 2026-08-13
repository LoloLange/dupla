export function bloquearScrollPagina(): () => void {
  const html = document.documentElement;
  const prevHtml = html.style.overflow;
  html.style.overflow = "hidden";
  return () => {
    html.style.overflow = prevHtml;
  };
}
