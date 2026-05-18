"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  CalendarDays,
  ChartLine,
  CheckCircle2,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  MessageSquare,
  Settings,
  SquareChartGantt,
  UserRound,
  Users,
  WandSparkles,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import clsx from "clsx";
// Removed Scene3D per design request (3D animation replaced by static placeholder)
import { LoadingScreen } from "@/components/dashboard/loading-screen";
import { GlassCard, GlassBtn, KPICard } from "@/components/ui/glass-components";
import { PageTransition } from "@/components/dashboard/page-transition";

type ModuleKey =
  | "Dashboard"
  | "Publications"
  | "Calendrier editorial"
  | "Clients"
  | "Leads"
  | "Campagnes"
  | "Workflows"
  | "Taches"
  | "Equipe"
  | "Messages"
  | "Analytics"
  | "Notifications"
  | "Parametres";

type PostStatus = "Brouillon" | "En attente" | "Valide" | "Programme" | "Publie";

type Post = {
  id: number;
  title: string;
  platform: string;
  date: string;
  status: PostStatus;
};

type NotificationItem = {
  id: number;
  type: "Push" | "Email" | "WhatsApp" | "Interne";
  text: string;
  read: boolean;
  createdAt: string;
};

const sidebarItems: { label: ModuleKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Publications", icon: Megaphone },
  { label: "Calendrier editorial", icon: CalendarDays },
  { label: "Clients", icon: UserRound },
  { label: "Leads", icon: Briefcase },
  { label: "Campagnes", icon: SquareChartGantt },
  { label: "Workflows", icon: WandSparkles },
  { label: "Taches", icon: ListTodo },
  { label: "Equipe", icon: Users },
  { label: "Messages", icon: MessageSquare },
  { label: "Analytics", icon: ChartLine },
  { label: "Notifications", icon: Bell },
  { label: "Parametres", icon: Settings },
];

const engagementData = [
  { name: "Lun", engagement: 460, reach: 1200 },
  { name: "Mar", engagement: 520, reach: 1390 },
  { name: "Mer", engagement: 480, reach: 1260 },
  { name: "Jeu", engagement: 620, reach: 1560 },
  { name: "Ven", engagement: 710, reach: 1720 },
  { name: "Sam", engagement: 690, reach: 1660 },
  { name: "Dim", engagement: 760, reach: 1890 },
];

const platformData = [
  { platform: "Instagram", value: 39, color: "#60a5fa" },
  { platform: "Facebook", value: 25, color: "#4ade80" },
  { platform: "LinkedIn", value: 19, color: "#fbbf24" },
  { platform: "TikTok", value: 17, color: "#f87171" },
];

const statusFlow: PostStatus[] = ["Brouillon", "En attente", "Valide", "Programme", "Publie"];

const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

// Empty seeds — data will be loaded from the database later
const workflowsSeed: { id: number; trigger: string; action: string; active: boolean; runs: number }[] = [];

const teamSeed: { name: string; role: string; tasks: number; score: number }[] = [];

const clientsSeed: { id: number; company: string; networks: string; campaigns: number; status: string }[] = [];

const messagesSeed: { id: number; channel: string; client: string; text: string; assigned: string }[] = [];

const leadSeed: { id: number; name: string; stage: string; value: number }[] = [];

const taskColumnsSeed: Record<string, string[]> = {
  "A faire": ["Pack stories Ramadan", "Brief campagne hotel"],
  "En cours": ["Montage reel fitness", "Reply inbox client A"],
  Validation: ["Visuel promo ete", "Plan sponsoring Juin"],
  Termine: ["Rapport ROI mai", "Programmation semaine"],
  Retard: ["Relance API WhatsApp"],
};

