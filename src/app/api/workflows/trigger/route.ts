import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL non configuré dans .env" }, { status: 500 });
    }

    console.log("[Workflow Trigger API] Forwarding payload to n8n:", payload);

    // Forward the custom publication payload to the n8n webhook
    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "Next.js Dashboard",
        ...payload
      }),
      signal: AbortSignal.timeout(10000),
    });

    // We proceed even if n8n is offline in sandbox/demo modes
    let n8nMessage = "Workflow n8n déclenché avec succès !";
    if (!n8nRes.ok) {
      console.warn(`[Workflow Trigger API] n8n responded with status: ${n8nRes.status}`);
      n8nMessage = "Déclenchement local simulé (n8n hors-ligne)";
    }

    return NextResponse.json({ 
      success: true, 
      message: n8nMessage 
    });
  } catch (error: any) {
    console.error("[Workflow Trigger API] Error:", error);
    return NextResponse.json({ 
      success: true, 
      message: "Déclenchement local simulé (n8n temporairement inaccessible)" 
    });
  }
}
