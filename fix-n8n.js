const fs = require("fs");

try {
  const wf = JSON.parse(fs.readFileSync("../final.json", "utf8"));

  const SUPABASE_URL =
    "https://wjedjuueiuxoejhvkhfq.supabase.co/rest/v1/n8n_tracker?id=eq.1";
  const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZWRqdXVlaXV4b2VqaHZraGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjc5NTMsImV4cCI6MjA5NDcwMzk1M30.oFcq6-bbBlhTvacXxTZXzffWvbzFlXx-NsTEV3wd7I4";

  const createTrackerNode = (name, step, status = "running") => {
    return {
      parameters: {
        method: "PATCH",
        url: SUPABASE_URL,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: "apikey", value: SUPABASE_KEY },
            { name: "Authorization", value: "Bearer " + SUPABASE_KEY },
            { name: "Content-Type", value: "application/json" },
            { name: "Prefer", value: "return=representation" },
          ],
        },
        sendBody: true,
        specifyBody: "json",
        jsonBody: JSON.stringify({ current_step: step, status }),
        options: {},
      },
      id: require("crypto").randomUUID(),
      name: name,
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [0, 0], // Will auto layout in n8n
    };
  };

  // Filter out existing HTTP Requests that might have been manually added but disconnected
  wf.nodes = wf.nodes.filter(
    (n) =>
      !n.name.startsWith("Tracker_Step_") &&
      n.name !== "HTTP Request" &&
      n.name !== "HTTP Request1",
  );
  // Remove old connections to them
  delete wf.connections["HTTP Request"];
  delete wf.connections["HTTP Request1"];

  // Helper to inject node a -> tracker -> b
  const injectNode = (sourceNode, targetNode, step, status = "running") => {
    const nodeName = `Tracker_Step_${step}`;
    const tNode = createTrackerNode(nodeName, step, status);
    wf.nodes.push(tNode);

    // Change Source -> Target to Source -> Tracker
    if (sourceNode) {
      wf.connections[sourceNode] = wf.connections[sourceNode] || {};
      wf.connections[sourceNode].main = [
        [{ node: nodeName, type: "main", index: 0 }],
      ];
    }

    // Change Tracker -> Target
    if (targetNode) {
      wf.connections[nodeName] = {
        main: [[{ node: targetNode, type: "main", index: 0 }]],
      };
    }
    return tNode;
  };

  // Step 1: Webhook/Schedule -> Tracker_Step_1 -> Ensure Logo
  const t1 = createTrackerNode("Tracker_Step_1", 1);
  wf.nodes.push(t1);
  wf.connections["Webhook"].main = [
    [{ node: t1.name, type: "main", index: 0 }],
  ];
  wf.connections["⏰ Schedule - Mon/Wed/Fri 9am"].main = [
    [{ node: t1.name, type: "main", index: 0 }],
  ];
  wf.connections[t1.name] = {
    main: [[{ node: "☁️ Ensure Logo in Cloudinary", type: "main", index: 0 }]],
  };

  // Step 2: Extract Logo URL -> Read First Pending Row
  injectNode("⚙️ Extract Logo URL", "📋 Read First Pending Row", 2);

  // Step 3: Is Row Pending? (true) -> OpenRouter.
  const t3 = createTrackerNode("Tracker_Step_3", 3);
  wf.nodes.push(t3);
  wf.connections["🔍 Is Row Pending?"].main = [
    [{ node: t3.name, type: "main", index: 0 }],
  ];
  wf.connections[t3.name] = {
    main: [
      [
        {
          node: "🤖 OpenRouter - Generate Posts + Image Prompts",
          type: "main",
          index: 0,
        },
      ],
    ],
  };

  // Step 4: Parse AI Response -> Flux LinkedIn Image
  injectNode("⚙️ Parse AI Response", "🖼️ Flux - LinkedIn Image", 4);

  // Step 5: Upload Instagram Image -> Build HTML Overlay
  injectNode(
    "☁️ Upload Instagram Image (Cloudinary)",
    "⚙️ Build HTML Overlay",
    5,
  );

  // Step 6: hcti.io - Render LinkedIn Composite -> Upload LinkedIn Composite
  injectNode(
    "🖼️ hcti.io - Render LinkedIn Composite",
    "☁️ Upload LinkedIn Composite (Cloudinary)",
    6,
  );

  // Step 7: Build Cloudinary Composite URLs -> Save Draft to Sheet
  injectNode("🔗 Build Cloudinary Composite URLs", "💾 Save Draft to Sheet", 7);

  // Step 8: Stamp draft_id_info -> Wait for Image
  injectNode(
    "🔖 Stamp draft_id_info to page of informations",
    "⏳ Wait for Image",
    8,
  );

  // Step 9: Send to Telegram -> END (status: waiting_approval)
  const stopNode = createTrackerNode("Tracker_Step_9", 9, "waiting_approval");
  wf.nodes.push(stopNode);
  wf.connections["📱 Send to Telegram"] = {
    main: [[{ node: stopNode.name, type: "main", index: 0 }]],
  };

  // Step 10: Telegram ACK Approved -> Fix & Validate Image URL
  injectNode("✅ Telegram ACK Approved", "🔧 Fix & Validate Image URL", 10);

  // Step 11: After Update Sheet - Published -> finished
  const endNode = createTrackerNode("Tracker_Step_11_Finished", 11, "finished");
  wf.nodes.push(endNode);
  wf.connections["✅ Update Sheet - Published"] = {
    main: [
      [
        {
          node: "✅ Update page of informations - Published",
          type: "main",
          index: 0,
        },
        { node: endNode.name, type: "main", index: 0 },
      ],
    ],
  };

  // Also handle rejection end: ❌ Update Sheet - Refused -> Done
  const rejectNode = createTrackerNode("Tracker_Step_Rejected", 11, "finished");
  wf.nodes.push(rejectNode);
  wf.connections["❌ Update Sheet - Refused"] = {
    main: [
      [
        {
          node: "❌ Update page of informations - Refused",
          type: "main",
          index: 0,
        },
        { node: rejectNode.name, type: "main", index: 0 },
      ],
    ],
  };

  fs.writeFileSync("../final_fixed.json", JSON.stringify(wf, null, 2));
  console.log("Fixed JSON exported to final_fixed.json!");
} catch (error) {
  console.error(error);
}
