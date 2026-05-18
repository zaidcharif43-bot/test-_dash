"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function GlassCard({ children, className, hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : undefined}
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl",
        "shadow-2xl shadow-black/20 transition-all duration-300",
        hover && "hover:border-white/20 hover:bg-white/8 hover:shadow-xl hover:shadow-blue-500/10",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

interface GlassBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "subtle";
  loading?: boolean;
}

export function GlassBtn({ children, onClick, className, variant = "primary", loading = false }: GlassBtnProps) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white",
    secondary: "border border-white/20 bg-white/5 hover:bg-white/10 text-white",
    subtle: "text-slate-300 hover:text-white hover:bg-white/5",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={clsx(
        "rounded-xl px-4 py-2 text-sm font-semibold backdrop-blur-md transition-all duration-300",
        variants[variant],
        loading && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {loading ? "..." : children}
    </motion.button>
  );
}

interface ModuleHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function ModuleHeader({ title, description, action }: ModuleHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
    >
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-300">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </motion.header>
  );
}

interface KPICardProps {
  label: string;
  value: string;
  growth: string;
  icon?: React.ReactNode;
  trend?: "up" | "down";
}

export function KPICard({ label, value, growth, icon, trend = "up" }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5 backdrop-blur-xl hover:border-white/20 hover:bg-white/10"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
        </div>
        {icon && <div className="text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>
      <div className="mt-3 flex items-center gap-1">
        <span className={clsx("text-sm font-semibold", trend === "up" ? "text-green-400" : "text-orange-400")}>
          {growth}
        </span>
      </div>
    </motion.div>
  );
}
