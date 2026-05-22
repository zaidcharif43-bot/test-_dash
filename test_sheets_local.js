const fs = require('fs');

const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    value = value.split(' #')[0].trim();
    env[match[1]] = value;
  }
});

const sheetId = env.GOOGLE_SHEETS_ID;
console.log("GOOGLE_SHEETS_ID:", sheetId);

async function test() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=page of informations&t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    const textData = await response.text();
    const prefix = 'google.visualization.Query.setResponse(';
    const startIndex = textData.indexOf(prefix);
    const jsonString = textData.substring(startIndex + prefix.length, textData.lastIndexOf(');'));
    const data = JSON.parse(jsonString);
    const cols = data.table.cols.map(col => col.label);
    console.log("Columns:", cols);
    const rows = data.table.rows.slice(0, 10).map(row => {
      const rowData = {};
      row.c.forEach((cell, index) => {
        const key = cols[index] || `col_${index}`;
        rowData[key] = cell ? cell.v : null;
      });
      return rowData;
    });
    console.log("First few rows:");
    console.log(JSON.stringify(rows, null, 2));

    // Fetch draft_post sheet too
    const urlDraft = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=draft_post&t=${Date.now()}`;
    const responseDraft = await fetch(urlDraft, { cache: 'no-store' });
    const textDataDraft = await responseDraft.text();
    const startIndexDraft = textDataDraft.indexOf(prefix);
    const jsonStringDraft = textDataDraft.substring(startIndexDraft + prefix.length, textDataDraft.lastIndexOf(');'));
    const dataDraft = JSON.parse(jsonStringDraft);
    const colsDraft = dataDraft.table.cols.map(col => col.label);
    const rowsDraft = dataDraft.table.rows.slice(0, 10).map(row => {
      const rowData = {};
      row.c.forEach((cell, index) => {
        const key = colsDraft[index] || `col_${index}`;
        rowData[key] = cell ? cell.v : null;
      });
      return rowData;
    });
    console.log("Draft Post Rows:");
    console.log(JSON.stringify(rowsDraft, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
