import React, { useState, useRef, useEffect, useCallback } from 'react';
import './PlotModal.css';

// Compute Jump % for virtual columns
const JUMP_PAIRS = {
  'Jump % (B)': ['B_1', 'B_2'],
  'Jump % (V)': ['V_1', 'V_2'],
  'Jump % (den)': ['den_1', 'den_2'],
  'Jump % (T)': ['T_1', 'T_2'],
};

const PLOTTABLE_COLUMNS = [
  'V_sh', 'B_1', 'B_2', 'V_1', 'V_2',
  'den_1', 'den_2', 'T_1', 'T_2',
  'M_A1', 'M_A2', 'M_ms1', 'M_ms2',
  'theta_1', 'theta_2',
  'V_A1', 'V_A2', 'V_fms1', 'V_fms2', 'V_sms1', 'V_sms2',
  'Jump % (B)', 'Jump % (V)', 'Jump % (den)', 'Jump % (T)',
];

function getRowValue(row, param) {
  if (JUMP_PAIRS[param]) {
    const [col1, col2] = JUMP_PAIRS[param];
    const a = parseFloat(row[col1]);
    const b = parseFloat(row[col2]);
    if (isNaN(a) || isNaN(b) || b === 0) return NaN;
    return ((b - a) / b) * 100;
  }
  return parseFloat(row[param]);
}

export default function PlotModal({ data, onClose }) {
  const [xParam, setXParam] = useState(PLOTTABLE_COLUMNS[0]);
  const [yParam, setYParam] = useState(PLOTTABLE_COLUMNS[1]);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointsRef = useRef([]);
  const [tooltip, setTooltip] = useState(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const drawPlot = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 30, right: 30, bottom: 55, left: 65 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Resolve theming
    const rootStyles = getComputedStyle(document.documentElement);
    const textMuted = rootStyles.getPropertyValue('--text-muted').trim() || '#5a6478';
    const textSecondary = rootStyles.getPropertyValue('--text-secondary').trim() || '#8b95b0';
    const borderGlass = rootStyles.getPropertyValue('--border-glass').trim() || 'rgba(255,255,255,0.08)';
    const accentBlue = rootStyles.getPropertyValue('--accent-blue').trim() || '#6395ff';

    // Extract numeric values
    const points = [];
    for (const row of data) {
      const x = getRowValue(row, xParam);
      const y = getRowValue(row, yParam);
      if (!isNaN(x) && !isNaN(y)) {
        points.push({ x, y, row });
      }
    }

    if (points.length === 0) {
      ctx.fillStyle = textMuted;
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No valid data points for the selected parameters.', width / 2, height / 2);
      pointsRef.current = [];
      return;
    }

    const xVals = points.map((p) => p.x);
    const yVals = points.map((p) => p.y);
    let xMin = Math.min(...xVals);
    let xMax = Math.max(...xVals);
    let yMin = Math.min(...yVals);
    let yMax = Math.max(...yVals);

    // Add 5% padding
    const xPad = (xMax - xMin) * 0.05 || 1;
    const yPad = (yMax - yMin) * 0.05 || 1;
    xMin -= xPad; xMax += xPad;
    yMin -= yPad; yMax += yPad;

    const toCanvasX = (v) => padding.left + ((v - xMin) / (xMax - xMin)) * chartW;
    const toCanvasY = (v) => padding.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

    // Grid lines
    ctx.strokeStyle = borderGlass;
    ctx.lineWidth = 1;
    const xTickCount = 6;
    const yTickCount = 6;

    for (let i = 0; i <= xTickCount; i++) {
      const val = xMin + (i / xTickCount) * (xMax - xMin);
      const cx = toCanvasX(val);
      ctx.beginPath();
      ctx.moveTo(cx, padding.top);
      ctx.lineTo(cx, padding.top + chartH);
      ctx.stroke();

      ctx.fillStyle = textMuted;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(val.toFixed(1), cx, padding.top + chartH + 6);
    }

    for (let i = 0; i <= yTickCount; i++) {
      const val = yMin + (i / yTickCount) * (yMax - yMin);
      const cy = toCanvasY(val);
      ctx.beginPath();
      ctx.moveTo(padding.left, cy);
      ctx.lineTo(padding.left + chartW, cy);
      ctx.stroke();

      ctx.fillStyle = textMuted;
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val.toFixed(1), padding.left - 8, cy);
    }

    // Draw points
    const screenPoints = [];
    for (const p of points) {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.y);
      screenPoints.push({ cx, cy, ...p });

      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = accentBlue;
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accentBlue;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    pointsRef.current = screenPoints;

    // Axis labels
    ctx.fillStyle = textSecondary;
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(xParam, padding.left + chartW / 2, height - 16);

    ctx.save();
    ctx.translate(16, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = textSecondary;
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(yParam, 0, 0);
    ctx.restore();

    // Point count label
    ctx.fillStyle = textMuted;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${points.length} point${points.length !== 1 ? 's' : ''}`, width - padding.right, 10);
  }, [data, xParam, yParam]);

  useEffect(() => {
    drawPlot();
    const handleResize = () => drawPlot();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawPlot]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest = null;
    let minDist = 20; // max hover distance in px
    for (const p of pointsRef.current) {
      const dist = Math.sqrt((mx - p.cx) ** 2 + (my - p.cy) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = p;
      }
    }

    if (closest) {
      setTooltip({
        left: closest.cx,
        top: closest.cy,
        x: closest.x,
        y: closest.y,
        date: closest.row.Date || '',
        time: closest.row.Time || '',
      });
      canvas.style.cursor = 'crosshair';
    } else {
      setTooltip(null);
      canvas.style.cursor = 'crosshair';
    }
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="plot-modal-overlay" onClick={onClose}>
      <div className="plot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plot-modal-header">
          <h3 className="plot-modal-title">Parameter Plot</h3>
          <button className="plot-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="plot-controls">
          <div className="plot-control-group">
            <label className="plot-control-label">X-Axis</label>
            <select
              className="plot-control-select"
              value={xParam}
              onChange={(e) => setXParam(e.target.value)}
            >
              {PLOTTABLE_COLUMNS.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
          <div className="plot-control-group">
            <label className="plot-control-label">Y-Axis</label>
            <select
              className="plot-control-select"
              value={yParam}
              onChange={(e) => setYParam(e.target.value)}
            >
              {PLOTTABLE_COLUMNS.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="plot-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          {tooltip && (
            <div
              className="plot-tooltip"
              style={{
                left: `${tooltip.left}px`,
                top: `${tooltip.top - 12}px`,
              }}
            >
              <span className="plot-tooltip-label">{tooltip.date} {tooltip.time}</span>
              <span className="plot-tooltip-value">{xParam}: {tooltip.x.toFixed(2)}</span>
              <span className="plot-tooltip-value">{yParam}: {tooltip.y.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
