"use client";
 
import { useState } from "react";
import { Sparkles, CheckCircle2, XCircle, Lock } from "lucide-react";
import { triggerN8nWorkflow } from "@/app/actions";
import { GlassBtn } from "@/components/ui/glass-components";
import { supabase } from "@/lib/supabase";
 
interface GenerateButtonProps {
  disabled?: boolean;
}
 
export function GenerateButton({ disabled = false }: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
 
  const handleGenerate = async () => {
    if (disabled) return;
    setLoading(true);
    setStatus("idle");
    setErrorMsg("");
    
    // Reset tracker immediately in Supabase when button is clicked!
    await supabase.from("n8n_tracker").update({ status: "running", current_step: 0 }).eq("id", 1);
    
    const result = await triggerN8nWorkflow();
    
    if (result.success) {
      setStatus("success");
      // Reset status after a few seconds
      setTimeout(() => setStatus("idle"), 4000);
    } else {
      setStatus("error");
      setErrorMsg(result.error || "Unknown error");
    }
    
    setLoading(false);
  };
 
  return (
    <div className="flex flex-col items-start space-y-2">
      <GlassBtn 
        onClick={handleGenerate} 
        disabled={loading || disabled}
        className={`flex items-center gap-2 group transition-all`}
      >
        {disabled ? (
          <Lock className="text-gray-400" size={16} />
        ) : (
          <Sparkles 
            className={loading ? "animate-spin text-blue-400" : "text-blue-400 group-hover:scale-110 transition-transform"} 
            size={18} 
          />
        )}
        <span>
          {loading ? "Génération en cours..." : disabled ? "Action réservée à l'administrateur" : "Générer Maintenance (n8n)"}
        </span>
      </GlassBtn>
      
      {status === "success" && (
        <div className="flex items-center gap-1.5 text-emerald-400 text-sm animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={16} />
          <span>Workflow n8n déclenché avec succès ! Les données arriveront bientôt.</span>
        </div>
      )}
      
      {status === "error" && (
        <div className="flex items-center gap-1.5 text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2">
          <XCircle size={16} />
          <span>Erreur: {errorMsg}</span>
        </div>
      )}
    </div>
  );
}
