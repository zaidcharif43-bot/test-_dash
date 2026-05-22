export async function getPublicGoogleSheet(sheetId: string, sheetName: string) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
    
    // Using fetch directly without needing an API key (sheet must be "Anyone with the link can view")
    const response = await fetch(url, { cache: 'no-store' }); 
    const textData = await response.text();
    
    // Check if it's HTML (error page)
    if (textData.trim().startsWith('<')) {
      console.error("Google Sheets API returned HTML. Make sure the sheet is published to the web and 'Anyone with the link' can view.");
      return [];
    }
    
    // The Google Visualization API wraps the JSON in a JS function call
    const prefix = 'google.visualization.Query.setResponse(';
    const startIndex = textData.indexOf(prefix);
    
    if (startIndex === -1) {
      console.error("Failed to parse Google Sheets response - prefix not found.");
      return [];
    }
    
    const jsonString = textData.substring(startIndex + prefix.length, textData.lastIndexOf(');'));
    
    if (!jsonString) {
      console.error("Failed to parse Google Sheets response - empty JSON substring");
      return [];
    }
    
    const data = JSON.parse(jsonString);
    
    // Convert Google's weird column/cell JSON into an array of simple objects
    const cols = data.table.cols.map((col: any) => col.label);
    let rows = data.table.rows.map((row: any) => {
      const rowData: Record<string, any> = {};
      row.c.forEach((cell: any, index: number) => {
        const key = cols[index] || `col_${index}`;
        rowData[key] = cell ? cell.v : null;
      });
      return rowData;
    });
    
    // Robust header detection: if cols are empty/generic (e.g. col_0, col_1)
    // and the first row contains valid header strings, use them as column labels instead!
    const isGenericCols = cols.every((c: string) => !c || c.startsWith('col_'));
    if (isGenericCols && rows.length > 0) {
      const firstRow = rows[0];
      const hasHeaders = Object.values(firstRow).some((val: any) => 
        typeof val === 'string' && (val.toLowerCase().includes('id') || val.toLowerCase().includes('draft') || val.toLowerCase().includes('service') || val.toLowerCase().includes('status'))
      );
      if (hasHeaders) {
        // Use the first row values as column keys!
        const newCols = Object.keys(firstRow).map((key) => {
          const val = firstRow[key];
          return val ? String(val).trim() : key;
        });
        
        // Map the remaining rows using these new keys
        rows = rows.slice(1).map((row: any) => {
          const rowData: Record<string, any> = {};
          Object.keys(row).forEach((colKey, index) => {
            const newKey = newCols[index] || colKey;
            rowData[newKey] = row[colKey];
          });
          return rowData;
        });
      }
    }
    
    return rows;
  } catch (error) {
    console.error("Error fetching Google Sheet:", error);
    return [];
  }
}