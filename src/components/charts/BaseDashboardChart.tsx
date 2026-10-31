import { ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, radius } from '@/theme';

export type ChartPoint = { x: number | string; y: number; label?: string };

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  /** `bar` series sharing an x value are stacked; line/area are drawn through the points. */
  kind: 'line' | 'area' | 'bar';
  data: ChartPoint[];
  dashed?: boolean;
};

export type ChartMarker = { x: number; y: number; label: string; color?: string };

export type TooltipRow = { label: string; value: string; color: string };

export type BaseDashboardChartProps = {
  title?: string;
  subtitle?: string;
  series: ChartSeries[];
  /** Pinned callouts, e.g. the break-even intercept. Only for numeric x axes. */
  markers?: ChartMarker[];
  height?: number;
  xFormat?: (x: number | string) => string;
  yFormat?: (y: number) => string;
  /** Replace the default tooltip body (rows of "series: value"). */
  tooltip?: {
    title?: (x: number | string) => string;
    row?: (series: ChartSeries, point: ChartPoint) => TooltipRow;
  };
  showLegend?: boolean;
  emptyText?: string;
};

const PAD = { top: 12, right: 16, bottom: 28, left: 56 };

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) max = min + 1;
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

const compact = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${+(a / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(a / 1e3).toFixed(1)}k` : `${+a.toFixed(a < 10 ? 2 : 0)}`;
  return n < 0 ? `-${s}` : s;
};

export function BaseDashboardChart({
  title,
  subtitle,
  series,
  markers = [],
  height = 260,
  xFormat = (x) => (typeof x === 'number' ? compact(x) : x),
  yFormat = compact,
  tooltip,
  showLegend = true,
  emptyText = 'Enter values to see the chart',
}: BaseDashboardChartProps) {
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const surface = useRef<ComponentRef<typeof View>>(null);
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fade]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.floor(e.nativeEvent.layout.width));

  const hasBars = series.some((s) => s.kind === 'bar');
  const plotW = Math.max(width - PAD.left - PAD.right, 0);
  const plotH = Math.max(height - PAD.top - PAD.bottom, 0);

  const model = useMemo(() => {
    // Ordered, unique x values across all series (category axis when bars are present).
    const xs: (number | string)[] = [];
    const seen = new Set<number | string>();
    for (const s of series) for (const p of s.data) if (!seen.has(p.x)) {
          seen.add(p.x);
          xs.push(p.x);
        }
    const numeric = !hasBars && xs.every((x) => typeof x === 'number');
    if (numeric) xs.sort((a, b) => (a as number) - (b as number));

    // Stack bars per x; y-extent covers stacked totals and every line point.
    let lo = 0;
    let hi = 0;
    const stackBase = new Map<string, number>(); // `${seriesId}|${x}` -> [start]
    for (const x of xs) {
      let pos = 0;
      let neg = 0;
      for (const s of series) {
        const p = s.data.find((d) => d.x === x);
        if (!p || !Number.isFinite(p.y)) continue;
        if (s.kind === 'bar') {
          stackBase.set(`${s.id}|${x}`, p.y >= 0 ? pos : neg);
          if (p.y >= 0) pos += p.y;
          else neg += p.y;
        } else {
          lo = Math.min(lo, p.y);
          hi = Math.max(hi, p.y);
        }
      }
      hi = Math.max(hi, pos);
      lo = Math.min(lo, neg);
    }
    for (const m of markers) {
      lo = Math.min(lo, m.y);
      hi = Math.max(hi, m.y);
    }
    if (hi === lo) hi = lo + 1;
    const ticks = niceTicks(lo, hi);
    const yMin = Math.min(ticks[0], lo);
    const yMax = Math.max(ticks[ticks.length - 1], hi);

    let xMin = 0;
    let xMax = 1;
    if (numeric) {
      xMin = xs[0] as number;
      xMax = xs[xs.length - 1] as number;
      if (xMax === xMin) xMax = xMin + 1;
    }
    return { xs, numeric, ticks, yMin, yMax, xMin, xMax, stackBase };
  }, [series, markers, hasBars]);

  const { xs, numeric, ticks, yMin, yMax, xMin, xMax, stackBase } = model;
  const sx = (x: number | string, i: number) =>
    numeric
      ? PAD.left + (((x as number) - xMin) / (xMax - xMin)) * plotW
      : PAD.left + ((i + 0.5) / Math.max(xs.length, 1)) * plotW;
  const sy = (y: number) => PAD.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;
  const bandW = plotW / Math.max(xs.length, 1);
  const barW = Math.min(bandW * 0.6, 72);

  const empty = xs.length === 0 || series.every((s) => s.data.every((p) => !p.y));

  // Nearest x index for a pointer position inside the svg.
  const indexAt = (px: number): number => {
    if (xs.length === 0 || plotW <= 0) return 0;
    let best = 0;
    let bestD = Infinity;
    xs.forEach((x, i) => {
      const d = Math.abs(sx(x, i) - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  // Web hover: RN-Web doesn't forward pointer-move on View, so bind to the DOM node.
  // No dep array on purpose: rebinding each render keeps the handler on the latest scales.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = surface.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const move = (e: PointerEvent) => setHover(indexAt(e.clientX - node.getBoundingClientRect().left));
    const leave = () => setHover(null);
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    return () => {
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
    };
  });

  const paths = (s: ChartSeries) => {
    const pts = s.data
      .filter((p) => Number.isFinite(p.y))
      .map((p) => ({ px: sx(p.x, xs.indexOf(p.x)), py: sy(p.y), x: p.x }))
      .sort((a, b) => a.px - b.px);
    if (pts.length === 0) return { line: '', area: '' };
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ');
    const base = sy(Math.max(yMin, Math.min(0, yMax)));
    const area = `${line} L${pts[pts.length - 1].px.toFixed(1)},${base} L${pts[0].px.toFixed(1)},${base} Z`;
    return { line, area };
  };

  const hoverX = hover !== null && xs[hover] !== undefined ? xs[hover] : null;
  const tipRows: TooltipRow[] =
    hoverX === null
      ? []
      : series.flatMap((s) => {
          const p = s.data.find((d) => d.x === hoverX);
          if (!p || !Number.isFinite(p.y)) return [];
          if (s.kind === 'bar' && p.y === 0) return [];
          return [tooltip?.row ? tooltip.row(s, p) : { label: p.label ?? s.label, value: yFormat(p.y), color: s.color }];
        });
  const tipLeft = hover !== null && hoverX !== null ? sx(hoverX, hover) : 0;
  const flip = tipLeft > width * 0.6;

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {/* Explicit width/height: a bare flex child collapses to 0px on web. */}
      <View ref={surface} onLayout={onLayout} style={[styles.surface, { height }]}>
        {width > 0 && !empty ? (
          <Animated.View style={{ opacity: fade, width, height }}>
            <Svg width={width} height={height}>
              {ticks.map((t) => (
                <G key={t}>
                  <Line x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} stroke={colors.border} strokeWidth={1} strokeDasharray={t === 0 ? undefined : '3 4'} />
                  <SvgText x={PAD.left - 8} y={sy(t) + 4} fill={colors.muted} fontSize={11} textAnchor="end">
                    {yFormat(t)}
                  </SvgText>
                </G>
              ))}

              {(numeric ? niceTicks(xMin, xMax, 5).filter((t) => t >= xMin && t <= xMax) : xs).map((x, i) => (
                <SvgText key={String(x)} x={sx(x, i)} y={height - 8} fill={colors.muted} fontSize={11} textAnchor="middle">
                  {xFormat(x)}
                </SvgText>
              ))}

              {hoverX !== null && (
                <Line x1={tipLeft} x2={tipLeft} y1={PAD.top} y2={PAD.top + plotH} stroke={colors.muted} strokeWidth={1} strokeDasharray="2 3" />
              )}

              {series.filter((s) => s.kind === 'bar').map((s) =>
                s.data.map((p) => {
                  if (!Number.isFinite(p.y) || p.y === 0) return null;
                  const i = xs.indexOf(p.x);
                  const start = stackBase.get(`${s.id}|${p.x}`) ?? 0;
                  const y1 = sy(start + p.y);
                  const y0 = sy(start);
                  return (
                    <Rect
                      key={`${s.id}|${p.x}`}
                      x={sx(p.x, i) - barW / 2}
                      y={Math.min(y0, y1)}
                      width={barW}
                      height={Math.max(Math.abs(y0 - y1) - 1, 0)}
                      rx={3}
                      fill={s.color}
                      opacity={hoverX === null || hoverX === p.x ? 1 : 0.45}
                    />
                  );
                }),
              )}

              {series.filter((s) => s.kind !== 'bar').map((s) => {
                const { line, area } = paths(s);
                return (
                  <G key={s.id}>
                    {s.kind === 'area' && <Path d={area} fill={s.color} opacity={0.15} />}
                    <Path d={line} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '6 5' : undefined} />
                  </G>
                );
              })}

              {hoverX !== null &&
                series.filter((s) => s.kind !== 'bar').map((s) => {
                  const p = s.data.find((d) => d.x === hoverX);
                  return p && Number.isFinite(p.y) ? <Circle key={s.id} cx={tipLeft} cy={sy(p.y)} r={4.5} fill={s.color} stroke={colors.surface} strokeWidth={2} /> : null;
                })}

              {markers.map((m) => (
                <G key={m.label}>
                  <Circle cx={sx(m.x, 0)} cy={sy(m.y)} r={6} fill={m.color ?? colors.warn} stroke={colors.surface} strokeWidth={2} />
                  <SvgText
                    x={Math.min(Math.max(sx(m.x, 0), PAD.left + 40), width - PAD.right - 40)}
                    y={sy(m.y) - 12}
                    fill={m.color ?? colors.warn}
                    fontSize={11}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {m.label}
                  </SvgText>
                </G>
              ))}
            </Svg>

            {/* Touch/press support for native; web uses the pointer listeners above. */}
            <View
              style={StyleSheet.absoluteFill}
              onStartShouldSetResponder={() => true}
              onResponderGrant={(e) => setHover(indexAt(e.nativeEvent.locationX))}
              onResponderMove={(e) => setHover(indexAt(e.nativeEvent.locationX))}
              onResponderRelease={() => {
                if (Platform.OS !== 'web') setHover(null);
              }}
            />

            {hover !== null && tipRows.length > 0 && (
              <View pointerEvents="none" style={[styles.tip, flip ? { right: width - tipLeft + 10 } : { left: tipLeft + 10 }]}>
                <Text style={styles.tipTitle}>{tooltip?.title ? tooltip.title(hoverX as number | string) : xFormat(hoverX as number | string)}</Text>
                {tipRows.map((r) => (
                  <View key={r.label} style={styles.tipRow}>
                    <View style={[styles.dot, { backgroundColor: r.color }]} />
                    <Text style={styles.tipLabel}>{r.label}</Text>
                    <Text style={styles.tipValue}>{r.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        )}
      </View>

      {showLegend && (
        <View style={styles.legend}>
          {series.map((s) => (
            <View key={s.id} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 8 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  surface: { width: '100%', borderRadius: radius.md, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  emptyText: { color: colors.muted, fontSize: 13 },
  tip: {
    position: 'absolute',
    top: PAD.top,
    minWidth: 150,
    padding: 10,
    gap: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipTitle: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 2 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipLabel: { color: colors.text, fontSize: 12, flex: 1 },
  tipValue: { color: colors.text, fontSize: 12, fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: colors.muted, fontSize: 12 },
});
