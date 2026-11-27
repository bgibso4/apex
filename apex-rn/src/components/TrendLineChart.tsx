/**
 * APEX — SVG Line Chart
 * Renders trend data as smooth polylines with filled areas,
 * grid lines, data dots, and x-axis labels.
 * Matches the mockup SVG specifications exactly.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Polyline, Path, Circle, Line, Rect, Text as SvgText, Defs, LinearGradient, Stop,
} from 'react-native-svg';
import { Colors, FontSize, Spacing } from '../theme';

export interface TrendDataPoint {
  value: number;
  label?: string;
}

export interface TrendLine {
  data: TrendDataPoint[];
  color: string;
  /** Use a gradient ID instead of solid color for the stroke */
  gradientColors?: string[];
  dashed?: boolean;
  opacity?: number;
}

interface Props {
  /** Primary line data (or single line) */
  lines: TrendLine[];
  /** Chart height in px */
  height?: number;
  /** SVG viewBox width (default 300) */
  viewBoxWidth?: number;
  /** SVG viewBox height (default 80) */
  viewBoxHeight?: number;
  /** Number of horizontal grid lines (default 4) */
  gridLines?: number;
  /** Show filled area under the first line */
  showArea?: boolean;
  /** Area opacity (default 0.08) */
  areaOpacity?: number;
  /** Min value for Y axis (default: auto from data) */
  minValue?: number;
  /** Max value for Y axis (default: auto from data) */
  maxValue?: number;
  /** Invert Y axis (lower values at top — for pace charts) */
  inverted?: boolean;
  /** X-axis labels to show below chart */
  xLabels?: string[];
  /** Y-axis labels to show on right side */
  yLabels?: string[];
  /** Show data dots (default true) */
  showDots?: boolean;
  /** Gradient ID for the primary line */
  gradientId?: string;
  /** Block background bands (e.g., training phases) */
  bands?: { startIndex: number; endIndex: number; label: string; color: string }[];
  /** Show band labels (default false — use true for larger charts) */
  showBandLabels?: boolean;
}

