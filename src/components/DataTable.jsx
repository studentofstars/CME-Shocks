import React from 'react';
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

export default function DataTable({ data, selectedParameters = [] }) {
  // Build display column list, using selectedParameters order (not COLUMNS parse order)
  const displayColumns = React.useMemo(() => {
    // Fixed columns always come first
    const fixed = ['Date', 'Time', 'Shock Type'];
    const result = fixed.map((col) => ({ key: col, label: col, type: 'data' }));

    // Then add selected parameters in their defined order
    for (const col of selectedParameters) {
      result.push({ key: col, label: col, type: 'data' });

      // Check if a jump ratio should be injected after this column
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
        <span className="result-count">{data.length} event{data.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="table-scroll">
        <table className="data-table" id="shock-data-table">
          <thead>
            <tr>
              <th className="shock-id-col">Shock ID</th>
              {displayColumns.map((col) => (
                <th key={col.key} className={col.type === 'jump' ? 'jump-header' : ''}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const shockId = generateShockId(row);
              return (
                <tr key={i}>
                  <td className="shock-id-col">{shockId}</td>
                  {displayColumns.map((col) => {
                    if (col.type === 'jump') {
                      const val = computeJumpPercent(row, col.col1, col.col2);
                      const numVal = parseFloat(val);
                      let jumpClass = 'jump-cell';
                      if (!isNaN(numVal)) {
                        jumpClass += numVal >= 0 ? ' jump-positive' : ' jump-negative';
                      }
                      return (
                        <td key={col.key} className={jumpClass}>
                          {val !== '—' ? `${val}%` : val}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={col.key}
                        className={col.key === 'Shock Type' ? `type-cell type-${row[col.key]}` : ''}
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
    </div>
  );
}
