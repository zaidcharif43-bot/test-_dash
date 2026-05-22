const fs = require('fs');
const envPath = 'c:\\Users\\mosta\\OneDrive\\Desktop\\dashbaord-ai\\test-_dash\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] ? match[2].trim() : '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    val = val.split(' #')[0].trim();
    env[match[1]] = val;
  }
});

async function run() {
  try {
    const sheetId = env.GOOGLE_SHEETS_ID;
    
    // Fetch both tabs
    const infoUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent("page of informations")}&t=${Date.now()}`;
    const infoRes = await fetch(infoUrl);
    const infoText = await infoRes.text();
    
    const draftUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent("draft_post")}&t=${Date.now()}`;
    const draftRes = await fetch(draftUrl);
    const draftText = await draftRes.text();
    
    const prefix = 'google.visualization.Query.setResponse(';
    
    const infoJson = JSON.parse(infoText.substring(infoText.indexOf(prefix) + prefix.length, infoText.lastIndexOf(');')));
    const draftJson = JSON.parse(draftText.substring(draftText.indexOf(prefix) + prefix.length, draftText.lastIndexOf(');')));
    
    const infoCols = infoJson.table.cols.map(c => c.label);
    const infoRows = infoJson.table.rows.map(r => {
      const rowData = {};
      r.c.forEach((cell, idx) => {
        const key = infoCols[idx] || ('col_' + idx);
        rowData[key] = cell ? cell.v : null;
      });
      return rowData;
    });

    const draftCols = draftJson.table.cols.map(c => c.label);
    const draftRows = draftJson.table.rows.map(r => {
      const rowData = {};
      r.c.forEach((cell, idx) => {
        const key = draftCols[idx] || ('col_' + idx);
        rowData[key] = cell ? cell.v : null;
      });
      return rowData;
    });

    // Link the "Status" from tab 1 to the "Service name" from tab 2
    const mergedData = infoRows.map((infoRow) => {
      const draftRow = draftRows.find((d) => 
        (d.draft_id_for_butt && d.draft_id_for_butt === infoRow.draft_id_info) || 
        (d.draft_id && d.draft_id === infoRow.draft_id_info)
      );
      
      return {
        ...infoRow,
        ...draftRow, 
        ServiceTitle: draftRow?.service || infoRow.draft_id_info || "Service non défini"
      };
    });

    // Parse the mergedData in the same way page.tsx does:
    const normalized = mergedData.map((d) => {
       let parsedDate = "N/A";
       let parsedTime = "N/A";
       if (d.PublishedAt) {
         const parts = d.PublishedAt.split(" ");
         if (parts[0]) {
           const [day, month, year] = parts[0].split("/");
           if (day && month && year) {
             parsedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
           }
         }
         if (parts[1]) {
           parsedTime = parts[1].substring(0, 5);
         }
       }

       let statusText = d.Status || "Programme";
       if (statusText.includes("Published")) statusText = "Publie";
       if (statusText.includes("Refused")) statusText = "Rejete";

       return {
         id: d.draft_id_info || Math.random(),
         title: d.Service || d.ServiceTitle || "Publication",
         platform: d.Social_Network || "Omnicanal",
         date: parsedDate,
         dateTime: parsedTime,
         status: statusText,
         originalPublishedAt: d.PublishedAt
       };
    });

    console.log("NORMALIZED POSTS:");
    console.log(JSON.stringify(normalized, null, 2));

  } catch (err) {
    console.error(err);
  }
}
run();
