const fs = require("fs");

try {
  let wf;
  try {
    wf = JSON.parse(fs.readFileSync("../final_fixed.json", "utf8"));
  } catch (e) {
    try {
      wf = JSON.parse(fs.readFileSync("../f.json", "utf8"));
    } catch (e2) {
      try {
        wf = JSON.parse(fs.readFileSync("../final.json", "utf8"));
      } catch (e3) {
        wf = JSON.parse(fs.readFileSync("../a1.json", "utf8"));
      }
    }
  }

  // Auto-patch '📖 Read Draft from Sheet' to search by name 'draft_post' (fixing hardcoded gid mismatch!)
  const readDraftNode = wf.nodes.find(n => n.name === "📖 Read Draft from Sheet");
  if (readDraftNode && readDraftNode.parameters) {
    readDraftNode.parameters.sheetName = {
      __rl: true,
      value: "draft_post",
      mode: "name"
    };
    console.log("Automatically patched '📖 Read Draft from Sheet' to search by name 'draft_post'!");
  }

  // Programmatic patch for '⚙️ Parse AI Response'
  const parseAINode = wf.nodes.find(n => n.name === "⚙️ Parse AI Response");
  if (parseAINode && parseAINode.parameters && parseAINode.parameters.jsCode) {
    let code = parseAINode.parameters.jsCode;
    if (!code.includes("row_number")) {
      code = code.replace(
        "// Pull the confirmed logo URL",
        "const rowNumber = sheetData.row_number || sheetData.rowNumber || $('📋 Read First Pending Row').first().json.row_number;\n\n// Pull the confirmed logo URL"
      );
      code = code.replace(
        "logo_url:               logoUrl",
        "logo_url:               logoUrl,\n    row_number:             rowNumber"
      );
      parseAINode.parameters.jsCode = code;
      console.log("Successfully patched '⚙️ Parse AI Response' code!");
    }
  }

  // Programmatic patch for '🔗 Build Cloudinary Composite URLs'
  const buildUrlsNode = wf.nodes.find(n => n.name === "🔗 Build Cloudinary Composite URLs");
  if (buildUrlsNode && buildUrlsNode.parameters && buildUrlsNode.parameters.jsCode) {
    let code = buildUrlsNode.parameters.jsCode;
    if (!code.includes("row_number")) {
      code = code.replace(
        "instagram_image_url_raw: igComposite",
        "instagram_image_url_raw: igComposite,\n    row_number:             draft.row_number"
      );
      buildUrlsNode.parameters.jsCode = code;
      console.log("Successfully patched '🔗 Build Cloudinary Composite URLs' code!");
    }
  }

  // Programmatic patch for '🔖 Stamp draft_id_info to page of informations'
  const stampDraftNode = wf.nodes.find(n => n.name === "🔖 Stamp draft_id_info to page of informations");
  if (stampDraftNode && stampDraftNode.parameters && stampDraftNode.parameters.columns) {
    stampDraftNode.parameters.columns.value.row_number = "={{ $json.row_number }}";
    console.log("Successfully patched '🔖 Stamp draft_id_info to page of informations' mapping!");
  }

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

  const nodesToExclude = new Set([
    "If Action is Publish to Sheet",
    "Append to page of informations",
    "If Action is Update Row",
    "Update Row in page of informations",
    "Send Published Notification",
    "Send Refused Notification",
    "Error Trigger",
    "Send Error Notification"
  ]);

  // Filter out existing Tracker steps and any duplicate or old HTTP Request nodes, as well as generated nodes
  wf.nodes = wf.nodes.filter(
    (n) =>
      !n.name.startsWith("Tracker_Step_") &&
      !/^HTTP Request\d*$/.test(n.name) &&
      !nodesToExclude.has(n.name)
  );

  // Also clean up all connections referencing those removed nodes
  for (const key of Object.keys(wf.connections)) {
    if (key.startsWith("Tracker_Step_") || /^HTTP Request\d*$/.test(key) || nodesToExclude.has(key)) {
      delete wf.connections[key];
    } else {
      const nodeConn = wf.connections[key];
      if (nodeConn && nodeConn.main) {
        nodeConn.main = nodeConn.main.map(branch => 
          branch.filter(conn => 
            !conn.node.startsWith("Tracker_Step_") && 
            !/^HTTP Request\d*$/.test(conn.node) &&
            !nodesToExclude.has(conn.node)
          )
        );
      }
    }
  }

  // Helper to inject node a -> tracker in parallel with a -> b
  const injectNode = (sourceNode, targetNode, step, status = "running") => {
    const nodeName = `Tracker_Step_${step}`;
    const tNode = createTrackerNode(nodeName, step, status);
    wf.nodes.push(tNode);

    if (sourceNode) {
      wf.connections[sourceNode] = wf.connections[sourceNode] || {};
      wf.connections[sourceNode].main = wf.connections[sourceNode].main || [[]];
      
      const existingBranch = wf.connections[sourceNode].main[0] || [];
      
      // Add Tracker node to this branch in parallel
      existingBranch.push({ node: nodeName, type: "main", index: 0 });
      
      // Ensure targetNode is also in the branch
      if (targetNode && !existingBranch.some(c => c.node === targetNode)) {
        existingBranch.push({ node: targetNode, type: "main", index: 0 });
      }
      
      wf.connections[sourceNode].main[0] = existingBranch;
    }
    return tNode;
  };

  // Step 1: Webhook/Schedule -> Tracker_Step_1 -> Ensure Logo
  const t1 = createTrackerNode("Tracker_Step_1", 1);
  wf.nodes.push(t1);

  // If action is publish_to_sheet, append directly to Google Sheet and do NOT run the workflow!
  const ifNode = {
    parameters: {
      conditions: {
        conditions: [
          {
            leftValue: "={{ $json.body?.action || $json.action }}",
            rightValue: "publish_to_sheet",
            operator: {
              type: "string",
              operation: "equals"
            }
          }
        ],
        combinator: "and",
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "strict",
          version: 1
        }
      },
      options: {}
    },
    id: require("crypto").randomUUID(),
    name: "If Action is Publish to Sheet",
    type: "n8n-nodes-base.if",
    typeVersion: 2,
    position: [2600, 4600]
  };

  const appendSheetNode = {
    parameters: {
      operation: "append",
      documentId: {
        __rl: true,
        value: "1z9Awe0lwCFK57jKnm3Gqrkjf26XrsTjCXIOoW94b4Mo",
        mode: "list",
        cachedResultName: "iska_tech_Data",
        cachedResultUrl: "https://docs.google.com/spreadsheets/d/1z9Awe0lwCFK57jKnm3Gqrkjf26XrsTjCXIOoW94b4Mo/edit?usp=drivesdk"
      },
      sheetName: {
        __rl: true,
        value: "gid=0",
        mode: "list",
        cachedResultName: "page of informations",
        cachedResultUrl: "https://docs.google.com/spreadsheets/d/1z9Awe0lwCFK57jKnm3Gqrkjf26XrsTjCXIOoW94b4Mo/edit#gid=0"
      },
      columns: {
        mappingMode: "defineBelow",
        value: {
          row_number: "={{ $json.body?.row_number || $json.row_number }}",
          Service: "={{ $json.body?.Service || $json.Service }}",
          Description: "={{ $json.body?.Description || $json.Description }}",
          Hashtags: "={{ $json.body?.Hashtags || $json.Hashtags }}",
          Status: "={{ $json.body?.Status || $json.Status }}",
          PublishedAt: "={{ $json.body?.PublishedAt || $json.PublishedAt }}",
          draft_id_info: "={{ $json.body?.draft_id_info || $json.draft_id_info }}"
        },
        matchingColumns: [],
        schema: [],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      },
      options: {}
    },
    id: require("crypto").randomUUID(),
    name: "Append to page of informations",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [2850, 4800],
    credentials: {
      googleSheetsOAuth2Api: {
        id: "RODIpd8BnaijLWz5",
        name: "Google Sheets OAuth2 API"
      }
    }
  };

  // If action is update_row, update Google Sheet row directly and do NOT run the workflow!
  const ifUpdateNode = {
    parameters: {
      conditions: {
        conditions: [
          {
            leftValue: "={{ $json.body?.action || $json.action }}",
            rightValue: "update_row",
            operator: {
              type: "string",
              operation: "equals"
            }
          }
        ],
        combinator: "and",
        options: {
          caseSensitive: true,
          leftValue: "",
          typeValidation: "strict",
          version: 1
        }
      },
      options: {}
    },
    id: require("crypto").randomUUID(),
    name: "If Action is Update Row",
    type: "n8n-nodes-base.if",
    typeVersion: 2,
    position: [2600, 4300]
  };

  const updateSheetNode = {
    parameters: {
      operation: "update",
      documentId: {
        __rl: true,
        value: "1z9Awe0lwCFK57jKnm3Gqrkjf26XrsTjCXIOoW94b4Mo",
        mode: "list",
        cachedResultName: "iska_tech_Data",
        cachedResultUrl: "https://docs.google.com/spreadsheets/d/1z9Awe0lwCFK57jKnm3Gqrkjf26XrsTjCXIOoW94b4Mo/edit?usp=drivesdk"
      },
      sheetName: {
        __rl: true,
        value: "gid=0",
        mode: "list",
        cachedResultName: "page of informations",
        cachedResultUrl: "https://docs.google.com/spreadsheets/d/1z9Awe0lwCFK57jKnm3Gqrkjf26XrsTjCXIOoW94b4Mo/edit#gid=0"
      },
      columns: {
        mappingMode: "defineBelow",
        value: {
          Status: "={{ $json.body?.Status || $json.Status }}",
          PublishedAt: "={{ $json.body?.PublishedAt || $json.PublishedAt }}",
          draft_id_info: "={{ $json.body?.draft_id_info || $json.draft_id_info }}",
          row_number: "={{ $json.body?.row_number || $json.row_number }}"
        },
        matchingColumns: ["row_number"],
        schema: [
          {
            id: "Status",
            displayName: "Status",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
            removed: false
          },
          {
            id: "PublishedAt",
            displayName: "PublishedAt",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
            removed: false
          },
          {
            id: "draft_id_info",
            displayName: "draft_id_info",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
            removed: false
          },
          {
            id: "row_number",
            displayName: "row_number",
            required: false,
            defaultMatch: false,
            display: true,
            type: "string",
            canBeUsedToMatch: true,
            removed: false
          }
        ],
        attemptToConvertTypes: false,
        convertFieldsToString: true
      },
      options: {}
    },
    id: require("crypto").randomUUID(),
    name: "Update Row in page of informations",
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: [2850, 4200],
    credentials: {
      googleSheetsOAuth2Api: {
        id: "RODIpd8BnaijLWz5",
        name: "Google Sheets OAuth2 API"
      }
    }
  };

  wf.nodes.push(ifNode);
  wf.nodes.push(appendSheetNode);
  wf.nodes.push(ifUpdateNode);
  wf.nodes.push(updateSheetNode);

  // Webhook connects to our first If node
  wf.connections["Webhook"] = {
    main: [
      [
        {
          node: ifNode.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // If Action is Publish to Sheet branches:
  // Output 0 (true) -> Append directly to sheet
  // Output 1 (false) -> Check if Action is Update Row
  wf.connections[ifNode.name] = {
    main: [
      [
        {
          node: appendSheetNode.name,
          type: "main",
          index: 0
        }
      ],
      [
        {
          node: ifUpdateNode.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // If Action is Update Row branches:
  // Output 0 (true) -> Update row in sheet
  // Output 1 (false) -> Trigger both Ensure Logo in Cloudinary and Tracker_Step_1 in parallel
  wf.connections[ifUpdateNode.name] = {
    main: [
      [
        {
          node: updateSheetNode.name,
          type: "main",
          index: 0
        }
      ],
      [
        {
          node: "☁️ Ensure Logo in Cloudinary",
          type: "main",
          index: 0
        },
        {
          node: t1.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Schedule trigger connects to both Ensure Logo in Cloudinary and Tracker_Step_1 in parallel
  wf.connections["⏰ Schedule - Mon/Wed/Fri 9am"] = {
    main: [
      [
        {
          node: "☁️ Ensure Logo in Cloudinary",
          type: "main",
          index: 0
        },
        {
          node: t1.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Step 2: Extract Logo URL -> Read First Pending Row
  injectNode("⚙️ Extract Logo URL", "📋 Read First Pending Row", 2);

  // Step 3: Is Row Pending? (true) -> OpenRouter (with Tracker_Step_3 running in parallel).
  const t3 = createTrackerNode("Tracker_Step_3", 3);
  wf.nodes.push(t3);
  wf.connections["🔍 Is Row Pending?"].main = [
    [
      {
        node: "🤖 OpenRouter - Generate Posts + Image Prompts",
        type: "main",
        index: 0
      },
      {
        node: t3.name,
        type: "main",
        index: 0
      }
    ]
  ];

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

  // New Notification Nodes
  const notifPublishedNode = {
    parameters: {
      method: "POST",
      url: "https://wjedjuueiuxoejhvkhfq.supabase.co/rest/v1/notifications",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "apikey", value: SUPABASE_KEY },
          { name: "Authorization", value: "Bearer " + SUPABASE_KEY },
          { name: "Content-Type", value: "application/json" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: JSON.stringify({
        user_id: 1,
        title: "Publication Publiée ✅",
        body: "Le service a été validé et publié avec succès sur Google Sheet !",
        type: "workflow_executed",
        channel: "internal",
        is_read: false,
      }),
      options: {},
    },
    id: require("crypto").randomUUID(),
    name: "Send Published Notification",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [17300, 5800],
  };

  const notifRefusedNode = {
    parameters: {
      method: "POST",
      url: "https://wjedjuueiuxoejhvkhfq.supabase.co/rest/v1/notifications",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "apikey", value: SUPABASE_KEY },
          { name: "Authorization", value: "Bearer " + SUPABASE_KEY },
          { name: "Content-Type", value: "application/json" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: JSON.stringify({
        user_id: 1,
        title: "Publication Refusée ❌",
        body: "Le service a été refusé par l'administrateur.",
        type: "workflow_executed",
        channel: "internal",
        is_read: false,
      }),
      options: {},
    },
    id: require("crypto").randomUUID(),
    name: "Send Refused Notification",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [17300, 6300],
  };

  const errorTriggerNode = {
    parameters: {},
    id: require("crypto").randomUUID(),
    name: "Error Trigger",
    type: "n8n-nodes-base.errorTrigger",
    typeVersion: 1,
    position: [16800, 5200],
  };

  const errorNotifNode = {
    parameters: {
      method: "POST",
      url: "https://wjedjuueiuxoejhvkhfq.supabase.co/rest/v1/notifications",
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: "apikey", value: SUPABASE_KEY },
          { name: "Authorization", value: "Bearer " + SUPABASE_KEY },
          { name: "Content-Type", value: "application/json" },
        ],
      },
      sendBody: true,
      specifyBody: "json",
      jsonBody: JSON.stringify({
        user_id: 1,
        title: "Erreur de Workflow ⚠️",
        body: "Le workflow n8n s'est arrêté suite à une erreur : {{ $json.execution.error.message }}",
        type: "workflow_executed",
        channel: "internal",
        is_read: false,
      }),
      options: {},
    },
    id: require("crypto").randomUUID(),
    name: "Send Error Notification",
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4.2,
    position: [17100, 5200],
  };

  wf.nodes.push(notifPublishedNode);
  wf.nodes.push(notifRefusedNode);
  wf.nodes.push(errorTriggerNode);
  wf.nodes.push(errorNotifNode);

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

  // Connection from endNode -> Send Published Notification
  wf.connections[endNode.name] = {
    main: [
      [
        {
          node: notifPublishedNode.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Also handle rejection end: ❌ Update Sheet - Refused -> Done
  const rejectNode = createTrackerNode("Tracker_Step_Rejected", 11, "rejected");
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

  // Connection from rejectNode -> Send Refused Notification
  wf.connections[rejectNode.name] = {
    main: [
      [
        {
          node: notifRefusedNode.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  // Connection from Error Trigger -> Send Error Notification
  wf.connections["Error Trigger"] = {
    main: [
      [
        {
          node: errorNotifNode.name,
          type: "main",
          index: 0
        }
      ]
    ]
  };

  fs.writeFileSync("../final_fixed.json", JSON.stringify(wf, null, 2));
  console.log("Fixed JSON exported to final_fixed.json!");
} catch (error) {
  console.error(error);
}
