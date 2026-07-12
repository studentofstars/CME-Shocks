import React from 'react';
import './DataTable.css';
import { COLUMNS } from '../utils/dataLoader';

const DISPLAY_COLUMNS = COLUMNS.filter((c) => c !== 'Shock Normal');

export default function DataTable({ data }) {
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
              <th className="row-num">#</th>
              {DISPLAY_COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="row-num">{i + 1}</td>
                {DISPLAY_COLUMNS.map((col) => (
                  <td key={col} className={col === 'Shock Type' ? `type-cell type-${row[col]}` : ''}>
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
