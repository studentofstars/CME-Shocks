const DATA_FILES = Array.from({ length: 28 }, (_, i) => `${1996 + i}.txt`);

const COLUMNS = [
  'Date', 'Time', 'Shock Type', 'V_sh', 'Shock Normal',
  'theta_1', 'theta_2', 'B_1', 'B_2', 'V_1', 'V_2',
  'den_1', 'den_2', 'T_1', 'T_2', 'M_A1', 'M_A2',
  'M_ms1', 'M_ms2', 'C_s1', 'C_s2', 'V_A1', 'V_A2',
  'V_fms1', 'V_fms2', 'V_sms1', 'V_sms2',
];

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('Date')) return null;

  const normalMatch = trimmed.match(/\[.*?\]/);
  const shockNormal = normalMatch ? normalMatch[0] : '';

  const before = trimmed.substring(0, normalMatch?.index || 0);
  const after = trimmed.substring((normalMatch?.index || 0) + shockNormal.length);

  const beforeTokens = before.trim().split(/\s+/);
  const afterTokens = after.trim().split(/\s+/).filter(Boolean);

  const date = beforeTokens[0] || '';
  const time = beforeTokens[1] || '';
  const shockType = beforeTokens[2] || '';
  const vsh = beforeTokens[3] || '';

  const values = [date, time, shockType, vsh, shockNormal, ...afterTokens];

  const row = {};
  COLUMNS.forEach((col, i) => {
    row[col] = values[i] || '';
  });
  return row;
}

export async function loadAllData() {
  const allRows = [];
  for (const file of DATA_FILES) {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/${file}`);
      if (!res.ok) continue;
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const row = parseLine(line);
        if (row) allRows.push(row);
      }
    } catch {
      // skip missing files
    }
  }
  return allRows;
}

export { COLUMNS };
