import React, { useState, useRef, useEffect } from 'react';
import PlotModal from './PlotModal';
import './DataTable.css';

// Jump ratio definitions: which pairs get a Jump % column
const JUMP_RATIOS = [
  { after: 'B_2', col1: 'B_1', col2: 'B_2', label: 'Jump % (B)' },
  { after: 'V_2', col1: 'V_1', col2: 'V_2', label: 'Jump % (V)' },
  { after: 'den_2', col1: 'den_1', col2: 'den_2', label: 'Jump % (den)' },
  { after: 'T_2', col1: 'T_1', col2: 'T_2', label: 'Jump % (T)' },
];

function generateShockId(row) {
  const date = (row.Date || '').replace(/-/g, '');
  const time = (row.Time || '').replace(/:/g, '');
  if (!date) return '—';
  return `${date}_${time}`;
}

function computeJumpPercent(row, col1, col2) {
  const initial = parseFloat(row[col1]);
  const final_ = parseFloat(row[col2]);
  if (isNaN(initial) || isNaN(final_) || final_ === 0) return '—';
  const pct = ((final_ - initial) / final_) * 100;
  return pct.toFixed(1);
}

// ── Download helpers ──

function buildExportRows(data, displayColumns) {
  const headers = ['Shock ID', ...displayColumns.map((c) => c.label)];
  const rows = data.map((row) => {
    const shockId = generateShockId(row);
    const cells = displayColumns.map((col) => {
      if (col.type === 'jump') {
        const val = computeJumpPercent(row, col.col1, col.col2);
        return val !== '—' ? `${val}%` : val;
      }
      return row[col.key] ?? '';
    });
    return [shockId, ...cells];
  });
  return { headers, rows };
}

function downloadCSV(data, displayColumns) {
  const { headers, rows } = buildExportRows(data, displayColumns);
  const escape = (v) => {
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => lines.push(r.map(escape).join(',')));
  triggerDownload(lines.join('\n'), 'shock_data.csv', 'text/csv');
}

function downloadTXT(data, displayColumns) {
  const { headers, rows } = buildExportRows(data, displayColumns);
  // Compute max width for each column for aligned output
  const widths = headers.map((h, i) => {
    let max = h.length;
    rows.forEach((r) => {
      max = Math.max(max, String(r[i]).length);
    });
    return max + 2;
  });
  const pad = (val, w) => String(val).padEnd(w);
  const lines = [headers.map((h, i) => pad(h, widths[i])).join('')];
  rows.forEach((r) => lines.push(r.map((v, i) => pad(v, widths[i])).join('')));
  triggerDownload(lines.join('\n'), 'shock_data.txt', 'text/plain');
}

function downloadCDF(data, displayColumns) {
  // CDF-like plain text format (NASA CDF-style key-value records)
  const { headers, rows } = buildExportRows(data, displayColumns);
  const lines = [
    '! Common Data Format (CDF) — Text Export',
    `! Generated: ${new Date().toISOString()}`,
    `! Variables: ${headers.join(', ')}`,
    `! Records: ${rows.length}`,
    '',
  ];
  rows.forEach((r, idx) => {
    lines.push(`Record ${idx + 1}:`);
    headers.forEach((h, i) => {
      lines.push(`  ${h} = ${r[i]}`);
    });
    lines.push('');
  });
  triggerDownload(lines.join('\n'), 'shock_data.cdf', 'text/plain');
}

