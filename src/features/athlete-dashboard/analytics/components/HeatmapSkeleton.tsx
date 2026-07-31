const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const DOW_W = 28;
const MONTH_H = 20;
const COLS = 53;

export function HeatmapSkeleton() {
  const cells = [];
  for (let col = 0; col < COLS; col++) for (let row = 0; row < 7; row++) cells.push({ x: DOW_W + col * STEP, y: MONTH_H + row * STEP });
  return (
    <svg width={DOW_W + COLS * STEP} height={MONTH_H + 7 * STEP}>
      {cells.map(({ x, y }, index) => <rect key={index} x={x} y={y} width={CELL} height={CELL} rx={2} fill="#F3F4F6" />)}
    </svg>
  );
}
