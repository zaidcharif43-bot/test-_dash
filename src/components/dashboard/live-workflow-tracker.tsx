"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Circle, Clock, Check } from "lucide-react";
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
  const [status, setStatus] = useState<"idle" | "running" | "waiting_approval" | "finished">("idle");

  useEffect(() => {
    // 1. Fetch initial state on load
    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from("n8n_tracker")
        .select("*")
        .eq("id", 1)
        .single();
      
      if (data) {
        setStatus(data.status);
        setActiveStep(data.current_step);
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
          setActiveStep(payload.new.current_step);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Secret way to simulate clicking 'Approve' to finish the pipeline
  const simulateApproval = async () => {
    await supabase.from("n8n_tracker").update({ status: "running", current_step: 10 }).eq("id", 1);
    setTimeout(async () => {
      await supabase.from("n8n_tracker").update({ status: "finished", current_step: 11 }).eq("id", 1);
    }, 4000);
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
          <button 
            onClick={simulateApproval}
            className="text-xs font-semibold text-white bg-purple-500/40 hover:bg-purple-500/60 px-3 py-1.5 rounded-full transition-colors border border-purple-500/50"
          >
            Simulate Telegram Approval
          </button>
        )}
        {status === "finished" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 size={14} /> Workflow Complete
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {WORKFLOW_STEPS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isCurrent = i === activeStep;
          const isPending = i > activeStep;

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
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isCurrent
                  ? "bg-blue-500/20 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : isCompleted
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check size={14} strokeWidth={3} />
                  </div>
                ) : isCurrent ? (
                  i === 9 ? (
                    <Clock className="h-6 w-6 text-purple-400 animate-pulse" />
                  ) : (
                    <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                  )
                ) : (
                  <Circle className="h-6 w-6 text-gray-600" />
                )}
              </div>
              
              <div className="flex-1">
                <p
                  className={`font-semibold text-sm ${
                    isCurrent
                      ? i === 9 ? "text-purple-300" : "text-blue-200"
                      : isCompleted
                      ? "text-emerald-200"
                      : "text-gray-400"
                  }`}
                >
                  {step}
                </p>
                {isCurrent && i < 9 && (
                  <p className="text-xs text-blue-400/70 mt-0.5 animate-pulse">Processing via n8n...</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
