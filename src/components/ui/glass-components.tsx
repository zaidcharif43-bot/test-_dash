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
        "glass-card rounded-2xl p-5 backdrop-blur-xl transition-all duration-300",
        hover && "hover:border-[#D4A017]/20 hover:shadow-xl hover:shadow-blue-500/5",
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
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function GlassBtn({ children, onClick, className, variant = "primary", loading = false, disabled = false, size = "md" }: GlassBtnProps) {
  const variants = {
    primary: "glass-btn-primary text-white shadow-lg shadow-[#D4A017]/10",
    secondary: "glass-btn-secondary",
    subtle: "glass-btn-subtle",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-5 py-2.5 text-base rounded-2xl",
  };

  return (
    <motion.button
      whileHover={loading || disabled ? undefined : { scale: 1.02 }}
      whileTap={loading || disabled ? undefined : { scale: 0.98 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={clsx(
        "font-semibold backdrop-blur-md transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5",
        sizes[size],
        variants[variant],
        (loading || disabled) && "opacity-50 cursor-not-allowed",
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
      className="glass-card mb-6 flex flex-wrap items-center justify-between gap-4 p-5 backdrop-blur-xl"
    >
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm opacity-80">{description}</p>}
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
  delay?: number;
}

export function KPICard({ label, value, growth, icon, trend = "up", delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.05 }}
      className="kpi-card group rounded-2xl p-5 backdrop-blur-xl hover:border-[#D4A017]/20 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest opacity-70">{label}</p>
          <p className="mt-3 text-3xl font-bold">{value}</p>
        </div>
        {icon && <div className="text-[#D4A017] opacity-60 group-hover:opacity-100 transition-opacity">{icon}</div>}
      </div>
      <div className="mt-3 flex items-center gap-1">
        <span className={clsx("text-sm font-semibold", trend === "up" ? "text-green-400" : "text-orange-400")}>
          {growth}
        </span>
      </div>
    </motion.div>
  );
}
