import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getConfigValue } from '@/lib/config';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    const token = await getConfigValue('FACEBOOK_ACCESS_TOKEN');
    const pageId = await getConfigValue('FACEBOOK_PAGE_ID');
    const igId = await getConfigValue('INSTAGRAM_ACCOUNT_ID');
    const sheetId = await getConfigValue('GOOGLE_SHEETS_ID');

    // Mask the token for safety so only the first 12 characters are returned
    let maskedToken = '';
    if (token) {
      maskedToken = token.length > 15 ? `${token.substring(0, 12)}...` : token;
    }

    return NextResponse.json({
      token: maskedToken,
      pageId,
      igId,
      sheetId
    });
  } catch (err) {
    console.error("[Credentials API] GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { token, pageId, igId, sheetId } = body;

    const updates = [];

    // Smart override: only update token if the user typed a new raw token (not the masked one ending with "...")
    const isMaskedToken = token && String(token).endsWith('...');
    if (token && !isMaskedToken) {
      updates.push({ key: 'FACEBOOK_ACCESS_TOKEN', value: token });
      updates.push({ key: 'INSTAGRAM_ACCESS_TOKEN', value: token });
    }

    if (pageId !== undefined && pageId !== null) {
      updates.push({ key: 'FACEBOOK_PAGE_ID', value: pageId });
    }
    if (igId !== undefined && igId !== null) {
      updates.push({ key: 'INSTAGRAM_ACCOUNT_ID', value: igId });
    }
    if (sheetId !== undefined && sheetId !== null) {
      updates.push({ key: 'GOOGLE_SHEETS_ID', value: sheetId });
    }

    // 1. Update in Supabase global_configs
    for (const item of updates) {
      const cleanVal = String(item.value).trim();
      const { error } = await supabase
        .from('global_configs')
        .upsert({ key: item.key, value: cleanVal, updated_at: new Date().toISOString() });
      
      if (error) {
        console.error(`[Credentials API] Error saving ${item.key} to Supabase:`, error);
        return NextResponse.json({ error: `Failed to save ${item.key} to database` }, { status: 500 });
      }
    }

    // 2. Local Environment Backup (.env update)
    let localEnvUpdated = false;
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        const keyMap = {};
        if (token && !isMaskedToken) {
          keyMap['FACEBOOK_ACCESS_TOKEN'] = token;
          keyMap['INSTAGRAM_ACCESS_TOKEN'] = token;
        }
        if (pageId !== undefined && pageId !== null) keyMap['FACEBOOK_PAGE_ID'] = pageId;
        if (igId !== undefined && igId !== null) keyMap['INSTAGRAM_ACCOUNT_ID'] = igId;
        if (sheetId !== undefined && sheetId !== null) keyMap['GOOGLE_SHEETS_ID'] = sheetId;
        let envLines = envContent.split(/\r?\n/);
        for (const [key, value] of Object.entries(keyMap)) {
          const cleanVal = String(value).trim();
          let keyFound = false;
          for (let i = 0; i < envLines.length; i++) {
            const line = envLines[i].trim();
            if (line.startsWith(`${key}=`) || line.startsWith(`${key} =`)) {
              envLines[i] = `${key}=${cleanVal}`;
              keyFound = true;
              break;
            }
          }
          if (!keyFound) {
            envLines.push(`${key}=${cleanVal}`);
          }
        }
        envContent = envLines.join('\n');
        
        fs.writeFileSync(envPath, envContent, 'utf8');
        localEnvUpdated = true;
        console.log("[Credentials API] .env backup saved locally!");
      }
    } catch (fsErr) {
      console.warn("[Credentials API] .env file not updated (expected on production/Vercel serverless):", fsErr.message);
    }

    return NextResponse.json({
      success: true,
      message: "Credentials successfully updated in Supabase global configurations!",
      localEnvBackup: localEnvUpdated
    });
  } catch (err) {
    console.error("[Credentials API] Server error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
