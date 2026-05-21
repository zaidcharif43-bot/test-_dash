"use server";

export async function triggerN8nWorkflow() {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!n8nWebhookUrl) {
    return { success: false, error: "N8N_WEBHOOK_URL is not defined in .env" };
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // You can send specific parameters to n8n here if needed
      body: JSON.stringify({ source: "Next.js Dashboard", action: "trigger_generation" }),
    });

    if (!response.ok) {
      throw new Error(`n8n responded with status: ${response.status}`);
    }

    return { success: true, message: "Workflow triggered successfully!" };
  } catch (error: any) {
    console.error("Error triggering n8n:", error);
    return { success: false, error: error.message || "Failed to trigger workflow" };
  }
}
