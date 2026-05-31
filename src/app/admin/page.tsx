"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GenerateButton } from "@/components/dashboard/generate-button";
import { LiveWorkflowTracker } from "@/components/dashboard/live-workflow-tracker";
import { GlassCard, GlassBtn } from "@/components/ui/glass-components";
import { PageTransition } from "@/components/dashboard/page-transition";
import ParticleBG from "@/components/ui/particle-bg";
import { 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ShieldAlert, 
  LogOut, 
  ArrowRight 
} from "lucide-react";
import { LoginScreen, type LoggedInUser } from "@/components/dashboard/login-screen";
import Link from "next/link";
import clsx from "clsx";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState("Français");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Sync theme and auth state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("dashboard-theme") as "light" | "dark";
      if (savedTheme) setTheme(savedTheme);

      const savedLanguage = localStorage.getItem("dashboard-language") || "Français";
      setLanguage(savedLanguage);

      const savedAuth = localStorage.getItem("dashboard-auth-user");
      if (savedAuth) {
        try {
          setCurrentUser(JSON.parse(savedAuth));
        } catch (e) {
          console.error("Auth Parsing Error:", e);
        }
      }
      setIsLoadingAuth(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dashboard-auth-user");
    document.cookie = "dashboard-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setCurrentUser(null);
  };

  // Auth loading state fallback
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#030914] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D4A017] border-t-transparent" />
      </div>
    );
  }

  // Not logged in -> Show LoginScreen
  if (!currentUser) {
    return (
      <LoginScreen
        theme={theme}
        onLoginSuccess={(user) => setCurrentUser(user)}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // Logged in but NOT Admin -> Show beautiful Access Denied overlay
  if (currentUser.role !== "admin") {
    return (
      <div className={clsx(
        "relative flex min-h-screen flex-col items-center justify-center p-4 transition-all duration-500",
        theme === "dark" ? "bg-[#030914] text-white" : "bg-slate-50 text-slate-900"
      )}>
        <ParticleBG />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-lg"
        >
          <GlassCard className="border-red-500/20 text-center p-8 bg-gradient-to-b from-red-500/5 to-slate-950/20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-6 border border-red-500/20 animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              {language === "العربية" ? "تم رفض الوصول" : "Accès Refusé"}
            </h1>
            <p className={clsx(
              "text-sm mb-6",
              theme === "dark" ? "text-gray-300" : "text-slate-600"
            )}>
              {language === "العربية" 
                ? "عذرًا، يلزم وجود صلاحيات مسؤول (Admin) للوصول إلى لوحة تحكم سير العمل هذه." 
                : language === "English"
                ? "Sorry, Admin permissions are required to access this n8n automation control center."
                : "Désolé, les permissions Administrateur sont requises pour accéder à ce centre de contrôle n8n."
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <GlassBtn variant="primary" className="w-full flex items-center justify-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{language === "العربية" ? "العودة للرئيسية" : "Retour au Dashboard"}</span>
                </GlassBtn>
              </Link>
              <GlassBtn 
                variant="subtle" 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{language === "العربية" ? "تبديل الحساب" : "Changer de compte"}</span>
              </GlassBtn>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // Render Admin controls for validated Admin role
  return (
    <PageTransition moduleKey="admin">
      <div className={clsx(
        "min-h-screen space-y-8 p-6 relative transition-colors duration-500",
        theme === "dark" ? "bg-[#030914] text-white" : "bg-slate-50 text-slate-900"
      )}>
        <ParticleBG />

        {/* Dynamic Admin Header Panel with Logout */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">Admin Control Panel</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">n8n Workflow Management</h1>
            <p className="mt-1 text-sm text-gray-400">Trigger content generation and manage automated workflow execution</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/">
              <GlassBtn variant="subtle" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </GlassBtn>
            </Link>
            
            <div className={clsx(
              "flex items-center gap-3 rounded-xl border px-3 py-1.5 backdrop-blur-md",
              theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/80 shadow-sm"
            )}>
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{currentUser.roleLabel}</p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Generate Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10"
        >
          <GlassCard className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  Generate Content Now
                </h2>
                <p className="mt-2 text-sm text-gray-300">
                  Trigger the n8n workflow to generate social media posts and images instantly. This bypasses the
                  scheduled trigger (Mon/Wed/Fri 9am) and processes pending content immediately.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <GenerateButton />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Info Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-4 md:grid-cols-3 relative z-10"
        >
          {/* Schedule Info */}
          <GlassCard className="border-purple-500/20">
            <div className="flex items-start gap-3">
              <Clock className="h-6 w-6 shrink-0 text-purple-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Scheduled Trigger</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Automatic generation runs <strong>Monday, Wednesday, Friday at 9 AM</strong>
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Manual Trigger Info */}
          <GlassCard className="border-cyan-500/20">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 shrink-0 text-cyan-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Manual Trigger</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Use the button above to <strong>generate content instantly</strong> anytime
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Pipeline Status */}
          <GlassCard className="border-emerald-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Pipeline Status</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Webhook is <strong>active</strong> and ready to receive triggers
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Workflow Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10"
        >
          <GlassCard>
            <LiveWorkflowTracker />
          </GlassCard>
        </motion.div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative z-10"
        >
          <GlassCard>
            <h3 className="text-lg font-bold text-white">Integrations</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                "n8n Workflow",
                "Google Sheets",
                "OpenRouter (GPT)",
                "Hugging Face (Flux AI)",
                "Cloudinary CDN",
                "hcti.io Renderer",
                "Telegram Bot",
                "Instagram Graph API",
              ].map((tech) => (
                <div key={tech} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm font-medium text-blue-200">
                  {tech}
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </PageTransition>
  );
}
