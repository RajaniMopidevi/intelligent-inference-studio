const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => { const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  return { x: r(1) * 100, y: r(2) * 100, s: r(3) * 2 + 0.5, d: r(4) * 4 };
});
export function Starfield() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {STARS.map((s, i) => (
        <span key={i} className="animate-twinkle absolute rounded-full bg-foreground"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
      ))}
    </div>
  );
}
