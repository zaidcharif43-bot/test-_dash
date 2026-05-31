import { NextRequest, NextResponse } from "next/server";
import { getConfigValue } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, message, platform, token, pageId } = body;

    if (!commentId || !message || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: commentId, message, and platform are mandatory." },
        { status: 400 }
      );
    }
    let FB_TOKEN = token;
    if (!FB_TOKEN || FB_TOKEN.endsWith("...") || FB_TOKEN === "undefined") {
      FB_TOKEN = await getConfigValue("FACEBOOK_ACCESS_TOKEN");
    }

    let FB_PAGE_ID = pageId;
    if (!FB_PAGE_ID || FB_PAGE_ID === "undefined") {
      FB_PAGE_ID = await getConfigValue("FACEBOOK_PAGE_ID");
    }

    // If no token is provided or configured, simulate a successful reply locally (demonstration sandbox)
    if (!FB_TOKEN || FB_TOKEN.startsWith("EAAS_MOCK") || FB_TOKEN.length < 20) {
      console.log(`[Meta Comments API] Simulated reply to ${platform} comment ${commentId}: "${message}"`);
      return NextResponse.json({
        success: true,
        isSimulated: true,
        id: `sim_reply_${Math.random().toString(36).substring(2, 11)}`,
        message: "Réponse simulée avec succès (absence de jeton Meta valide)",
      });
    }

    let activeToken = FB_TOKEN;

    // Dynamically resolve User Access Token -> Page Access Token for Page/Instagram posting authorization
    if (FB_PAGE_ID) {
      try {
        const accountsRes = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?access_token=${FB_TOKEN}`,
          { signal: AbortSignal.timeout(5000) }
        );
        const accountsData = await accountsRes.json();
        if (accountsData?.data && Array.isArray(accountsData.data)) {
          const targetPage = accountsData.data.find(
            (p: any) => String(p.id) === String(FB_PAGE_ID)
          );
          if (targetPage?.access_token) {
            console.log("[Meta Comments API] Resolved Page Access Token for Page ID:", FB_PAGE_ID);
            activeToken = targetPage.access_token;
          }
        }
      } catch (e) {
        console.warn("[Meta Comments API] Could not dynamically resolve Page Access Token, using provided:", e);
      }
    }

    // Determine target Meta Graph API endpoint based on platform
    let url = "";
    if (platform === "Facebook") {
      // Facebook Graph comment replies endpoint: POST /{comment-id}/comments
      url = `https://graph.facebook.com/v19.0/${commentId}/comments`;
    } else {
      // Instagram Graph comment replies endpoint: POST /{comment-id}/replies
      url = `https://graph.facebook.com/v19.0/${commentId}/replies`;
    }

    console.log(`[Meta Comments API] Posting to Graph URL: ${url} (Platform: ${platform})`);

    // Build final URL with query params to satisfy Instagram and Facebook requirements
    const queryParams = new URLSearchParams();
    queryParams.append("message", message);
    queryParams.append("access_token", activeToken);
    
    const finalUrl = `${url}?${queryParams.toString()}`;

    const metaRes = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        access_token: activeToken,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const metaData = await metaRes.json();

    if (metaData && !metaData.error) {
      return NextResponse.json({
        success: true,
        isSimulated: false,
        id: metaData.id,
        raw: metaData,
      });
    } else {
      console.warn("[Meta Comments API] Graph API returned error:", metaData.error);
      return NextResponse.json({
        success: false,
        error: metaData.error?.message || "Erreur Meta Graph API",
        raw: metaData,
      });
    }
  } catch (error: any) {
    console.error("[Meta Comments API] Error in reply handler:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Unknown internal error",
    });
  }
}
