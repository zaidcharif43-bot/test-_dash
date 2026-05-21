"use client";

import { motion } from "framer-motion";
import { GenerateButton } from "@/components/dashboard/generate-button";
import { LiveWorkflowTracker } from "@/components/dashboard/live-workflow-tracker";
import { GlassCard } from "@/components/ui/glass-components";
import { PageTransition } from "@/components/dashboard/page-transition";
import ParticleBG from "@/components/ui/particle-bg";
import { Zap, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminPage() {
  return (
    <PageTransition moduleKey="admin">
      <div className="min-h-screen space-y-8 p-6">
        <ParticleBG />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Admin Control Panel</p>
          <h1 className="mt-2 text-3xl font-bold text-white">n8n Workflow Management</h1>
          <p className="mt-2 text-gray-300">Trigger content generation and manage automated workflows</p>
        </motion.div>

        {/* Main Generate Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
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
          className="grid gap-4 md:grid-cols-3"
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
