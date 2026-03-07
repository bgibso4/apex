import React from 'react';
import { render, screen } from '@testing-library/react-native';
import TrendLineChart, { SparkLine, TrendLine } from '../../src/components/TrendLineChart';

/* ────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────── */

const makeLine = (values: number[], overrides?: Partial<TrendLine>): TrendLine => ({
  data: values.map((v, i) => ({ value: v, label: `W${i + 1}` })),
  color: '#6366f1',
  ...overrides,
});

const defaultLine = makeLine([100, 120, 130, 140, 150]);

/* ────────────────────────────────────────────
 *  TrendLineChart
 * ──────────────────────────────────────────── */

describe('TrendLineChart', () => {
  // ── 1. Renders without crashing ──────────────────────────

  it('renders without crashing with valid data', () => {
    const { toJSON } = render(<TrendLineChart lines={[defaultLine]} />);
    expect(toJSON()).not.toBeNull();
  });

  // ── 2. Returns null when lines array is empty ────────────

  it('returns null when lines array is empty', () => {
    const { toJSON } = render(<TrendLineChart lines={[]} />);
    expect(toJSON()).toBeNull();
  });

  // ── 3. Returns null when data points are all zero ────────

  it('returns null when all data values are zero', () => {
    const zeroLine = makeLine([0, 0, 0, 0]);
    const { toJSON } = render(<TrendLineChart lines={[zeroLine]} />);
    expect(toJSON()).toBeNull();
  });

  // ── 4. Renders x-axis labels ─────────────────────────────

  it('renders x-axis labels when provided', () => {
    const labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
    render(<TrendLineChart lines={[defaultLine]} xLabels={labels} />);

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  // ── 5. Last xLabel gets "current" styling ────────────────

  it('applies current styling to the last xLabel', () => {
    const labels = ['W1', 'W2', 'W3'];
    render(<TrendLineChart lines={[defaultLine]} xLabels={labels} />);

    const lastLabel = screen.getByText('W3');
    const firstLabel = screen.getByText('W1');

    // The last label should have the xLabelCurrent style merged in.
    // Both labels are rendered — we verify styles differ.
    const lastStyles = Array.isArray(lastLabel.props.style)
      ? Object.assign({}, ...lastLabel.props.style.filter(Boolean))
      : lastLabel.props.style;
    const firstStyles = Array.isArray(firstLabel.props.style)
      ? Object.assign({}, ...firstLabel.props.style.filter(Boolean))
      : firstLabel.props.style;

    // The "current" style applies Colors.textMuted as the color,
    // while regular labels use Colors.border.
    expect(lastStyles.color).not.toEqual(firstStyles.color);
  });

  // ── 6. Renders with multiple lines ───────────────────────

  it('renders with multiple lines (dual pain trend use case)', () => {
    const line1 = makeLine([3, 4, 5, 6, 7], { color: '#ef4444' });
    const line2 = makeLine([2, 3, 2, 4, 3], { color: '#f59e0b', dashed: true, opacity: 0.6 });

    const { toJSON } = render(<TrendLineChart lines={[line1, line2]} />);
    expect(toJSON()).not.toBeNull();
  });

  // ── 7. Renders with gradient colors ──────────────────────

  it('renders with gradient colors', () => {
    const gradientLine = makeLine([10, 20, 30, 40], {
      gradientColors: ['#6366f1', '#ec4899'],
    });

    const { toJSON } = render(
      <TrendLineChart lines={[gradientLine]} gradientId="testGrad" />,
    );
    expect(toJSON()).not.toBeNull();
  });

  // ── 8. Renders with dashed line ──────────────────────────

  it('renders with dashed line', () => {
    const dashedLine = makeLine([5, 10, 15, 20], { dashed: true });

    const { toJSON } = render(<TrendLineChart lines={[dashedLine]} />);
    expect(toJSON()).not.toBeNull();
  });

  // ── 9. Renders with inverted mode ────────────────────────

  it('renders with inverted mode', () => {
    const paceLine = makeLine([480, 470, 465, 460]);

    const { toJSON } = render(<TrendLineChart lines={[paceLine]} inverted />);
    expect(toJSON()).not.toBeNull();
  });

  // ── 10. Renders without dots when showDots=false ─────────

  it('renders without dots when showDots is false', () => {
    const { toJSON } = render(
      <TrendLineChart lines={[defaultLine]} showDots={false} />,
    );
    const tree = JSON.stringify(toJSON());

    // With showDots=false, no Circle elements should be rendered.
    // The mock renders Circles with testID="Circle".
    expect(tree).not.toContain('"testID":"Circle"');
  });

  it('renders with dots when showDots is true (default)', () => {
    const { toJSON } = render(<TrendLineChart lines={[defaultLine]} />);
    const tree = JSON.stringify(toJSON());

    // Dots are rendered as Circle mock components with testID="Circle".
    expect(tree).toContain('"testID":"Circle"');
  });

  // ── 11. Handles single data point gracefully ─────────────

  it('handles a single data point gracefully', () => {
    // A single data point means filteredData.length < 2, so the line
    // segment won't render, but the component itself should not crash.
    const singlePointLine = makeLine([42]);

    const { toJSON } = render(<TrendLineChart lines={[singlePointLine]} />);
    // The component renders the outer View + Svg (grid lines still render),
    // but no Polyline/Circle since filteredData.length < 2.
    expect(toJSON()).not.toBeNull();
  });

  // ── Additional edge-case tests ───────────────────────────

  it('renders with explicit minValue and maxValue', () => {
    const { toJSON } = render(
      <TrendLineChart lines={[defaultLine]} minValue={0} maxValue={200} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('renders area under the first line by default', () => {
    const { toJSON } = render(<TrendLineChart lines={[defaultLine]} showArea />);
    const tree = JSON.stringify(toJSON());

    // Area is rendered as a Path mock component with testID="Path".
    expect(tree).toContain('"testID":"Path"');
  });

  it('does not render area when showArea is false', () => {
    const { toJSON } = render(
      <TrendLineChart lines={[defaultLine]} showArea={false} />,
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).not.toContain('"testID":"Path"');
  });

  it('does not render xLabels section when xLabels prop is omitted', () => {
    render(<TrendLineChart lines={[defaultLine]} />);
    expect(screen.queryByText('W1')).toBeNull();
  });

  it('renders with custom height and viewBox dimensions', () => {
    const { toJSON } = render(
      <TrendLineChart
        lines={[defaultLine]}
        height={120}
        viewBoxWidth={400}
        viewBoxHeight={100}
      />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('filters out zero-value points from lines', () => {
    // Line with some zeros mixed in — zeros are filtered, remaining
    // non-zero values should still produce a valid chart.
    const lineWithZeros = makeLine([0, 50, 0, 75, 100]);

    const { toJSON } = render(<TrendLineChart lines={[lineWithZeros]} />);
    expect(toJSON()).not.toBeNull();
  });

  it('returns null when line data array is empty', () => {
    const emptyDataLine: TrendLine = { data: [], color: '#6366f1' };
    const { toJSON } = render(<TrendLineChart lines={[emptyDataLine]} />);
    expect(toJSON()).toBeNull();
  });
});

/* ────────────────────────────────────────────
 *  SparkLine
 * ──────────────────────────────────────────── */

describe('SparkLine', () => {
  // ── 12. Renders with valid data ──────────────────────────

  it('renders with valid data', () => {
    const { toJSON } = render(<SparkLine data={[10, 20, 30, 40]} color="#6366f1" />);
    expect(toJSON()).not.toBeNull();
  });

  // ── 13. Returns null with insufficient data ──────────────

  it('returns null with a single data point', () => {
    const { toJSON } = render(<SparkLine data={[42]} color="#6366f1" />);
    expect(toJSON()).toBeNull();
  });

  it('returns null with an empty data array', () => {
    const { toJSON } = render(<SparkLine data={[]} color="#6366f1" />);
    expect(toJSON()).toBeNull();
  });

  // ── 14. Returns null when all values are zero ────────────

  it('returns null when all values are zero', () => {
    const { toJSON } = render(<SparkLine data={[0, 0, 0, 0]} color="#6366f1" />);
    expect(toJSON()).toBeNull();
  });

  // ── Additional SparkLine tests ───────────────────────────

  it('renders with custom height and opacity', () => {
    const { toJSON } = render(
      <SparkLine data={[5, 10, 15]} color="#22c55e" height={32} opacity={0.5} />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('filters out zero values and still renders if 2+ remain', () => {
    const { toJSON } = render(
      <SparkLine data={[0, 10, 0, 20, 0]} color="#ef4444" />,
    );
    expect(toJSON()).not.toBeNull();
  });

  it('returns null when only one non-zero value remains after filtering', () => {
    const { toJSON } = render(
      <SparkLine data={[0, 42, 0, 0]} color="#ef4444" />,
    );
    expect(toJSON()).toBeNull();
  });

  it('renders with two data points (minimum viable)', () => {
    const { toJSON } = render(<SparkLine data={[5, 10]} color="#6366f1" />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders with identical non-zero values', () => {
    // range will be 0, so the fallback `|| 1` should prevent division issues.
    const { toJSON } = render(<SparkLine data={[50, 50, 50]} color="#6366f1" />);
    expect(toJSON()).not.toBeNull();
  });
});
