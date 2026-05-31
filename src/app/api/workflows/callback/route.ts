import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { action, draftId } = await req.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ 
        success: false, 
        error: "N8N_WEBHOOK_URL non configuré dans .env. Veuillez configurer cette variable." 
      }, { status: 500 });
    }

    // N8N_WEBHOOK_URL is e.g. "https://zaidiksa.app.n8n.cloud/webhook/0dc5a936-b740-472e-ac76-980ebad41bbf"
    // We want to replace the UUID path with "tg-trigger-callback" to target the Telegram Trigger
    const baseWebhookUrl = webhookUrl.substring(0, webhookUrl.lastIndexOf("/") + 1);
    const callbackTriggerUrl = `${baseWebhookUrl}tg-trigger-callback`;

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

    // Calculate fallback webhook URLs to handle active/inactive workflow states
    const attemptedUrls: string[] = [callbackTriggerUrl];
    let fallbackTriggerUrl = "";
    
    if (callbackTriggerUrl.includes("/webhook/")) {
      fallbackTriggerUrl = callbackTriggerUrl.replace("/webhook/", "/webhook-test/");
    } else if (callbackTriggerUrl.includes("/webhook-test/")) {
      fallbackTriggerUrl = callbackTriggerUrl.replace("/webhook-test/", "/webhook/");
    }

    if (fallbackTriggerUrl && fallbackTriggerUrl !== callbackTriggerUrl) {
      attemptedUrls.push(fallbackTriggerUrl);
    }

    let success = false;
    let finalStatus = 0;
    let finalError = "";
    let successfullyUsedUrl = "";

    for (const url of attemptedUrls) {
      try {
        console.log(`[Workflow Callback API] Triggering n8n callback for action: ${action}, draftId: ${draftId} via URL: ${url}`);
        
        const n8nRes = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(telegramPayload),
          signal: AbortSignal.timeout(10000),
        });

        if (n8nRes.ok) {
          success = true;
          successfullyUsedUrl = url;
          console.log(`[Workflow Callback API] n8n callback succeeded with URL: ${url}`);
          break;
        } else {
          finalStatus = n8nRes.status;
          console.warn(`[Workflow Callback API] n8n responded with status: ${n8nRes.status} for URL: ${url}`);
        }
      } catch (err: any) {
        console.error(`[Workflow Callback API] Failed to trigger URL: ${url} - Error:`, err);
        finalError = err.message || String(err);
      }
    }

    if (!success) {
      const errorMsg = `Le webhook n8n a retourné une erreur (Dernier statut: ${finalStatus || "Erreur réseau"}). ` +
        `Assurez-vous que votre workflow n8n a bien un déclencheur Telegram (avec le chemin 'tg-trigger-callback') et qu'il est en cours d'exécution. ` +
        `URLs essayées: ${attemptedUrls.join(" et ")}. ` +
        (finalError ? `Détails techniques: ${finalError}` : "");

      return NextResponse.json({ 
        success: false, 
        error: errorMsg 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Simulation de callback Telegram envoyée à n8n avec succès via ${successfullyUsedUrl.includes("/webhook-test/") ? "le mode Test" : "le mode Production"} !` 
    });
  } catch (error: any) {
    console.error("[Workflow Callback API] Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Échec de déclenchement du callback" 
    }, { status: 500 });
  }
}
