"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle, Clock, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const WORKFLOW_STEPS = [
  "Webhook Triggered",
  "Cloudinary: Uploading Logo",
  "Google Sheets: Fetching Pending Content",
  "OpenRouter: Generating AI Copy",
  "Flux AI: Generating Images",
  "hcti.io: Rendering UI Overlays",
  "Cloudinary: Saving Final Composites",
  "Google Sheets: Saving Drafts",
  "Telegram: Sending for Approval",
  "Waiting for Admin Approval ⏳",
  "Instagram & LinkedIn: Publishing Live 🚀",
];

export function LiveWorkflowTracker() {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [status, setStatus] = useState<"idle" | "running" | "waiting_approval" | "finished" | "rejected">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Normalizer to align step number correctly based on final outcome
    const payloadTrackerStep = (step: number, currentStatus: string) => {
      if (currentStatus === "rejected" || currentStatus === "finished") {
        return 11; // show last step as resolved
      }
      return step;
    };

    // 1. Fetch initial state on load
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("n8n_tracker")
        .select("*")
        .eq("id", 1)
        .single();
      
      if (data) {
        setStatus(data.status);
        setActiveStep(payloadTrackerStep(data.current_step, data.status));
      }
    };
    
    fetchStatus();

    // 2. Listen to LIVE updates from n8n via Supabase Realtime
    const channel = supabase
      .channel("n8n_tracker_updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "n8n_tracker", filter: "id=eq.1" },
        (payload) => {
          setStatus(payload.new.status);
          setActiveStep(payloadTrackerStep(payload.new.current_step, payload.new.status));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Action helper to simulate clicking Approve/Refuse
  const handleAction = async (action: "approved" | "rejected") => {
    try {
      setError(null);
      // 1. Fetch latest draft_id from Google Sheet via our /api/posts route
      const postsRes = await fetch("/api/posts");
      const postsData = await postsRes.json();
      
      const latestPost = Array.isArray(postsData) ? postsData.find((p: any) => p.draft_id_info || p.draft_id) : null;
      const draftId = latestPost?.draft_id_info || latestPost?.draft_id;
      
      if (!draftId) {
        throw new Error("Aucun ID de brouillon ('draft_id') actif trouvé dans les données Google Sheets.");
      }

      // 2. Set tracker to running/step 10 optimistically
      await supabase.from("n8n_tracker").update({ status: "running", current_step: 10 }).eq("id", 1);

      // 3. Dispatch the real callback to n8n (VALIDER/REFUSER)
      const actionParam = action === "approved" ? "VALIDER" : "REFUSER";
      const res = await fetch("/api/workflows/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionParam, draftId })
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to trigger callback");
      }
    } catch (err: any) {
      console.error("Failed to trigger simulated Telegram callback:", err);
      setError(err.message || "Une erreur inconnue est survenue.");
      // Rollback status so the approval/refusal buttons reappear
      await supabase.from("n8n_tracker").update({ status: "waiting_approval", current_step: 9 }).eq("id", 1);
      setStatus("waiting_approval");
      setActiveStep(9);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold text-white">Live Execution Pipeline</h4>
        {status === "running" && (
          <span className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Syncing Live
          </span>
        )}
        {status === "waiting_approval" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.05)] animate-pulse">
            <Clock className="h-3 w-3 text-purple-400" /> Action requise sur Telegram 📱
          </span>
        )}
        {status === "finished" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={14} /> Approved & Published ✅
          </span>
        )}
        {status === "rejected" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <X size={14} /> Refused & Discarded ❌
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200 flex flex-col gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <div className="flex items-center gap-2 font-bold text-red-400">
            <X size={14} className="flex-shrink-0" strokeWidth={3} />
            <span>Erreur de déclenchement n8n</span>
          </div>
          <p className="text-gray-300 leading-relaxed font-medium">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-[10px] text-red-400 hover:text-red-300 underline self-start mt-1 transition-all"
          >
            Masquer l'avertissement
          </button>
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {WORKFLOW_STEPS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isCurrent = i === activeStep;

          const isRejectedStep = i === 10 && status === "rejected";
          const stepName = isRejectedStep ? "Rejected by Admin & Discarded ❌" : step;

          let cardBgClass = "bg-white/5 border-white/10";
          let textColorClass = "text-gray-400";
          let iconElement = <Circle className="h-6 w-6 text-gray-600" />;

          if (isRejectedStep) {
            cardBgClass = "bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.08)]";
            textColorClass = "text-red-300 font-bold";
            iconElement = (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                <X size={14} strokeWidth={3} />
              </div>
            );
          } else if (isCompleted) {
            cardBgClass = "bg-emerald-500/5 border-emerald-500/20";
            textColorClass = "text-emerald-200";
            iconElement = (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Check size={14} strokeWidth={3} />
              </div>
            );
          } else if (isCurrent) {
            cardBgClass = "bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]";
            textColorClass = i === 9 ? "text-purple-300" : "text-blue-200";
            iconElement = i === 9 ? (
              <Clock className="h-6 w-6 text-purple-400 animate-pulse" />
            ) : (
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
            );
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.6, x: -5 }}
              animate={{
                opacity: isCurrent ? 1 : isCompleted ? 0.8 : 0.4,
                x: isCurrent ? 5 : 0,
                scale: isCurrent ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${cardBgClass}`}
            >
              <div className="flex-shrink-0">
                {iconElement}
              </div>
              
              <div className="flex-1">
                <p className={`font-semibold text-sm ${textColorClass}`}>
                  {stepName}
                </p>
                {isCurrent && i < 9 && (
                  <p className="text-xs text-blue-400/70 mt-0.5 animate-pulse">Processing via n8n...</p>
                )}
                {isCurrent && i === 9 && (
                  <p className="text-xs text-purple-300/85 mt-1.5 flex items-start gap-2 leading-relaxed bg-purple-500/5 border border-purple-500/10 p-2.5 rounded-lg shadow-sm">
                    <span className="relative flex h-2 w-2 mt-1.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    <span>Veuillez ouvrir votre application <strong>Telegram</strong> et cliquer sur <strong>VALIDER</strong> ou <strong>REFUSER</strong> pour déclencher la publication.</span>
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
