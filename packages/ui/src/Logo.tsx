// Stellarouter wordmark. Renders an <svg> whose color follows `currentColor`,
// so the size/color is controlled by the consumer via `className`.
// Shared by the landing-page navbar and the app header.

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="280"
        y="66"
        textAnchor="middle"
        textLength="552"
        lengthAdjust="spacingAndGlyphs"
        fontFamily="'Epilogue', sans-serif"
        fontWeight={800}
        fontSize={72}
        letterSpacing={-3}
        fill="currentColor"
      >
        stellarouter
      </text>
    </svg>
  );
}
