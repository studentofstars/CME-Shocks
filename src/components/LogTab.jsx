import React, { useRef, useEffect, useState, useCallback } from 'react';
import './LogTab.css';

const SATELLITE = 'WIND';
const BAR_COLORS = {
  fill: 'rgba(99, 149, 255, 0.7)',
  fillHover: 'rgba(99, 149, 255, 0.95)',
  stroke: 'rgba(99, 149, 255, 1)',
  gradient1: '#6395ff',
  gradient2: '#a78bfa',
};

function aggregateByYear(data) {
  const counts = {};
  for (const row of data) {
    const date = row.Date || '';
    const year = date.substring(0, 4);
    if (year && /^\d{4}$/.test(year)) {
      counts[year] = (counts[year] || 0) + 1;
    }
  }
  // Fill all years from 1996 to 2023
  const result = [];
  for (let y = 1996; y <= 2023; y++) {
    result.push({ year: String(y), count: counts[String(y)] || 0 });
  }
  return result;
}

export default function LogTab({ data }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const barsRef = useRef([]);

  const yearData = React.useMemo(() => aggregateByYear(data), [data]);
  const maxCount = Math.max(...yearData.map((d) => d.count), 1);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(400, rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Chart area
    const padding = { top: 50, right: 30, bottom: 60, left: 55 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const barCount = yearData.length;
    const barGap = 4;
    const barWidth = Math.max(6, (chartW - barGap * (barCount - 1)) / barCount);

    // Compute nice y-axis ticks
    const yTickCount = 6;
    const yStep = Math.ceil(maxCount / yTickCount) || 1;
    const yMax = yStep * yTickCount;

    // Resolve CSS vars for theming
    const rootStyles = getComputedStyle(document.documentElement);
    const textMuted = rootStyles.getPropertyValue('--text-muted').trim() || '#5a6478';
    const textSecondary = rootStyles.getPropertyValue('--text-secondary').trim() || '#8b95b0';
    const borderGlass = rootStyles.getPropertyValue('--border-glass').trim() || 'rgba(255,255,255,0.08)';

    // Grid lines
    ctx.strokeStyle = borderGlass;
    ctx.lineWidth = 1;
    for (let i = 0; i <= yTickCount; i++) {
      const y = padding.top + chartH - (i / yTickCount) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      // Y label
      ctx.fillStyle = textMuted;
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(yStep * i), padding.left - 10, y);
    }

    // Bars
    const bars = [];
    yearData.forEach((d, i) => {
      const x = padding.left + i * (barWidth + barGap);
      const barH = (d.count / yMax) * chartH;
      const y = padding.top + chartH - barH;

      // Gradient fill
      const grad = ctx.createLinearGradient(x, y, x, padding.top + chartH);
      if (hoveredIdx === i) {
        grad.addColorStop(0, BAR_COLORS.fillHover);
        grad.addColorStop(1, 'rgba(167, 139, 250, 0.85)');
      } else {
        grad.addColorStop(0, BAR_COLORS.gradient1);
        grad.addColorStop(1, BAR_COLORS.gradient2);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Rounded top corners
      const r = Math.min(3, barWidth / 2);
      if (barH > r) {
        ctx.moveTo(x, padding.top + chartH);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.lineTo(x + barWidth - r, y);
        ctx.arcTo(x + barWidth, y, x + barWidth, y + r, r);
        ctx.lineTo(x + barWidth, padding.top + chartH);
      } else if (barH > 0) {
        ctx.rect(x, y, barWidth, barH);
      }
      ctx.closePath();
      ctx.fill();

      // Count label on top of bar
      if (d.count > 0) {
        ctx.fillStyle = hoveredIdx === i ? '#ffffff' : textSecondary;
        ctx.font = `${hoveredIdx === i ? 'bold ' : ''}11px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(d.count), x + barWidth / 2, y - 4);
      }

      // X label (year)
      ctx.save();
      ctx.translate(x + barWidth / 2, padding.top + chartH + 10);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = hoveredIdx === i ? '#ffffff' : textMuted;
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(d.year, 0, 0);
      ctx.restore();

      bars.push({ x, y, w: barWidth, h: barH, year: d.year, count: d.count });
    });

    barsRef.current = bars;

    // Title
    ctx.fillStyle = textSecondary;
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Shocks Detected Per Year — ${SATELLITE}`, padding.left, 12);

    // Y-axis label
    ctx.save();
    ctx.translate(14, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = textMuted;
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Number of Shocks', 0, 0);
    ctx.restore();
  }, [yearData, maxCount, hoveredIdx]);

  // Draw on mount and resize
  useEffect(() => {
    drawChart();
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = -1;
    for (let i = 0; i < barsRef.current.length; i++) {
      const b = barsRef.current[i];
      const barTop = b.y;
      const barBottom = barTop + b.h;
      // Extend hit area to bottom of chart for easier hovering
      if (mx >= b.x && mx <= b.x + b.w && my >= Math.min(barTop, barBottom) && my <= rect.height - 60) {
        found = i;
        break;
      }
    }

    if (found >= 0) {
      const b = barsRef.current[found];
      setTooltip({
        x: b.x + b.w / 2,
        y: b.y - 10,
        year: b.year,
        count: b.count,
      });
      setHoveredIdx(found);
      canvas.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      setHoveredIdx(-1);
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredIdx(-1);
  };

  const totalShocks = yearData.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="log-tab">
      <div className="log-tab-header">
        <div className="log-tab-stats">
          <div className="log-stat">
            <span className="log-stat-value">{totalShocks}</span>
            <span className="log-stat-label">Total Shocks</span>
          </div>
          <div className="log-stat">
            <span className="log-stat-value">{SATELLITE}</span>
            <span className="log-stat-label">Satellite</span>
          </div>
          <div className="log-stat">
            <span className="log-stat-value">1996–2023</span>
            <span className="log-stat-label">Date Range</span>
          </div>
        </div>
      </div>
      <div className="log-chart-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div
            className="log-tooltip"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y - 8}px`,
            }}
          >
            <span className="log-tooltip-year">{tooltip.year}</span>
            <span className="log-tooltip-count">{tooltip.count} shock{tooltip.count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