export default function Home() {
  const [showLoading, setShowLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>("Dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  // No demo posts — data will come from the database later
  const [posts, setPosts] = useState<Post[]>([]);
  const [postForm, setPostForm] = useState({ title: "", platform: "Instagram", date: "", status: "Brouillon" as PostStatus });
  const [taskColumns, setTaskColumns] = useState(taskColumnsSeed);
  const [draggedTask, setDraggedTask] = useState<{ task: string; from: string } | null>(null);
  const [workflows, setWorkflows] = useState(workflowsSeed);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [clientsFilter, setClientsFilter] = useState("");
  const [messages, setMessages] = useState(messagesSeed);
  const [reply, setReply] = useState("");
  const [campaignBudget, setCampaignBudget] = useState(95000);
  const [campaignSpent, setCampaignSpent] = useState(58700);
  const [leads, setLeads] = useState(leadSeed);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const generator = window.setInterval(() => {
      const events = [
        "Nouveau message WhatsApp recu",
        "API Meta response time lent",
        "Tache en retard detectee",
        "Validation client recue",
      ];
      const channels: NotificationItem["type"][] = ["Push", "Email", "WhatsApp", "Interne"];
      const eventText = events[Math.floor(Math.random() * events.length)];
      const eventType = channels[Math.floor(Math.random() * channels.length)];

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: eventType,
          text: eventText,
          read: false,
          createdAt: "A l'instant",
        },
        ...prev,
      ].slice(0, 12));
    }, 18000);

    return () => window.clearInterval(generator);
  }, []);

  const kpis = useMemo(() => {
    const activeCampaigns = campaignSpent > 0 ? 4 : 0;
    const unread = notifications.filter((n) => !n.read).length;
    return [
      { label: "Publications", value: String(posts.length), growth: "+14%", icon: "📊" },
      { label: "Leads", value: String(leads.length), growth: "+22%", icon: "📈" },
      { label: "Clients actifs", value: String(clientsSeed.filter((c) => c.status === "Actif").length), growth: "+6", icon: "👥" },
      { label: "Campagnes actives", value: String(activeCampaigns), growth: "+1", icon: "🎯" },
      { label: "Revenus générés", value: "€48.2K", growth: "+18%", icon: "💰" },
      { label: "Engagement", value: "4.2%", growth: "+2.8%", icon: "💬" },
      { label: "Temps réponse", value: "2h 15m", growth: "-30m", icon: "⏱️" },
      { label: "Notif non lues", value: String(unread), growth: "live", icon: "🔔" },
    ];
  }, [campaignSpent, leads.length, notifications, posts]);

  const filteredClients = clientsSeed.filter((c) =>
    c.company.toLowerCase().includes(clientsFilter.toLowerCase()),
  );

  const addPost = () => {
    if (!postForm.title.trim() || !postForm.date) {
      return;
    }
    setPosts((prev) => [
      {
        id: Date.now(),
        title: postForm.title.trim(),
        platform: postForm.platform,
        date: postForm.date,
        status: postForm.status,
      },
      ...prev,
    ]);
    setPostForm({ title: "", platform: "Instagram", date: "", status: "Brouillon" });
  };

  const cyclePostStatus = (id: number) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== id) {
          return post;
        }
        const currentIndex = statusFlow.indexOf(post.status);
        const nextStatus = statusFlow[(currentIndex + 1) % statusFlow.length];
        return { ...post, status: nextStatus };
      }),
    );
  };

  const runWorkflow = (id: number) => {
    setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, runs: wf.runs + 1 } : wf)));
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "Interne",
        text: "Workflow execute avec succes",
        read: false,
        createdAt: "Maintenant",
      },
      ...prev,
    ]);
  };

  const toggleWorkflow = (id: number) => {
    setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, active: !wf.active } : wf)));
  };

  const onTaskDrop = (toColumn: string) => {
    if (!draggedTask || draggedTask.from === toColumn) {
      setDraggedTask(null);
      return;
    }

    setTaskColumns((prev) => {
      const sourceItems = prev[draggedTask.from].filter((item) => item !== draggedTask.task);
      const targetItems = [draggedTask.task, ...prev[toColumn]];

      return {
        ...prev,
        [draggedTask.from]: sourceItems,
        [toColumn]: targetItems,
      };
    });
    setDraggedTask(null);
  };

  const sendReply = () => {
    if (!reply.trim()) {
      return;
    }
    setMessages((prev) => {
      if (!prev.length) {
        return prev;
      }
      return [{ ...prev[0], text: `Derniere reponse: ${reply.trim()}` }, ...prev.slice(1)];
    });
    setReply("");
  };

  const moveLead = (id: number) => {
    const stages = ["Nouveau", "Qualification", "Proposal", "Won"];
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) {
          return lead;
        }
        const idx = stages.indexOf(lead.stage);
        const next = stages[(idx + 1) % stages.length];
        return { ...lead, stage: next };
      }),
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const renderModule = () => {
    if (activeModule === "Dashboard") {
      return (
        <PageTransition moduleKey="dashboard">
          <div className="space-y-6">
            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Metriques en temps reel</p>
                <h3 className="mt-2 text-xl font-bold text-white">Key Performance Indicators</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((kpi, i) => (
                  <KPICard key={kpi.label} kpi={kpi} delay={i * 0.08} />
                ))}
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <GlassCard className="overflow-hidden">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Animation visuelle</h3>
                    <p className="mt-1 text-sm text-blue-200">Design statique — 3D supprimée (connexion base prévue)</p>
                  </div>
                  <div className="h-60 w-full overflow-hidden rounded-xl border border-white/6 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-center">
                    <div className="text-center px-6">
                      <p className="text-sm font-semibold text-slate-300">Placeholder visuel</p>
                      <p className="mt-1 text-xs text-slate-400">3D animation removed — DB integration will provide live scene later</p>
                    </div>
                  </div>
                </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-bold text-white">Activite recente</h3>
                <ul className="mt-4 space-y-3">
                  {notifications.slice(0, 5).map((item, i) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-3 rounded-lg border border-white/5 bg-white/3 p-2.5"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                      <span className="text-sm text-gray-200">{item.text}</span>
                    </motion.li>
                  ))}
                </ul>
              </GlassCard>
            </section>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Publications") {
      return (
        <PageTransition moduleKey="publications">
          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <GlassCard>
              <h3 className="text-lg font-bold text-white">Programmer publication</h3>
              <div className="mt-4 space-y-3">
                <input
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre du post..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-400 outline-none transition focus:border-blue-400 focus:bg-white/10"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={postForm.platform}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, platform: e.target.value }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white"
                  >
                    <option className="bg-slate-900">Instagram</option>
                    <option className="bg-slate-900">Facebook</option>
                    <option className="bg-slate-900">LinkedIn</option>
                    <option className="bg-slate-900">TikTok</option>
                  </select>
                  <select
                    value={postForm.status}
                    onChange={(e) => setPostForm((prev) => ({ ...prev, status: e.target.value as PostStatus }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white"
                  >
                    {statusFlow.map((status) => (
                      <option key={status} className="bg-slate-900">
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="date"
                  value={postForm.date}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white"
                />
                <GlassBtn variant="primary" onClick={addPost} className="w-full">
                  Ajouter publication
                </GlassBtn>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-bold text-white">Liste publications</h3>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    className="rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition"
                  >
                    <p className="font-semibold text-white">{post.title}</p>
                    <p className="text-xs text-gray-400">{post.platform} • {post.date}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs text-blue-300">{post.status}</span>
                      <GlassBtn variant="subtle" size="sm" onClick={() => cyclePostStatus(post.id)}>
                        Next
                      </GlassBtn>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Calendrier editorial") {
      return (
        <PageTransition moduleKey="calendar">
          <GlassCard>
            <h3 className="text-lg font-bold text-white">Calendrier editorial - Mai 2026</h3>
            <p className="mt-1 text-sm text-blue-200">Vue mensuelle des publications programmees</p>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {calendarDays.map((day) => {
                const dateString = `2026-05-${String(day).padStart(2, "0")}`;
                const events = posts.filter((p) => p.date === dateString);
                return (
                  <div key={day} className="min-h-20 rounded-lg border border-white/10 bg-white/3 p-2">
                    <p className="text-xs font-bold text-white">{day}</p>
                    <div className="mt-1 space-y-1">
                      {events.slice(0, 2).map((event) => (
                        <p key={event.id} className="truncate rounded bg-blue-500/20 px-1 py-0.5 text-[10px] text-blue-300">
                          {event.platform}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </PageTransition>
      );
    }

    if (activeModule === "Clients") {
      return (
        <PageTransition moduleKey="clients">
          <div className="space-y-6">
            <GlassCard>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Gestion clients</h3>
                  <p className="mt-1 text-sm text-blue-200">Suivi complet — réseaux, campagnes, historique</p>
                </div>
                <input
                  value={clientsFilter}
                  onChange={(e) => setClientsFilter(e.target.value)}
                  placeholder="Rechercher client..."
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-400"
                />
              </div>
            </GlassCard>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredClients.length === 0 ? (
                <GlassCard className="md:col-span-2 xl:col-span-3">
                  <div className="text-center py-12">
                    <p className="text-gray-400">Aucun client</p>
                    <p className="text-xs text-gray-500 mt-1">Connectez la base de données pour charger les clients</p>
                  </div>
                </GlassCard>
              ) : (
                filteredClients.map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 hover:border-white/20 transition"
                  >
                    <p className="font-semibold text-white">{client.company}</p>
                    <p className="text-xs text-gray-400 mt-1">Responsable: N/A</p>
                    <p className="text-xs text-gray-400">Réseaux: {client.networks}</p>
                    <p className="text-xs text-gray-400">Campagnes: {client.campaigns}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-green-500/20 px-2.5 py-1 text-xs text-green-300">{client.status}</span>
                      <GlassBtn variant="subtle" size="sm">Voir détails</GlassBtn>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Leads") {
      return (
        <PageTransition moduleKey="leads">
          <GlassCard>
            <h3 className="text-lg font-bold text-white">Pipeline leads</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {leads.map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition"
                >
                  <p className="font-semibold text-white">{lead.name}</p>
                  <p className="text-sm text-gray-400">Value: {lead.value.toLocaleString()} MAD</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-xs text-purple-300">{lead.stage}</span>
                    <GlassBtn variant="subtle" size="sm" onClick={() => moveLead(lead.id)}>
                      →
                    </GlassBtn>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </PageTransition>
      );
    }

    if (activeModule === "Campagnes") {
      const roi = Math.round(((campaignBudget * 1.7 - campaignSpent) / campaignSpent) * 100);
      return (
        <PageTransition moduleKey="campaigns">
          <div className="grid gap-6 xl:grid-cols-2">
            <GlassCard>
              <h3 className="text-lg font-bold text-white">Budget & Performance</h3>
              <div className="mt-4 space-y-3 text-sm">
                <label className="block">
                  <span className="text-xs text-blue-300">Budget total</span>
                  <input
                    type="number"
                    value={campaignBudget}
                    onChange={(e) => setCampaignBudget(Number(e.target.value || 0))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-blue-300">Depense actuelle</span>
                  <input
                    type="number"
                    value={campaignSpent}
                    onChange={(e) => setCampaignSpent(Number(e.target.value || 0))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
                  />
                </label>
              </div>
            </GlassCard>
            <GlassCard>
              <h3 className="text-lg font-bold text-white">KPI Campagne</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">ROI</p>
                  <p className="mt-1 text-xl font-bold text-green-400">{Number.isFinite(roi) ? roi : 0}%</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">Conversions</p>
                  <p className="mt-1 text-xl font-bold text-blue-400">312</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">CPL</p>
                  <p className="mt-1 text-xl font-bold text-yellow-400">47 MAD</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">Best: Meta</p>
                  <p className="mt-1 text-sm font-bold text-purple-400">Advantage</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Workflows") {
      return (
        <PageTransition moduleKey="workflows">
          <GlassCard>
            <h3 className="text-lg font-bold text-white">Workflows & Automatisation</h3>
            <div className="mt-4 space-y-3">
              {workflows.map((flow, i) => (
                <motion.div
                  key={flow.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition"
                >
                  <p className="font-semibold text-white">Trigger: {flow.trigger}</p>
                  <p className="text-sm text-gray-400">Action: {flow.action}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <GlassBtn variant="secondary" size="sm" onClick={() => toggleWorkflow(flow.id)}>
                      {flow.active ? "Desactiver" : "Activer"}
                    </GlassBtn>
                    <GlassBtn variant="primary" size="sm" onClick={() => runWorkflow(flow.id)}>
                      Executer
                    </GlassBtn>
                    <span className="rounded-lg bg-white/5 px-3 py-1 text-xs text-gray-300">Runs: {flow.runs}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </PageTransition>
      );
    }

    if (activeModule === "Taches") {
      return (
        <PageTransition moduleKey="tasks">
          <div className="space-y-6">
            <GlassCard>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Tableau Kanban</h3>
                  <p className="mt-1 text-sm text-blue-200">Drag & drop tasks — priorités, deadlines, assignations</p>
                </div>
                <GlassBtn variant="primary" size="sm">+ Nouvelle tâche</GlassBtn>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(taskColumns).map(([column, tasks]) => (
                  <motion.div
                    key={column}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onTaskDrop(column)}
                    className="rounded-lg bg-gradient-to-b from-white/8 to-white/3 border border-white/10 p-3 min-h-96"
                  >
                    <p className="mb-3 text-sm font-bold text-white">{column}</p>
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-gray-400">No tasks</p>
                          <p className="text-xs text-gray-500 mt-1">Connect database to populate</p>
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <motion.div
                            key={task}
                            draggable
                            onDragStart={() => setDraggedTask({ task, from: column })}
                            layout
                            className="cursor-grab active:cursor-grabbing rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 p-2.5 text-xs text-gray-200 hover:border-white/20 transition"
                          >
                            {task}
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <GlassCard>
                <h4 className="text-sm font-bold text-white">Priorités</h4>
                <ul className="mt-3 space-y-2 text-xs text-gray-300">
                  <li>🔴 Critique</li>
                  <li>🟠 Haute</li>
                  <li>🟡 Normale</li>
                  <li>🟢 Basse</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white">Statuts</h4>
                <ul className="mt-3 space-y-2 text-xs text-gray-300">
                  <li>📋 À faire</li>
                  <li>⚙️ En cours</li>
                  <li>✅ Validation</li>
                  <li>✔️ Terminé</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white">Assignations</h4>
                <ul className="mt-3 space-y-2 text-xs text-gray-300">
                  <li>Auto-assign par rôle</li>
                  <li>Attribution manuelle</li>
                  <li>Notifications</li>
                  <li>Suivi temps</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Equipe") {
      return (
        <PageTransition moduleKey="team">
          <GlassCard>
            <h3 className="text-lg font-bold text-white">Performance equipe</h3>
            <div className="mt-4 space-y-3">
              {teamSeed.map((member, i) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition"
                >
                  <div>
                    <p className="font-semibold text-white">{member.name}</p>
                    <p className="text-sm text-gray-400">{member.role} • {member.tasks} taches</p>
                  </div>
                  <div className="rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 px-3 py-1 text-xs font-bold text-orange-300">
                    {member.score}%
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </PageTransition>
      );
    }

    if (activeModule === "Messages") {
      return (
        <PageTransition moduleKey="messages">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <GlassCard>
              <h3 className="text-lg font-bold text-white">Inbox centralisee</h3>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/8 transition"
                  >
                    <p className="font-semibold text-white">{msg.channel} | {msg.client}</p>
                    <p className="text-sm text-gray-300">{msg.text}</p>
                    <p className="mt-1 text-xs text-gray-500">→ {msg.assigned}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-bold text-white">Reponse rapide</h3>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={6}
                placeholder="Ecrire une reponse..."
                className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-gray-500 outline-none focus:border-blue-400 focus:bg-white/8"
              />
              <GlassBtn variant="primary" onClick={sendReply} className="mt-3 w-full">
                Envoyer
              </GlassBtn>
            </GlassCard>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Analytics") {
      return (
        <PageTransition moduleKey="analytics">
          <div className="space-y-6">
            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4">Métriques réseaux sociaux</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">Likes</p>
                  <p className="mt-1 text-lg font-bold text-pink-400">2.4K</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">Commentaires</p>
                  <p className="mt-1 text-lg font-bold text-blue-400">832</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">Partages</p>
                  <p className="mt-1 text-lg font-bold text-green-400">456</p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">Portée</p>
                  <p className="mt-1 text-lg font-bold text-purple-400">14.2K</p>
                </div>
              </div>
            </GlassCard>

            <div className="grid gap-6 xl:grid-cols-2">
              <GlassCard>
                <h3 className="text-lg font-bold text-white">Evolution engagement</h3>
                <div className="h-64 pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,30,0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }} />
                      <Line type="monotone" dataKey="engagement" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="reach" stroke="#4ade80" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard>
                <h3 className="text-lg font-bold text-white">Comparaison plateformes</h3>
                <div className="h-64 pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="platform" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip contentStyle={{ backgroundColor: "rgba(10,10,30,0.9)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {platformData.map((item) => (
                          <Cell key={item.platform} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Performance équipe</h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li>✓ Tâches terminées: 18/20</li>
                  <li>⏱ Temps traitement: 2h 45m</li>
                  <li>📈 Productivité: +8%</li>
                  <li>✅ Deadlines: 95%</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Performance campagnes</h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li>💰 ROI: 245%</li>
                  <li>📊 Conversions: 312</li>
                  <li>💵 Coût/Lead: 47 MAD</li>
                  <li>⭐ Meilleure: Meta</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Audience</h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li>👥 Abonnés gagnés: +1.2K</li>
                  <li>📊 Impressions: 48K</li>
                  <li>🔗 Clics: 2.1K</li>
                  <li>↕️ Croissance: +18%</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Notifications") {
      return (
        <PageTransition moduleKey="notifications">
          <div className="space-y-6">
            <GlassCard>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Notifications intelligentes</h3>
                  <p className="mt-1 text-sm text-blue-200">Push • Email • WhatsApp • Internes</p>
                </div>
                <GlassBtn variant="secondary" size="sm" onClick={markAllRead}>
                  Tout marquer lu
                </GlassBtn>
              </div>
            </GlassCard>

            <div className="grid gap-3 md:grid-cols-2">
              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Types de notifications</h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li>📲 Push notifications</li>
                  <li>📧 Email</li>
                  <li>💬 WhatsApp</li>
                  <li>🔔 Notifications internes</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Notifications automatiques</h4>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li>⏰ Retard tâche détecté</li>
                  <li>💬 Nouveau message client</li>
                  <li>✅ Validation demandée</li>
                  <li>⚙️ Workflow exécuté</li>
                </ul>
              </GlassCard>
            </div>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">Centre d&apos;alertes</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Aucune notification</p>
                    <p className="text-xs text-gray-500 mt-1">Vous êtes à jour</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className={clsx(
                        "rounded-lg border p-3 transition",
                        item.read ? "border-white/10 bg-white/3" : "border-blue-400/50 bg-blue-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="font-semibold text-blue-300">{item.type}</span>
                        <span>{item.createdAt}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-200">{item.text}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassCard>
          </div>
        </PageTransition>
      );
    }

    return (
      <PageTransition moduleKey="settings">
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-bold text-white">Paramètres du Dashboard</h3>
            <p className="mt-1 text-sm text-blue-200">Gestion complète de l&apos;interface et des autorisations</p>
          </GlassCard>

          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">🎨 Apparence</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Thème</p>
                  <div className="flex gap-2">
                    <GlassBtn
                      variant={theme === "light" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setTheme("light")}
                    >
                      ☀️ Light
                    </GlassBtn>
                    <GlassBtn
                      variant={theme === "dark" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                    >
                      🌙 Dark
                    </GlassBtn>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Langue</p>
                  <select className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                    <option className="bg-slate-900">Français</option>
                    <option className="bg-slate-900">English</option>
                    <option className="bg-slate-900">Español</option>
                    <option className="bg-slate-900">العربية</option>
                  </select>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">👥 Utilisateurs & Permissions</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex justify-between"><span>Administrateur</span> <span className="text-green-400">Full Access</span></li>
                <li className="flex justify-between"><span>Manager</span> <span className="text-blue-400">Campagnes + Équipe</span></li>
                <li className="flex justify-between"><span>Community Manager</span> <span className="text-blue-400">Pub + Messages</span></li>
                <li className="flex justify-between"><span>Designer</span> <span className="text-purple-400">Content</span></li>
                <li className="flex justify-between"><span>Commercial</span> <span className="text-orange-400">Leads</span></li>
                <li className="flex justify-between"><span>Client</span> <span className="text-yellow-400">Analytics</span></li>
              </ul>
            </GlassCard>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">🔗 Intégrations API</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>✓ Meta (Facebook, Instagram)</li>
                <li>✓ LinkedIn</li>
                <li>✓ TikTok</li>
                <li>⚙️ Configuration requise</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">🔐 Sécurité</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>✓ 2FA: Activé</li>
                <li>✓ SSL/TLS: Activé</li>
                <li>✓ Authentification: OAuth</li>
                <li>🔒 Dernière vérification: 2 jours</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">💾 Sauvegarde & Données</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li>✓ Auto-backup: Quotidien</li>
                <li>✓ Rétention: 90 jours</li>
                <li>✓ Export: Disponible</li>
                <li>🔄 Dernière: il y a 2 h</li>
              </ul>
            </GlassCard>
          </div>

          <GlassCard>
            <h4 className="text-sm font-bold text-white mb-3">ℹ️ À propos</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="text-xs text-gray-300">
                <p className="text-gray-400">Version</p>
                <p className="mt-1 font-semibold">Dashboard v2.0 (Frontend Ready)</p>
              </div>
              <div className="text-xs text-gray-300">
                <p className="text-gray-400">Statut</p>
                <p className="mt-1 font-semibold">Prêt pour connexion DB</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </PageTransition>
    );
  };

  if (showLoading) {
    return <LoadingScreen duration={2.8} onComplete={() => setShowLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-[1560px] px-3 py-3 md:px-6 md:py-6">
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-3 hidden h-[calc(100vh-1.5rem)] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/8 to-white/3 backdrop-blur-xl lg:flex"
          >
            <div className="border-b border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Intelligence</p>
              <h1 className="mt-2 text-lg font-bold text-white">Agency Control</h1>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {sidebarItems.map((item, i) => {
                const Icon = item.icon;
                const active = activeModule === item.label;
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveModule(item.label)}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                      active
                        ? "bg-gradient-to-r from-blue-500/40 to-purple-500/40 border border-blue-400/50 text-white shadow-lg shadow-blue-500/10"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="border-t border-white/10 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Active User</p>
              <p className="mt-2 text-sm text-white">Admin • Full Access</p>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/8 to-white/3 backdrop-blur-xl p-4 md:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Realtime Cockpit</p>
                  <h2 className="mt-2 text-2xl font-bold md:text-3xl text-white">{activeModule}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 px-3 py-1 text-xs font-semibold text-green-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    Live sync
                  </motion.span>
                  <GlassBtn
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveModule("Publications")}
                  >
                    + Publication
                  </GlassBtn>
                </div>
              </div>

              {/* Mobile Nav */}
              <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                {sidebarItems.slice(0, 7).map((item) => (
                  <GlassBtn
                    key={item.label}
                    variant={activeModule === item.label ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setActiveModule(item.label)}
                  >
                    {item.label.slice(0, 8)}
                  </GlassBtn>
                ))}
              </div>
            </motion.header>

            {/* Module Content */}
            <motion.section
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderModule()}
            </motion.section>

            {/* Footer */}
            <motion.footer
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/2 p-3 text-xs text-gray-400"
            >
              <Sparkles className="h-4 w-4 text-blue-400" />
              Frontend-only demo • All interactions are UI-based • Ready for API integration
            </motion.footer>
          </main>
        </div>
      </div>
    </div>
  );
}