function triggerDownload(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Download menu component ──

function DownloadMenu({ onDownload, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="download-menu-wrapper" ref={ref}>
      <button
        className="download-trigger"
        onClick={() => setOpen(!open)}
        title={label}
      >
        <span className="download-icon">⬇</span>
        <span>{label}</span>
        <span className={`download-chevron ${open ? 'rotated' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="download-menu">
          <button
            className="download-option"
            onClick={() => { onDownload('csv'); setOpen(false); }}
          >
            <span className="format-badge csv">CSV</span>
            <span>Comma-Separated Values</span>
          </button>
          <button
            className="download-option"
            onClick={() => { onDownload('txt'); setOpen(false); }}
          >
            <span className="format-badge txt">TXT</span>
            <span>Space-Aligned Text</span>
          </button>
          <button
            className="download-option"
            onClick={() => { onDownload('cdf'); setOpen(false); }}
          >
            <span className="format-badge cdf">CDF</span>
            <span>Common Data Format</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main DataTable ──

export default function DataTable({ data, selectedParameters = [] }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showPlot, setShowPlot] = useState(false);

  // Reset selection when data changes
  React.useEffect(() => {
    setSelectedRows(new Set());
  }, [data]);

  // Build display column list
  const displayColumns = React.useMemo(() => {
    const fixed = ['Date', 'Time', 'Shock Type'];
    const result = fixed.map((col) => ({ key: col, label: col, type: 'data' }));

    for (const col of selectedParameters) {
      result.push({ key: col, label: col, type: 'data' });

      for (const jr of JUMP_RATIOS) {
        if (col === jr.after && selectedParameters.includes(jr.col1) && selectedParameters.includes(jr.col2)) {
          result.push({
            key: jr.label,
            label: jr.label,
            type: 'jump',
            col1: jr.col1,
            col2: jr.col2,
          });
        }
      }
    }

    return result;
  }, [selectedParameters]);

  const allSelected = data.length > 0 && selectedRows.size === data.length;
  const someSelected = selectedRows.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, i) => i)));
    }
  };

  const toggleRow = (idx) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleDownload = (format) => {
    const rowsToExport = selectedRows.size > 0
      ? data.filter((_, i) => selectedRows.has(i))
      : data;

    if (format === 'csv') downloadCSV(rowsToExport, displayColumns);
    else if (format === 'txt') downloadTXT(rowsToExport, displayColumns);
    else if (format === 'cdf') downloadCDF(rowsToExport, displayColumns);
  };

  const plotData = selectedRows.size > 0
    ? data.filter((_, i) => selectedRows.has(i))
    : data;

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <span className="empty-icon">📡</span>
        <p>No shock events match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-info">
        <div className="table-info-left">
          <span className="result-count">{data.length} event{data.length !== 1 ? 's' : ''}</span>
          {selectedRows.size > 0 && (
            <span className="selection-count">
              · {selectedRows.size} selected
            </span>
          )}
        </div>
        <div className="table-info-right">
          {selectedRows.size > 0 && (
            <button
              className="clear-selection-btn"
              onClick={() => setSelectedRows(new Set())}
            >
              Clear Selection
            </button>
          )}
          <button
            className="plot-btn"
            onClick={() => setShowPlot(true)}
            title={selectedRows.size > 0 ? `Plot (${selectedRows.size} rows)` : 'Plot All'}
          >
            <span>{selectedRows.size > 0 ? `Plot (${selectedRows.size})` : 'Plot'}</span>
          </button>
          <DownloadMenu
            onDownload={handleDownload}
            label={selectedRows.size > 0 ? `Download (${selectedRows.size})` : 'Download All'}
          />
        </div>
      </div>
      <div className="table-scroll">
        <table className="data-table" id="shock-data-table">
          <thead>
            <tr>
              <th className="select-col">
                <label className="table-checkbox-label">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                  />
                  <span className="table-checkmark"></span>
                </label>
              </th>
              <th className="shock-id-col">Shock ID</th>
              {displayColumns.map((col) => (
                <th key={col.key}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const shockId = generateShockId(row);
              const isSelected = selectedRows.has(i);
              return (
                <tr key={i} className={isSelected ? 'row-selected' : ''}>
                  <td className="select-col">
                    <label className="table-checkbox-label">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(i)}
                      />
                      <span className="table-checkmark"></span>
                    </label>
                  </td>
                  <td className="shock-id-col">{shockId}</td>
                  {displayColumns.map((col) => {
                    if (col.type === 'jump') {
                      const val = computeJumpPercent(row, col.col1, col.col2);
                      return (
                        <td key={col.key} className="jump-cell">
                          {val !== '—' ? `${val}%` : val}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.key}
                        className={
                          col.key === 'Shock Type'
                            ? `type-cell type-${row[col.key]}`
                            : ''
                        }
                      >
                        {row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showPlot && (
        <PlotModal
          data={plotData}
          onClose={() => setShowPlot(false)}
        />
      )}
    </div>
  );
}