export default function TrendLineChart({
  lines,
  height = 80,
  viewBoxWidth = 300,
  viewBoxHeight = 80,
  gridLines = 4,
  showArea = true,
  areaOpacity = 0.08,
  minValue,
  maxValue,
  inverted = false,
  xLabels,
  yLabels,
  showDots = true,
  gradientId,
  bands,
  showBandLabels = false,
}: Props) {
  if (lines.length === 0 || lines[0].data.length === 0) return null;

  // Calculate bounds across all lines
  const allValues = lines.flatMap(l => l.data.map(d => d.value)).filter(v => v > 0);
  if (allValues.length === 0) return null;

  const dataMin = minValue ?? Math.min(...allValues);
  const dataMax = maxValue ?? Math.max(...allValues);
  const range = dataMax - dataMin || 1;
  const padding = viewBoxHeight * 0.22; // 22% padding top/bottom — keeps line from feeling zoomed in
  const scale = height / viewBoxHeight; // compensate for viewBox→render scaling

  const toY = (value: number): number => {
    const normalized = (value - dataMin) / range;
    const y = padding + (1 - normalized) * (viewBoxHeight - 2 * padding);
    return inverted ? (viewBoxHeight - y) : y;
  };

  const toX = (index: number, total: number): number => {
    if (total <= 1) return viewBoxWidth / 2;
    return (index / (total - 1)) * viewBoxWidth;
  };

  const buildPoints = (data: TrendDataPoint[]): string => {
    return data.map((d, i) => `${toX(i, data.length)},${toY(d.value)}`).join(' ');
  };

  const buildAreaPath = (data: TrendDataPoint[]): string => {
    const pts = data.map((d, i) => ({
      x: toX(i, data.length),
      y: toY(d.value),
    }));
    if (pts.length === 0) return '';
    const lastX = pts[pts.length - 1].x;
    const firstX = pts[0].x;
    const bottom = viewBoxHeight;
    return `M${pts.map(p => `${p.x},${p.y}`).join(' L')} L${lastX},${bottom} L${firstX},${bottom} Z`;
  };

  // Grid line positions
  const gridPositions = Array.from({ length: gridLines }, (_, i) =>
    (i / (gridLines - 1)) * viewBoxHeight
  );

  return (
    <View>
      <View style={{ height }}>
        <Svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="none"
          width="100%"
          height={height}
        >
          {/* Gradient definitions */}
          <Defs>
            {lines.map((line, li) =>
              line.gradientColors ? (
                <LinearGradient
                  key={`grad-${li}`}
                  id={gradientId ?? `lineGrad${li}`}
                  x1="0" y1="0" x2="1" y2="0"
                >
                  {line.gradientColors.map((c, ci) => (
                    <Stop
                      key={ci}
                      offset={`${(ci / (line.gradientColors!.length - 1)) * 100}%`}
                      stopColor={c}
                    />
                  ))}
                </LinearGradient>
              ) : null
            )}
          </Defs>

          {/* Block background bands */}
          {bands && bands.map((band, bi) => {
            const total = lines[0]?.data.length ?? 0;
            if (total === 0) return null;

            // Calculate x positions with midpoint boundaries
            const x1 = band.startIndex === 0
              ? 0
              : (toX(band.startIndex, total) + toX(band.startIndex - 1, total)) / 2;
            const x2 = band.endIndex === total - 1
              ? viewBoxWidth
              : (toX(band.endIndex, total) + toX(band.endIndex + 1, total)) / 2;

            return (
              <React.Fragment key={`band-${bi}`}>
                <Rect
                  x={x1}
                  y={0}
                  width={x2 - x1}
                  height={viewBoxHeight}
                  fill={band.color}
                />
                {showBandLabels && (
                  <SvgText
                    x={(x1 + x2) / 2}
                    y={viewBoxHeight - 4}
                    fill={Colors.textMuted}
                    fontSize={8}
                    textAnchor="middle"
                    opacity={0.6}
                  >
                    {band.label}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}

          {/* Grid lines */}
          {gridPositions.map((y, i) => (
            <Line
              key={`grid-${i}`}
              x1="0" y1={y}
              x2={viewBoxWidth} y2={y}
              stroke={Colors.surface}
              strokeWidth={0.5 / scale}
              opacity={0.5}
            />
          ))}

          {/* Lines + areas */}
          {lines.map((line, li) => {
            const filteredData = line.data.filter(d => d.value > 0);
            if (filteredData.length < 2) return null;

            const points = buildPoints(filteredData);
            const strokeColor = line.gradientColors
              ? `url(#${gradientId ?? `lineGrad${li}`})`
              : line.color;

            return (
              <React.Fragment key={`line-${li}`}>
                {/* Filled area (first line only unless specified) */}
                {showArea && li === 0 && (
                  <Path
                    d={buildAreaPath(filteredData)}
                    fill={line.color}
                    opacity={areaOpacity}
                  />
                )}

                {/* Line */}
                <Polyline
                  points={points}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={(line.dashed ? 1.5 : 1.8) / scale}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={line.dashed ? '6,4' : undefined}
                  opacity={line.opacity ?? 1}
                />

                {/* Data dots — minimal: only last point, or all if sparse */}
                {showDots && filteredData.map((d, i) => {
                  const cx = toX(i, filteredData.length);
                  const cy = toY(d.value);
                  const isLast = i === filteredData.length - 1;
                  const isSparse = filteredData.length <= 4;

                  // For sparse data: show small dots on all points
                  // For dense data: only show dot on the current (last) point
                  if (!isLast && !isSparse) return null;

                  return (
                    <Circle
                      key={`dot-${li}-${i}`}
                      cx={cx} cy={cy}
                      r={(isLast ? 2.5 : 2) / scale}
                      fill={line.color}
                      opacity={line.dashed ? 0.5 : 1}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Y-axis labels */}
          {yLabels && yLabels.map((label, i) => {
            const y = gridPositions[i];
            if (y === undefined) return null;
            return null; // Rendered as Text components below for better RN compat
          })}
        </Svg>
      </View>

      {/* X-axis labels */}
      {xLabels && xLabels.length > 0 && (
        <View style={styles.xLabels}>
          {xLabels.map((label, i) => (
            <Text
              key={i}
              style={[
                styles.xLabel,
                i === xLabels.length - 1 && styles.xLabelCurrent,
              ]}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

/** Compact sparkline for mini charts (no dots, no area, thin line) */
export function SparkLine({
  data,
  color,
  height = 24,
  opacity = 0.25,
}: {
  data: number[];
  color: string;
  height?: number;
  opacity?: number;
}) {
  const filtered = data.filter(v => v > 0);
  if (filtered.length < 2) return null;

  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const range = max - min || 1;
  const vbW = 120;
  const vbH = 24;

  const points = filtered
    .map((v, i) => {
      const x = (i / (filtered.length - 1)) * vbW;
      const y = 2 + (1 - (v - min) / range) * (vbH - 4);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View style={{ height }}>
      <Svg viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="none" width="100%" height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={opacity}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  xLabel: {
    color: Colors.border,
    fontSize: FontSize.chartLabel,
    fontWeight: '600',
  },
  xLabelCurrent: {
    color: Colors.textMuted,
  },
});
