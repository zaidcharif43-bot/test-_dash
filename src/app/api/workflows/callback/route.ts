import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, draftId } = await req.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ error: "N8N_WEBHOOK_URL non configuré dans .env" }, { status: 500 });
    }

    // N8N_WEBHOOK_URL is e.g. "https://zaidiksa.app.n8n.cloud/webhook/0dc5a936-b740-472e-ac76-980ebad41bbf"
    // We want to replace the UUID path with "tg-trigger-callback" to target the Telegram Trigger
    const baseWebhookUrl = webhookUrl.substring(0, webhookUrl.lastIndexOf("/") + 1);
    const callbackTriggerUrl = `${baseWebhookUrl}tg-trigger-callback`;

    console.log(`[Workflow Callback API] Triggering n8n callback for action: ${action}, draftId: ${draftId} via URL: ${callbackTriggerUrl}`);

    // Build the simulated Telegram Update payload
    const telegramPayload = {
      callback_query: {
        id: `sim_${Date.now()}`,
        data: `${action}:${draftId}`,
        message: {
          chat: {
            id: "5409067563"
          }
        }
      }
    };

    const n8nRes = await fetch(callbackTriggerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(telegramPayload),
      signal: AbortSignal.timeout(10000),
    });

    if (!n8nRes.ok) {
      console.warn(`[Workflow Callback API] n8n responded with status: ${n8nRes.status}`);
      return NextResponse.json({ success: false, error: `n8n callback trigger failed with status: ${n8nRes.status}` }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Simulation de callback Telegram envoyée à n8n avec succès !" 
    });
  } catch (error: any) {
    console.error("[Workflow Callback API] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Échec de déclenchement du callback" 
    }, { status: 500 });
  }
}
