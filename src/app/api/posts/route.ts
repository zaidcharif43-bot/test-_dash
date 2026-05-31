import { getPublicGoogleSheet } from "@/lib/google-sheets";
import { NextRequest, NextResponse } from "next/server";
import { getConfigValue } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId") || await getConfigValue("GOOGLE_SHEETS_ID");
  
  if (!sheetId) {
    return NextResponse.json({ error: "Missing GOOGLE_SHEETS_ID" }, { status: 500 });
  }

  try {
    // Fetch both tabs to link data!
    const [infoData, draftData] = await Promise.all([
      getPublicGoogleSheet(sheetId, "page of informations"),
      getPublicGoogleSheet(sheetId, "draft_post")
    ]);

    // Link the "Status" from tab 1 to the "Service name" from tab 2
    const mergedData = infoData.map((infoRow: any) => {
      const draftRow = draftData.find((d: any) => 
        (d.draft_id_for_butt && d.draft_id_for_butt === infoRow.draft_id_info) || 
        (d.draft_id_for_button && d.draft_id_for_button === infoRow.draft_id_info) || 
        (d.draft_id && d.draft_id === infoRow.draft_id_info)
      );
      
      return {
        ...infoRow,
        ...draftRow, 
        ServiceTitle: draftRow?.service || infoRow.Service || infoRow.draft_id_info || "Service non défini"
      };
    });
    
    return NextResponse.json(mergedData);
  } catch (error) {
    console.error("Aggregation Error:", error);
    return NextResponse.json({ error: "Failed to aggregate tabs" }, { status: 500 });
  }
}