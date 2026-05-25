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
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  BarChart3,
  Globe,
  X,
  AlertCircle,
  AlertTriangle,
  ArrowRightCircle,
  ArrowDownCircle,
  Check,
  Smartphone,
  Mail,
  Shield,
  Database,
  Plus,
  Info,
  Rocket,
  Zap,
  Sun,
  Moon,
  Link,
  KeyRound,
  Activity,
  Search,
  CornerDownRight,
  LogOut,
} from "lucide-react";

const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);
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
import { GenerateButton } from "@/components/dashboard/generate-button";
import { LiveWorkflowTracker } from "@/components/dashboard/live-workflow-tracker";
import ParticleBG from "@/components/ui/particle-bg";
import Image from "next/image";
import { LoginScreen, type LoggedInUser } from "@/components/dashboard/login-screen";
import { supabase } from "@/lib/supabase";

type ModuleKey =
  | "Dashboard"
  | "Publications"
  | "Calendrier editorial"
  | "Clients"
  | "Add Publication"
  | "Taches"
  | "Equipe"
  | "Messages"
  | "Notifications"
  | "Parametres"
  | "Admin";

type Post = {
  id: number | string;
  title: string;
  platform: string;
  date: string;
  dateTime?: string;
  status: string;
  likes?: number;
  comments?: number;
  image?: string;
  views?: number;
  viewers?: number;
  impressions?: number;
  shares?: number;
  netFollows?: number;
  commentsList?: any[];
};

type NotificationItem = {
  id: number;
  type: "Push" | "Email" | "WhatsApp" | "Interne";
  text: string;
  read: boolean;
  createdAt: string;
};

export interface DBTask {
  id: number;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "validation" | "done" | "overdue";
  priority: "urgent" | "high" | "medium" | "low";
  deadline?: string;
  is_active?: boolean;
  assigned_to?: number;
}

const dbStatusToLocal = (status: string): string => {
  switch (status) {
    case "todo": return "A faire";
    case "in_progress": return "En cours";
    case "validation": return "Validation";
    case "done": return "Termine";
    case "overdue": return "Retard";
    default: return "A faire";
  }
};

const localStatusToDb = (column: string): "todo" | "in_progress" | "validation" | "done" | "overdue" => {
  switch (column) {
    case "A faire": return "todo";
    case "En cours": return "in_progress";
    case "Validation": return "validation";
    case "Termine": return "done";
    case "Retard": return "overdue";
    default: return "todo";
  }
};

const localPriorityToDb = (priority: string): "urgent" | "high" | "medium" | "low" => {
  switch (priority) {
    case "Critique": return "urgent";
    case "Haute": return "high";
    case "Normale": return "medium";
    case "Basse": return "low";
    default: return "medium";
  }
};

const dbPriorityToEmoji = (priority: string): string => {
  switch (priority) {
    case "urgent": return "🔴";
    case "high": return "🟠";
    case "medium": return "🟡";
    case "low": return "🟢";
    default: return "🟡";
  }
};

const sidebarItems: { label: ModuleKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Publications", icon: Megaphone },
  { label: "Calendrier editorial", icon: CalendarDays },
  { label: "Clients", icon: UserRound },
  { label: "Add Publication", icon: WandSparkles },
  { label: "Taches", icon: ListTodo },
  { label: "Equipe", icon: Users },
  { label: "Messages", icon: MessageSquare },
  { label: "Admin", icon: Settings },
  { label: "Parametres", icon: Settings },
];

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
  "Validation": ["Visuel promo ete", "Plan sponsoring Juin"],
  "Termine": ["Rapport ROI mai", "Programmation semaine"],
  Retard: ["Relance API WhatsApp"],
};

const translations: Record<string, Record<string, string>> = {
  "Français": {
    dashboard: "Tableau de bord",
    publications: "Publications",
    calendriereditorial: "Calendrier Éditorial",
    clients: "Clients",
    leads: "Prospects (Leads)",
    campagnes: "Campagnes",
    addpublication: "Add Publication",
    workflows: "Workflows",
    taches: "Tâches",
    equipe: "Équipe",
    messages: "Messages",
    notifications: "Notifications",
    parametres: "Paramètres",
    admin: "Admin",
    livesync: "Mise à jour en direct",
    connected: "Connecté (Réel)",
    simulated: "Simulé (Fallback)",
    notconnected: "Non Connecté",
    likes: "Likes",
    comments: "Commentaires",
    shares: "Partages",
    reach: "Portée",
    activeuser: "Utilisateur Actif",
    save: "Enregistrer la configuration",
    apparence: "Apparence",
    userspermissions: "Utilisateurs & Permissions",
  },
  "English": {
    dashboard: "Dashboard",
    publications: "Publications",
    calendriereditorial: "Editorial Calendar",
    clients: "Clients",
    leads: "Leads",
    campagnes: "Campaigns",
    addpublication: "Add Publication",
    workflows: "Workflows",
    taches: "Tasks",
    equipe: "Team",
    messages: "Messages",
    notifications: "Notifications",
    parametres: "Settings",
    admin: "Admin",
    livesync: "Live Sync Active",
    connected: "Connected (Real)",
    simulated: "Simulated (Fallback)",
    notconnected: "Not Connected",
    likes: "Likes",
    comments: "Comments",
    shares: "Shares",
    reach: "Reach",
    activeuser: "Active User",
    save: "Save Configuration",
    apparence: "Appearance",
    userspermissions: "Users & Permissions",
  },
  "العربية": {
    dashboard: "لوحة التحكم",
    publications: "المنشورات",
    calendriereditorial: "التقويم التحريري",
    clients: "العملاء",
    leads: "العملاء المحتملون",
    campagnes: "الحملات الإعلانية",
    addpublication: "إضافة منشور",
    workflows: "سير العمل المؤتمت",
    taches: "المهام",
    equipe: "الفريق",
    messages: "الرسائل",
    notifications: "الإشعارات",
    parametres: "الإعدادات",
    admin: "الإدارة العامة",
    livesync: "مزامنة حية نشطة",
    connected: "متصل (حقيقي)",
    simulated: "محاكاة (احتياطي)",
    notconnected: "غير متصل",
    likes: "الإعجابات",
    comments: "التعليقات",
    shares: "المشاركات",
    reach: "الوصول",
    activeuser: "المستخدم الحالي",
    save: "حفظ الإعدادات",
    apparence: "المظهر العام",
    userspermissions: "المستخدمين والصلاحيات",
  }
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [dbReplies, setDbReplies] = useState<any[]>([]);
  const [showLoading, setShowLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleKey>("Dashboard");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState("Français");
  const [metaToken, setMetaToken] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaIgId, setMetaIgId] = useState("");
  const [googleSheetId, setGoogleSheetId] = useState("");

  // Intermediate form states for Settings
  const [inputToken, setInputToken] = useState("");
  const [inputPageId, setInputPageId] = useState("");
  const [inputIgId, setInputIgId] = useState("");
  const [inputSheetId, setInputSheetId] = useState("");

  const t = (key: string, defaultText: string) => {
    const cleanKey = key.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[éèêë]/g, "e")
      .replace(/[àâä]/g, "a")
      .replace(/[ôö]/g, "o")
      .replace(/[ûüù]/g, "u")
      .replace(/[îï]/g, "i")
      .replace(/ç/g, "c")
      .replace(/[أإآا]/g, "a");
    return translations[language]?.[cleanKey] || defaultText;
  };

  // No demo posts — data will come from the database later
  const [posts, setPosts] = useState<Post[]>([]);
  const [calendarPosts, setCalendarPosts] = useState<any[]>([]);
  const [sheetPublications, setSheetPublications] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [newPubService, setNewPubService] = useState("");
  const [newPubCustomService, setNewPubCustomService] = useState("");
  const [isCustomService, setIsCustomService] = useState(false);
  const [newPubDescription, setNewPubDescription] = useState("");
  const [newPubHashtags, setNewPubHashtags] = useState("");
  const [newPubStatus, setNewPubStatus] = useState("Pending");
  const [isSubmittingPub, setIsSubmittingPub] = useState(false);
  const [taskColumns, setTaskColumns] = useState<Record<string, DBTask[]>>({
    "A faire": [],
    "En cours": [],
    "Validation": [],
    "Termine": [],
    "Retard": [],
  });
  const [draggedTask, setDraggedTask] = useState<{ task: DBTask; from: string } | null>(null);
  
  // Custom Task Creation Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColumn, setNewTaskColumn] = useState("A faire");
  const [newTaskPriority, setNewTaskPriority] = useState("Normale");

  // Custom Client Creation Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientContact, setNewClientContact] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientIndustry, setNewClientIndustry] = useState("");
  const [newClientStatus, setNewClientStatus] = useState("Actif");

  const [workflows, setWorkflows] = useState(workflowsSeed);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [clientsFilter, setClientsFilter] = useState("");
  const [messages, setMessages] = useState(messagesSeed);
  const [reply, setReply] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<string | number | null>(null);
  const [selectedComment, setSelectedComment] = useState<any | null>(null);
  const [commentReplyText, setCommentReplyText] = useState("");
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const visibleSidebarItems = useMemo(() => {
    if (!currentUser) return [];
    return sidebarItems.filter((item) => {
      if (currentUser.role === "cm") {
        return ["Dashboard", "Publications", "Calendrier editorial", "Messages", "Notifications", "Parametres"].includes(item.label);
      }
      if (currentUser.role === "manager") {
        return item.label !== "Admin";
      }
      return true; // admin
    });
  }, [currentUser]);

  // Adjust activeModule if permissions restrict it
  useEffect(() => {
    if (currentUser && visibleSidebarItems.length > 0) {
      const isAllowed = visibleSidebarItems.some(item => item.label === activeModule);
      if (!isAllowed) {
        setActiveModule(visibleSidebarItems[0].label);
      }
    }
  }, [currentUser, activeModule, visibleSidebarItems]);
  const [messagesSearchQuery, setMessagesSearchQuery] = useState("");
  const [messagesPlatformFilter, setMessagesPlatformFilter] = useState<"All" | "Facebook" | "Instagram">("All");
  const [campaignBudget, setCampaignBudget] = useState(95000);
  const [campaignSpent, setCampaignSpent] = useState(58700);
  const [leads, setLeads] = useState(leadSeed);
  const [metaInsights, setMetaInsights] = useState<{facebook: any; instagram: any; recentPosts?: any[]; isForecast?: boolean; metrics?: any} | null>(null);

  // Date selectors initialized to May 2026 (matching baseline scheduled posts)
  const [selectedMonth, setSelectedMonth] = useState<number>(4); // May (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [publicationsFilter, setPublicationsFilter] = useState<"All" | "Facebook" | "Instagram">("All");

  const monthsList = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 0) {
        setSelectedYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev === 11) {
        setSelectedYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleGoToToday = () => {
    setSelectedMonth(4); // Reset to baseline sheet month
    setSelectedYear(2026);
  };

  // True calendar grid calculations
  const calendarCells = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const cells = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ dayNum: null, dateString: "" });
    }
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(selectedMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateString = `${selectedYear}-${monthStr}-${dayStr}`;
      cells.push({ dayNum: day, dateString });
    }
    return cells;
  }, [selectedMonth, selectedYear]);

  // Dynamically compute forecast metrics for future dates
  const displayInsights = useMemo(() => {
    if (!metaInsights) return null;

    const baseYear = 2026;
    const baseMonth = 4; // May
    
    // Calculate months difference
    const diffMonths = (selectedYear - baseYear) * 12 + (selectedMonth - baseMonth);
    const baseMetrics = metaInsights.metrics || { totalLikes: 0, totalComments: 0, totalShares: 0, totalReach: 0 };

    if (diffMonths <= 0) {
      return {
        ...metaInsights,
        metrics: baseMetrics
      };
    }

    // Future date: simulate predictive values showing professional growth!
    const growthFactor = 1 + diffMonths * 0.08; // 8% monthly growth
    const fbFollowers = Math.round(metaInsights.facebook.followers * growthFactor);
    const fbLikes = Math.round(metaInsights.facebook.likes * (1 + diffMonths * 0.07));
    const igFollowers = Math.round(metaInsights.instagram.followers * (1 + diffMonths * 0.12));
    const igPosts = metaInsights.instagram.posts + diffMonths * 8; // 8 new posts scheduled per month

    const growthMultiplier = 1 + diffMonths * 0.09;
    const metrics = {
      totalLikes: Math.round(baseMetrics.totalLikes * growthMultiplier),
      totalComments: Math.round(baseMetrics.totalComments * growthMultiplier),
      totalShares: Math.round(baseMetrics.totalShares * growthMultiplier),
      totalReach: Math.round(baseMetrics.totalReach * growthMultiplier),
    };

    return {
      isForecast: true,
      facebook: {
        name: metaInsights.facebook.name,
        followers: fbFollowers,
        likes: fbLikes,
      },
      instagram: {
        username: metaInsights.instagram.username,
        followers: igFollowers,
        posts: igPosts,
      },
      recentPosts: metaInsights.recentPosts,
      metrics
    };
  }, [metaInsights, selectedMonth, selectedYear]);

  // Dynamically compute comparative platform data
  const platformData = useMemo(() => {
    if (!displayInsights) {
      return [
        { platform: "Instagram", value: 39, color: "#ec4899" },
        { platform: "Facebook", value: 25, color: "#3b82f6" },
        { platform: "LinkedIn", value: 19, color: "#fbbf24" },
      ];
    }
    const igFollowers = displayInsights.instagram?.followers ?? 0;
    const fbFollowers = displayInsights.facebook?.followers ?? 0;
    const total = igFollowers + fbFollowers + 1000; // Mock additional offset
    const igPercent = Math.round((igFollowers / total) * 100) || 45;
    const fbPercent = Math.round((fbFollowers / total) * 100) || 35;
    const liPercent = 100 - igPercent - fbPercent;
    
    return [
      { platform: "Instagram", value: igPercent, color: "#ec4899" },
      { platform: "Facebook", value: fbPercent, color: "#3b82f6" },
      { platform: "LinkedIn", value: liPercent, color: "#fbbf24" },
    ];
  }, [displayInsights]);

  // Dynamically compute engagement growth curves based on month selection
  const engagementData = useMemo(() => {
    const baseYear = 2026;
    const baseMonth = 4; // May
    const diffMonths = (selectedYear - baseYear) * 12 + (selectedMonth - baseMonth);
    const multiplier = diffMonths > 0 ? 1 + diffMonths * 0.08 : 1;

    const baseData = [
      { name: "Lun", engagement: 460, reach: 1200 },
      { name: "Mar", engagement: 520, reach: 1390 },
      { name: "Mer", engagement: 480, reach: 1260 },
      { name: "Jeu", engagement: 620, reach: 1560 },
      { name: "Ven", engagement: 710, reach: 1720 },
      { name: "Sam", engagement: 690, reach: 1660 },
      { name: "Dim", engagement: 760, reach: 1890 },
    ];

    return baseData.map(d => ({
      name: d.name,
      engagement: Math.round(d.engagement * multiplier),
      reach: Math.round(d.reach * multiplier)
    }));
  }, [selectedMonth, selectedYear]);

  const renderDateSelector = () => {
    return (
      <div className={clsx(
        "flex items-center gap-3 border rounded-2xl p-1.5 backdrop-blur-md self-center transition-all duration-300",
        theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-slate-200"
      )}>
        <button
          onClick={handlePrevMonth}
          className={clsx(
            "p-1.5 rounded-xl transition-all",
            theme === "dark" ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-black/5 text-slate-600 hover:text-slate-900"
          )}
          title="Mois précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-1">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className={clsx(
              "bg-transparent border-0 font-bold focus:ring-0 cursor-pointer outline-none hover:text-[#D4A017] transition-colors text-sm pr-6",
              theme === "dark" ? "text-white" : "text-slate-800"
            )}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', background: 'none' }}
          >
            {monthsList.map((m, idx) => (
              <option key={m} value={idx} className={theme === "dark" ? "bg-slate-950 text-white text-sm" : "bg-white text-slate-800 text-sm"}>{m}</option>
            ))}
          </select>

          <span className="text-gray-500 font-light">/</span>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={clsx(
              "bg-transparent border-0 font-bold focus:ring-0 cursor-pointer outline-none hover:text-[#D4A017] transition-colors text-sm pr-6",
              theme === "dark" ? "text-white" : "text-slate-800"
            )}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none', background: 'none' }}
          >
            {yearsList.map(y => (
              <option key={y} value={y} className={theme === "dark" ? "bg-slate-950 text-white text-sm" : "bg-white text-slate-800 text-sm"}>{y}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextMonth}
          className={clsx(
            "p-1.5 rounded-xl transition-all",
            theme === "dark" ? "hover:bg-white/10 text-gray-300 hover:text-white" : "hover:bg-black/5 text-slate-600 hover:text-slate-900"
          )}
          title="Mois suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className={clsx("w-[1px] h-5", theme === "dark" ? "bg-white/10" : "bg-slate-200")} />

        <button
          onClick={handleGoToToday}
          className="px-2.5 py-1 bg-[#D4A017]/10 hover:bg-[#D4A017]/20 border border-[#D4A017]/30 hover:border-[#D4A017]/50 transition-all text-[11px] font-semibold rounded-lg text-[#D4A017]"
        >
          Mai '26 (Base)
        </button>
      </div>
    );
  };

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("dashboard-theme") as "light" | "dark";
      if (savedTheme) setTheme(savedTheme);

      const savedLanguage = localStorage.getItem("dashboard-language") || "Français";
      setLanguage(savedLanguage);

      const savedToken = localStorage.getItem("meta-access-token") || "";
      const savedPageId = localStorage.getItem("meta-page-id") || "";
      const savedIgId = localStorage.getItem("meta-instagram-id") || "";
      const savedGoogleSheetId = localStorage.getItem("google-sheet-id") || "";
      
      setMetaToken(savedToken);
      setMetaPageId(savedPageId);
      setMetaIgId(savedIgId);
      setGoogleSheetId(savedGoogleSheetId);

      setInputToken(savedToken);
      setInputPageId(savedPageId);
      setInputIgId(savedIgId);
      setInputSheetId(savedGoogleSheetId);

      const savedAuth = localStorage.getItem("dashboard-auth-user");
      if (savedAuth) {
        try {
          setCurrentUser(JSON.parse(savedAuth));
        } catch (e) {
          console.error("Auth Parsing Error:", e);
        }
      }
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard-theme", theme);
    }
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Group and set tasks helper
  const groupAndSetTasks = (tasks: DBTask[]) => {
    const columns: Record<string, DBTask[]> = {
      "A faire": [],
      "En cours": [],
      "Validation": [],
      "Termine": [],
      "Retard": [],
    };

    tasks.forEach((task) => {
      const colName = dbStatusToLocal(task.status);
      if (columns[colName]) {
        columns[colName].push(task);
      }
    });

    setTaskColumns(columns);
  };

  // Load tasks from Supabase on mount
  useEffect(() => {
    async function fetchTasks() {
      try {
        const { data: dbTasks, error } = await supabase
          .from("tasks")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;

        // If tasks table is empty, auto-seed with default premium brand tasks
        if (!dbTasks || dbTasks.length === 0) {
          const defaultTasks = [
            { title: "Pack stories Ramadan", status: "todo", priority: "medium" },
            { title: "Brief campagne hotel", status: "todo", priority: "high" },
            { title: "Montage reel fitness", status: "in_progress", priority: "high" },
            { title: "Reply inbox client A", status: "in_progress", priority: "urgent" },
            { title: "Visuel promo ete", status: "validation", priority: "medium" },
            { title: "Plan sponsoring Juin", status: "validation", priority: "low" },
            { title: "Rapport ROI mai", status: "done", priority: "medium" },
            { title: "Programmation semaine", status: "done", priority: "low" },
            { title: "Relance API WhatsApp", status: "overdue", priority: "urgent" },
          ];

          const { data: insertedTasks, error: insertError } = await supabase
            .from("tasks")
            .insert(defaultTasks)
            .select();

          if (insertError) throw insertError;
          
          if (insertedTasks) {
            groupAndSetTasks(insertedTasks);
          }
        } else {
          groupAndSetTasks(dbTasks);
        }
      } catch (err) {
        console.error("Error loading tasks from Supabase:", err);
      }
    }

    if (currentUser) {
      fetchTasks();
    }
  }, [currentUser]);

  // Fetch team members from Supabase (excluding admins)
  useEffect(() => {
    async function fetchTeam() {
      try {
        const { data: dbUsers, error } = await supabase
          .from("users")
          .select("*")
          .neq("role", "admin");

        if (error) throw error;
        if (dbUsers) {
          setTeamMembers(dbUsers);
        }
      } catch (err) {
        console.error("Error loading team members:", err);
      }
    }

    if (currentUser) {
      fetchTeam();
    }
  }, [currentUser]);

  // Fetch clients from Supabase on mount/login (auto-seeding if empty)
  useEffect(() => {
    async function fetchClients() {
      try {
        const { data: dbClients, error } = await supabase
          .from("clients")
          .select("*")
          .order("id", { ascending: true });

        if (error) throw error;

        // Auto-seed clients if the table is empty
        if (!dbClients || dbClients.length === 0) {
          const defaultClients = [
            { company_name: "IKSATECH Digital", contact_name: "Ahmed Al-Mansoori", email: "ahmed@iksatech.com", status: "active", notes: "Client premium" },
            { company_name: "FitLife Fitness", contact_name: "Marc Dubois", email: "contact@fitlife.fr", status: "active", notes: "Réseaux sociaux à fort volume" },
            { company_name: "Zen Hotel & Spa", contact_name: "Sophie Martin", email: "booking@zenhotel.com", status: "active", notes: "Campagnes de branding saisonnières" },
          ];

          const { data: insertedClients, error: insertError } = await supabase
            .from("clients")
            .insert(defaultClients)
            .select();

          if (insertError) throw insertError;
          
          if (insertedClients) {
            mapAndSetClients(insertedClients, []);
          }
        } else {
          // Fetch campaigns to count them dynamically
          const { data: dbCampaigns } = await supabase.from("campaigns").select("id, client_id");
          mapAndSetClients(dbClients, dbCampaigns || []);
        }
      } catch (err) {
        console.error("Error loading clients:", err);
      }
    }

    function mapAndSetClients(dbClients: any[], dbCampaigns: any[]) {
      const mapped = dbClients.map((c) => {
        const clientCampaigns = dbCampaigns.filter((camp) => camp.client_id === c.id).length;
        return {
          id: c.id,
          company: c.company_name,
          contact: c.contact_name || "Non assigné",
          email: c.email || "N/A",
          networks: "Instagram, Facebook",
          campaigns: clientCampaigns || Math.floor((c.id % 2) + 1), // Fallback default 1 or 2 campaigns for premium UI
          status: c.status === "active" || c.status === "Actif" ? "Actif" : "Inactif",
          notes: c.notes || ""
        };
      });
      setClients(mapped);
    }

    if (currentUser) {
      fetchClients();
    }
  }, [currentUser]);

  // Fetch notifications from Supabase on mount/login
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data: dbNotifs, error } = await supabase
          .from("notifications")
          .select("*")
          .order("id", { ascending: false });

        if (error) throw error;

        mapAndSetNotifications(dbNotifs || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }

    function mapAndSetNotifications(dbNotifs: any[]) {
      const mapped = dbNotifs.map((n) => {
        let localType: "Push" | "Email" | "WhatsApp" | "Interne" = "Interne";
        if (n.channel === "email") localType = "Email";
        else if (n.channel === "whatsapp") localType = "WhatsApp";
        else if (n.channel === "telegram") localType = "Push";
        else if (n.channel === "internal") localType = "Interne";

        return {
          id: n.id,
          type: localType,
          text: n.title ? `${n.title}: ${n.body}` : n.body,
          read: n.is_read,
          createdAt: n.sent_at ? "Récemment" : "Maintenant"
        };
      });
      setNotifications(mapped);
    }

    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  // Fetch active services from Supabase on mount (auto-seeding if empty)
  useEffect(() => {
    async function fetchServices() {
      try {
        const { data: dbServices, error } = await supabase
          .from("services")
          .select("*")
          .order("name", { ascending: true });

        if (error) throw error;

        if (!dbServices || dbServices.length === 0) {
          const defaultServices = [
            { name: "Transformation digital", is_active: true },
            { name: "Marketing digital", is_active: true },
            { name: "Conception de Visuels", is_active: true },
            { name: "Solutions IT", is_active: true },
            { name: "ERP & Solutions Métier", is_active: true },
            { name: "Développement Web & Mobile", is_active: true },
            { name: "Automatisation", is_active: true },
            { name: "Intelligence IA", is_active: true },
            { name: "Audit Digital Gratuit", is_active: true },
            { name: "Pack SCALE - Excellence Opérationnelle", is_active: true },
          ];

          const { data: inserted, error: insertError } = await supabase
            .from("services")
            .insert(defaultServices)
            .select();

          if (insertError) throw insertError;
          if (inserted) setServices(inserted);
        } else {
          setServices(dbServices);
        }
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    }

    if (currentUser) {
      fetchServices();
    }
  }, [currentUser]);

  // Bulletproof Database Notifications Persistence Helper
  const createNotificationInDb = async (title: string, bodyText: string, type: "Push" | "Email" | "WhatsApp" | "Interne" = "Interne") => {
    const localFallback = () => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: type,
          text: title ? `${title}: ${bodyText}` : bodyText,
          read: false,
          createdAt: "Maintenant"
        },
        ...prev
      ]);
    };

    try {
      let userId: number | null = null;
      if (currentUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", currentUser.username)
          .maybeSingle();
        if (userData) userId = userData.id;
      }

      // Map to PostgreSQL notif_type enum values
      let dbType = "new_message";
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes("workflow") || lowerTitle.includes("paramètres") || lowerTitle.includes("config") || lowerTitle.includes("meta")) {
        dbType = "workflow_executed";
      } else if (lowerTitle.includes("tâche") || lowerTitle.includes("taches") || lowerTitle.includes("task")) {
        dbType = "new_message";
      }

      // Map to PostgreSQL notif_channel enum values
      let dbChannel = "internal";
      if (type === "Push") dbChannel = "internal";
      else if (type === "Email") dbChannel = "email";
      else if (type === "WhatsApp") dbChannel = "whatsapp";

      const { data: dbNotif, error } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: userId || 1,
            title: title,
            body: bodyText,
            type: dbType,
            channel: dbChannel,
            is_read: false,
          }
        ])
        .select()
        .single();

      if (error) {
        console.warn("DB Notification enum mismatch, retrying with fallback 'new_message' type...");
        const { data: fallbackNotif, error: fallbackError } = await supabase
          .from("notifications")
          .insert([
            {
              user_id: userId || 1,
              title: title,
              body: bodyText,
              type: "new_message",
              channel: "internal",
              is_read: false,
            }
          ])
          .select()
          .single();
          
        if (fallbackError) throw fallbackError;
        
        if (fallbackNotif) {
          setNotifications((prev) => [
            {
              id: fallbackNotif.id,
              type: type,
              text: title ? `${title}: ${bodyText}` : bodyText,
              read: fallbackNotif.is_read,
              createdAt: "À l'instant"
            },
            ...prev
          ]);
        }
      } else if (dbNotif) {
        setNotifications((prev) => [
          {
            id: dbNotif.id,
            type: type,
            text: title ? `${title}: ${bodyText}` : bodyText,
            read: dbNotif.is_read,
            createdAt: "À l'instant"
          },
          ...prev
        ]);
      }
    } catch (err) {
      console.error("Supabase Notification Error:", err);
      localFallback();
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientCompany.trim()) return;

    try {
      const dbStatus = newClientStatus === "Actif" ? "active" : "inactive";

      const { data: createdClient, error } = await supabase
        .from("clients")
        .insert([
          {
            company_name: newClientCompany.trim(),
            contact_name: newClientContact.trim() || null,
            email: newClientEmail.trim() || null,
            phone: newClientPhone.trim() || null,
            industry: newClientIndustry.trim() || null,
            status: dbStatus
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (createdClient) {
        const mappedClient = {
          id: createdClient.id,
          company: createdClient.company_name,
          contact: createdClient.contact_name || "Non assigné",
          email: createdClient.email || "N/A",
          networks: "Instagram, Facebook",
          campaigns: 1, 
          status: createdClient.status === "active" || createdClient.status === "Actif" ? "Actif" : "Inactif",
          notes: createdClient.notes || ""
        };

        setClients((prev) => [...prev, mappedClient]);

        createNotificationInDb(
          "Nouveau client",
          `Le client "${createdClient.company_name}" a été ajouté à votre liste d'affaires`,
          "Interne"
        );

        setToast({
          message: language === "العربية" ? "تم إنشاء العميل بنجاح!" : language === "English" ? "Client created successfully!" : "Client créé avec succès !",
          type: "success"
        });
      }

      setIsClientModalOpen(false);
      setNewClientCompany("");
      setNewClientContact("");
      setNewClientEmail("");
      setNewClientPhone("");
      setNewClientIndustry("");
      setNewClientStatus("Actif");
    } catch (err) {
      console.error("Failed to create client in Supabase:", err);
      setToast({
        message: language === "العربية" ? "فشل في إنشاء العميل." : language === "English" ? "Failed to create client." : "Échec de la création du client.",
        type: "error"
      });
    }
  };

  // Load replies from Supabase messages table on mount/login
  useEffect(() => {
    async function fetchReplies() {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("id", { ascending: true });
        if (error) throw error;
        if (data) {
          setDbReplies(data);
        }
      } catch (err) {
        console.error("Error loading messages from Supabase:", err);
      }
    }
    if (currentUser) {
      fetchReplies();
    }
  }, [currentUser]);

  // Merge Supabase replies dynamically into the commentsList of each post
  const mergedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    return posts.map((post) => {
      if (!post.commentsList || post.commentsList.length === 0) return post;

      const mergedComments: any[] = [];
      post.commentsList.forEach((comment) => {
        mergedComments.push(comment);

        // Find replies from the database for this specific comment
        const commentReplies = dbReplies.filter(
          (r) => String(r.external_msg_id) === String(comment.id)
        );

        commentReplies.forEach((reply) => {
          const exists = post.commentsList?.some(
            (mc) => mc.text === reply.body && mc.isReply
          );
          if (!exists) {
            mergedComments.push({
              id: reply.id,
              from: reply.sender_name || (currentUser?.name || "Community Manager (Moi)"),
              text: reply.body,
              date: new Date(reply.received_at).toISOString().substring(0, 16).replace("T", " "),
              isReply: true,
            });
          }
        });
      });

      return {
        ...post,
        commentsList: mergedComments,
        comments: mergedComments.length
      };
    });
  }, [posts, dbReplies]);

  // Compute team statistics dynamically based on users and task columns state
  const dynamicTeam = useMemo(() => {
    const allTasks = Object.values(taskColumns).flat();

    return teamMembers.map((member) => {
      const memberTasks = allTasks.filter(t => t.assigned_to === member.id);
      const totalCount = memberTasks.length;
      const completedCount = memberTasks.filter(t => t.status === "done").length;

      // Default baseline performance score if no tasks are assigned
      let score = 95;
      if (totalCount > 0) {
        score = Math.round((completedCount / totalCount) * 100);
      }

      let displayRole = member.role;
      if (member.role === "community_manager") displayRole = "Community Manager";
      else if (member.role === "designer") displayRole = "Designer";
      else if (member.role === "commercial") displayRole = "Commercial";
      else if (member.role === "client") displayRole = "Client";
      else if (member.role === "manager") displayRole = "Manager";

      return {
        id: member.id,
        name: member.full_name,
        role: displayRole,
        tasks: totalCount,
        score: score,
        email: member.email,
        avatarUrl: member.avatar_url,
      };
    });
  }, [teamMembers, taskColumns]);

  // Fetch Meta Graph API Insights and Posts
  useEffect(() => {
    async function loadMeta() {
      try {
        const queryParams = new URLSearchParams();
        if (metaToken) queryParams.append("token", metaToken);
        if (metaPageId) queryParams.append("pageId", metaPageId);
        if (metaIgId) queryParams.append("igId", metaIgId);

        const url = `/api/meta-insights?${queryParams.toString()}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.error) {
          setMetaInsights(data);
          if (data.recentPosts && Array.isArray(data.recentPosts)) {
            setPosts(data.recentPosts);
          }
        }
      } catch (err) {
        console.error("Error fetching Meta insights:", err);
      }
    }
    
    async function loadCalendar() {
      try {
        const url = googleSheetId ? `/api/posts?sheetId=${googleSheetId}` : "/api/posts";
        const res = await fetch(url);
        const data = await res.json();
        if (!data.error && Array.isArray(data)) {
          setSheetPublications(data);
          // Normalize calendar posts
          const normalized = data.map((d: any) => {
             // Parse "dd/mm/yyyy hh:mm:ss" to "yyyy-mm-dd"
             let parsedDate = "N/A";
             let parsedTime = "N/A";
             if (d.PublishedAt) {
               const parts = d.PublishedAt.trim().split(" ");
               if (parts[0]) {
                 const [day, month, year] = parts[0].split("/");
                 if (day && month && year) {
                   parsedDate = `${year.trim()}-${month.trim().padStart(2, '0')}-${day.trim().padStart(2, '0')}`;
                 }
               }
               if (parts[1]) {
                 parsedTime = parts[1].trim().substring(0, 5); // "19:39"
               }
             }

             let statusText = d.Status || "Programme";
             if (statusText.includes("Published")) statusText = "Publie";
             if (statusText.includes("Refused")) statusText = "Rejete";
             if (statusText.includes("Pending")) statusText = "En attente";

             return {
               id: d.draft_id_info || Math.random(),
               title: d.Service || d.ServiceTitle || "Publication",
               platform: d.Social_Network || "Omnicanal",
               date: parsedDate,
               dateTime: parsedTime,
               status: statusText
             };
          });
          setCalendarPosts(normalized);
        }
      } catch(err) {
        console.error("Error fetching calendar posts:", err);
      }
    }

    loadMeta();
    loadCalendar();
    // Poll Meta API quietly
    const interval = setInterval(loadMeta, 30000);
    return () => clearInterval(interval);
  }, [metaToken, metaPageId, metaIgId, googleSheetId]);

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

      createNotificationInDb(
        eventText,
        "Alerte système automatique",
        eventType
      );
    }, 18000);

    return () => window.clearInterval(generator);
  }, []);

  const kpis = useMemo(() => {
    const activeCampaigns = campaignSpent > 0 ? 4 : 0;
    const unread = notifications.filter((n) => !n.read).length;

    // Growth multiplier for future dates
    const baseYear = 2026;
    const baseMonth = 4; // May
    const diffMonths = (selectedYear - baseYear) * 12 + (selectedMonth - baseMonth);
    const multiplier = diffMonths > 0 ? 1 + diffMonths * 0.07 : 1;

    const revenues = 48.2 * multiplier;
    const leadsCount = Math.round(leads.length * (diffMonths > 0 ? 1 + diffMonths * 0.1 : 1));
    const publicationsCount = posts.length + (diffMonths > 0 ? diffMonths * 8 : 0);
    const activeClientsCount = clients.filter((c) => c.status === "Actif").length + (diffMonths > 0 ? Math.floor(diffMonths * 1.5) : 0);

    return [
      { label: "Publications", value: String(publicationsCount), growth: diffMonths > 0 ? `+${14 + diffMonths * 2}%` : "+14%", icon: "📊" },
      { label: "Leads", value: String(leadsCount), growth: diffMonths > 0 ? `+${22 + diffMonths * 3}%` : "+22%", icon: "📈" },
      { label: "Clients actifs", value: String(activeClientsCount), growth: diffMonths > 0 ? `+${diffMonths * 2}` : "+6", icon: "👥" },
      { label: "Campagnes actives", value: String(activeCampaigns + (diffMonths > 0 ? Math.floor(diffMonths * 0.5) : 0)), growth: "+1", icon: "🎯" },
      { label: "Revenus générés", value: `€${revenues.toFixed(1)}K`, growth: diffMonths > 0 ? `+${18 + diffMonths * 2.5}%` : "+18%", icon: "💰" },
      { label: "Engagement", value: `${(4.2 * (diffMonths > 0 ? 1 + diffMonths * 0.02 : 1)).toFixed(1)}%`, growth: "+2.8%", icon: "💬" },
      { label: "Temps réponse", value: "2h 15m", growth: "-30m", icon: "⏱️" },
      { label: "Notif non lues", value: String(unread), growth: "live", icon: "🔔" },
    ];
  }, [campaignSpent, leads.length, notifications, posts, selectedMonth, selectedYear, clients]);

  const filteredClients = clients.filter((c) =>
    c.company.toLowerCase().includes(clientsFilter.toLowerCase()),
  );

  const runWorkflow = (id: number) => {
    setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, runs: wf.runs + 1 } : wf)));
    createNotificationInDb(
      "Workflow exécuté",
      "Le workflow a été exécuté avec succès",
      "Interne"
    );
  };

  const toggleWorkflow = (id: number) => {
    setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, active: !wf.active } : wf)));
  };

  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPubDescription.trim()) return;

    const finalService = newPubService.trim();
    if (!finalService) {
      setToast({
        message: language === "العربية" ? "الرجاء كتابة اسم الخدمة" : language === "English" ? "Please enter a service name" : "Veuillez saisir le nom du service",
        type: "error"
      });
      return;
    }

    setIsSubmittingPub(true);

    try {
      const draftId = `draft_${Date.now()}`;
      const rowNum = sheetPublications.length + 2; 
      
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const publishedAt = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      const payload = {
        Service: finalService,
        Description: newPubDescription.trim(),
        Hashtags: newPubHashtags.trim(),
        Status: newPubStatus,
        PublishedAt: "",
        row_number: rowNum,
        draft_id_info: "",
      };

      const res = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          action: "publish_to_sheet" 
        }),
      });

      const result = await res.json();

      if (result.success) {
        setSheetPublications((prev) => [payload, ...prev]);

        const parsedDate = `${year}-${month}-${day}`;
        const parsedTime = `${hours}:${minutes}`;
        let statusText = newPubStatus;
        if (statusText.includes("Published")) statusText = "Publie";
        if (statusText.includes("Refused")) statusText = "Rejete";
        if (statusText.includes("Pending")) statusText = "En attente";

        setCalendarPosts((prev) => [
          {
            id: draftId,
            title: finalService,
            platform: "Omnicanal",
            date: parsedDate,
            dateTime: parsedTime,
            status: statusText
          },
          ...prev
        ]);

        createNotificationInDb(
          "Publication créée",
          `La publication pour "${finalService}" a été ajoutée à Google Sheet (Statut: ${newPubStatus})`,
          "Interne"
        );

        setToast({
          message: language === "العربية" ? "تم نشر المنشور في Google Sheet!" : language === "English" ? "Published to Google Sheet!" : "Publié avec succès sur Google Sheet !",
          type: "success"
        });
      } else {
        throw new Error(result.error || "Failed to trigger sheet publication");
      }

      setNewPubService("");
      setNewPubDescription("");
      setNewPubHashtags("");
    } catch (err: any) {
      console.error("Failed to create publication:", err);
      setToast({
        message: `Erreur: ${err.message || "Échec de création"}`,
        type: "error"
      });
    } finally {
      setIsSubmittingPub(false);
    }
  };

  const handleUpdateStatus = async (rowNum: number, newStatus: string, currentPub: any) => {
    // 1. Compute updated fields based on status
    let updatedDraftId = currentPub.draft_id_info || "";
    let updatedPublishedAt = currentPub.PublishedAt || "";

    if (newStatus.includes("Pending") || newStatus.includes("⏳")) {
      updatedDraftId = "";
      updatedPublishedAt = "";
    } else if (newStatus.includes("Published") || newStatus.includes("✅")) {
      // If transitioning to Published and it does not have a timestamp, set one
      if (!updatedPublishedAt) {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        updatedPublishedAt = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      }
    }

    // 2. Optimistically update local states (sheetPublications & calendarPosts)
    setSheetPublications((prev) =>
      prev.map((pub) => {
        const targetRow = pub.row_number || (prev.indexOf(pub) + 2);
        if (targetRow === rowNum) {
          return {
            ...pub,
            Status: newStatus,
            draft_id_info: updatedDraftId,
            PublishedAt: updatedPublishedAt,
          };
        }
        return pub;
      })
    );

    // Sync to editorial calendar
    setCalendarPosts((prev) =>
      prev.map((post) => {
        // If there's a draft ID match or title/service match
        if (
          (currentPub.draft_id_info && String(post.id) === String(currentPub.draft_id_info)) ||
          post.title === (currentPub.Service || currentPub.ServiceTitle)
        ) {
          let parsedDate = "N/A";
          let parsedTime = "N/A";
          if (updatedPublishedAt) {
            const parts = updatedPublishedAt.trim().split(" ");
            if (parts[0]) {
              const [day, month, year] = parts[0].split("/");
              if (day && month && year) {
                parsedDate = `${year.trim()}-${month.trim().padStart(2, '0')}-${day.trim().padStart(2, '0')}`;
              }
            }
            if (parts[1]) {
              parsedTime = parts[1].trim().substring(0, 5);
            }
          }

          let statusText = newStatus;
          if (statusText.includes("Published")) statusText = "Publie";
          if (statusText.includes("Refused")) statusText = "Rejete";
          if (statusText.includes("Pending")) statusText = "En attente";

          return {
            ...post,
            id: updatedDraftId || post.id,
            date: parsedDate,
            dateTime: parsedTime,
            status: statusText,
          };
        }
        return post;
      })
    );

    // 3. Post the update row action to our workflow trigger API
    try {
      const res = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Service: currentPub.Service || currentPub.ServiceTitle || "",
          Description: currentPub.Description || "",
          Hashtags: currentPub.Hashtags || "",
          Status: newStatus,
          PublishedAt: updatedPublishedAt,
          row_number: rowNum,
          draft_id_info: updatedDraftId,
          action: "update_row",
        }),
      });

      const result = await res.json();
      if (result.success) {
        setToast({
          message: language === "العربية" ? "تم تحديث حالة الخدمة بنجاح!" : language === "English" ? "Service status updated successfully!" : "Statut du service mis à jour avec succès !",
          type: "success",
        });

        createNotificationInDb(
          "Statut mis à jour",
          `Le statut de "${currentPub.Service || currentPub.ServiceTitle}" a été mis à jour à "${newStatus}"`,
          "Interne"
        );
      } else {
        throw new Error(result.error || "Failed to update row");
      }
    } catch (err: any) {
      console.error("Failed to update publication status:", err);
      setToast({
        message: `Erreur: ${err.message || "Échec de mise à jour"}`,
        type: "error",
      });
    }
  };

  const onTaskDrop = async (toColumn: string) => {
    if (!draggedTask || draggedTask.from === toColumn) {
      setDraggedTask(null);
      return;
    }

    const { task, from } = draggedTask;
    const newDbStatus = localStatusToDb(toColumn);

    // Optimistically update the UI to keep it zero-latency
    setTaskColumns((prev) => {
      const sourceItems = prev[from].filter((item) => item.id !== task.id);
      const updatedTask = { ...task, status: newDbStatus };
      const targetItems = [updatedTask, ...prev[toColumn]];

      return {
        ...prev,
        [from]: sourceItems,
        [toColumn]: targetItems,
      };
    });
    setDraggedTask(null);

    // Persist in background database
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newDbStatus })
        .eq("id", task.id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to update task status in Supabase:", err);
      setToast({
        message: language === "العربية" 
          ? "فشل تحديث حالة المهمة." 
          : language === "English" 
          ? "Failed to update task status." 
          : "Échec de la mise à jour de la tâche.",
        type: "error"
      });
      // Fallback: reload tasks from db to restore correct state
      try {
        const { data: dbTasks } = await supabase.from("tasks").select("*").order("id", { ascending: true });
        if (dbTasks) groupAndSetTasks(dbTasks);
      } catch (reloadErr) {
        console.error("Reload error after drop failure:", reloadErr);
      }
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    let deletedTask: DBTask | null = null;
    let targetColumn = "";
    
    const updatedColumns = { ...taskColumns };
    for (const col of Object.keys(updatedColumns)) {
      const idx = updatedColumns[col].findIndex(t => t.id === taskId);
      if (idx !== -1) {
        deletedTask = updatedColumns[col][idx];
        targetColumn = col;
        updatedColumns[col] = updatedColumns[col].filter(t => t.id !== taskId);
        break;
      }
    }
    
    if (!deletedTask) return;
    
    // Optimistic UI update
    setTaskColumns(updatedColumns);
    
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
        
      if (error) throw error;
      
      setToast({
        message: language === "العربية" ? "تم حذف المهمة بنجاح!" : language === "English" ? "Task deleted successfully!" : "Tâche supprimée avec succès !",
        type: "success"
      });
    } catch (err) {
      console.error("Error deleting task from Supabase:", err);
      // Revert optimistic update
      const revertedColumns = { ...taskColumns };
      if (deletedTask && targetColumn) {
        revertedColumns[targetColumn] = [...revertedColumns[targetColumn], deletedTask].sort((a, b) => a.id - b.id);
        setTaskColumns(revertedColumns);
      }
      
      setToast({
        message: language === "العربية" ? "فشل حذف المهمة." : language === "English" ? "Failed to delete task." : "Échec de la suppression de la tâche.",
        type: "error"
      });
    }
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

  const handleSendCommentReply = async (commentId: string, messageText: string, platform: string) => {
    if (!messageText.trim()) return;
    setIsPostingReply(true);
    try {
      const res = await fetch("/api/meta-comments/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          message: messageText,
          platform,
          token: metaToken,
          pageId: metaPageId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prevPosts) => {
          return prevPosts.map((post) => {
            const comments = post.commentsList || [];
            const commentExists = comments.some((c: any) => c.id === commentId);
            if (commentExists) {
              const newReply = {
                id: data.id || `reply_${Date.now()}`,
                from: currentUser?.name || "Community Manager (Moi)",
                text: messageText,
                date: new Date().toISOString().substring(0, 16).replace("T", " "),
                isReply: true,
              };
              return {
                ...post,
                commentsList: [...comments, newReply],
                comments: (post.comments || 0) + 1,
              };
            }
            return post;
          });
        });

        // Persist comment reply in Supabase messages table
        try {
          const { data: newDbMsg, error: dbMsgErr } = await supabase.from("messages").insert([
            {
              platform: platform,
              body: messageText,
              sender_name: currentUser?.name || "Community Manager (Moi)",
              sender_id: currentUser?.username || "admin",
              is_read: true,
              external_msg_id: commentId,
              received_at: new Date().toISOString()
            }
          ]).select().single();
          
          if (dbMsgErr) throw dbMsgErr;
          
          if (newDbMsg) {
            setDbReplies(prev => [...prev, newDbMsg]);
          }
        } catch (dbMsgErr) {
          console.error("Failed to save message in Supabase:", dbMsgErr);
        }

        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "Interne",
            text: `Réponse publiée sur ${platform}: "${messageText.substring(0, 25)}..."`,
            read: false,
            createdAt: "Maintenant",
          },
          ...prev,
        ]);

        setToast({
          message: data.isSimulated
            ? "Réponse publiée (Simulation locale)"
            : "Réponse publiée avec succès sur Meta Graph !",
          type: "success",
        });
        setTimeout(() => setToast(null), 4000);

        setCommentReplyText("");
        setSelectedComment(null);
      } else {
        setToast({
          message: `Erreur: ${data.error || "Impossible d'envoyer la réponse"}`,
          type: "error",
        });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (err: any) {
      console.error("Error sending reply:", err);
      setToast({
        message: `Erreur réseau: ${err.message || "Erreur de connexion"}`,
        type: "error",
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsPostingReply(false);
    }
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

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      let userId: number | null = null;
      if (currentUser) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("email", currentUser.username)
          .maybeSingle();
        if (userData) userId = userData.id;
      }
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId || 1)
        .eq("is_read", false);
    } catch (err) {
      console.error("Failed to mark notifications as read in Supabase:", err);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("meta-access-token", inputToken.trim());
      localStorage.setItem("meta-page-id", inputPageId.trim());
      localStorage.setItem("meta-instagram-id", inputIgId.trim());
      localStorage.setItem("google-sheet-id", inputSheetId.trim());

      setMetaToken(inputToken.trim());
      setMetaPageId(inputPageId.trim());
      setMetaIgId(inputIgId.trim());
      setGoogleSheetId(inputSheetId.trim());

      createNotificationInDb(
        "Configuration sauvegardée",
        "Identifiants API mis à jour et sauvegardés !",
        "Interne"
      );
    }
  };

  const renderModule = () => {
    if (activeModule === "Dashboard") {
      return (
        <PageTransition moduleKey="dashboard">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#071225]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-bold text-white">Visualisation des Insights</h3>
                <p className="text-xs text-gray-400 mt-1">Sélectionnez la période pour filtrer vos indicateurs de performance</p>
              </div>
              {renderDateSelector()}
            </div>

            <GlassCard>
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h3 className="text-lg font-bold text-white">Post Insights {displayInsights?.isForecast ? "(Prévisions de Croissance)" : "(Live from Meta API)"}</h3>
                {displayInsights?.isForecast && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300 shadow-lg shadow-amber-500/10">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mode Prévisionnel Actif
                  </span>
                )}
              </div>
              {displayInsights ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-center">
                    <p className="text-xs text-blue-300 font-semibold mb-1">Facebook Followers</p>
                    <p className="text-3xl font-bold text-white">{displayInsights.facebook.followers.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 text-center">
                    <p className="text-xs text-blue-300 font-semibold mb-1">Facebook Likes</p>
                    <p className="text-3xl font-bold text-white">{displayInsights.facebook.likes.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-pink-500/10 border border-pink-500/30 p-4 text-center">
                    <p className="text-xs text-pink-300 font-semibold mb-1">Instagram Followers</p>
                    <p className="text-3xl font-bold text-white">{displayInsights.instagram.followers.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg bg-pink-500/10 border border-pink-500/30 p-4 text-center">
                    <p className="text-xs text-pink-300 font-semibold mb-1">Instagram Posts</p>
                    <p className="text-3xl font-bold text-white">{displayInsights.instagram.posts.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 opacity-50 font-mono text-sm">
                  Loading Meta API Insights...
                </div>
              )}
            </GlassCard>

            <GlassCard>
              <h3 className="text-lg font-bold text-white mb-4">{t("metrics_title", "Métriques réseaux sociaux")}</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-4">
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">{t("likes", "Likes")}</p>
                  <p className="mt-1 text-lg font-bold text-pink-400">
                    {displayInsights?.metrics?.totalLikes?.toLocaleString() ?? "0"}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">{t("comments", "Commentaires")}</p>
                  <p className="mt-1 text-lg font-bold text-blue-400">
                    {displayInsights?.metrics?.totalComments?.toLocaleString() ?? "0"}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">{t("shares", "Partages")}</p>
                  <p className="mt-1 text-lg font-bold text-green-400">
                    {displayInsights?.metrics?.totalShares?.toLocaleString() ?? "0"}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-xs text-gray-400">{t("reach", "Portée")}</p>
                  <p className="mt-1 text-lg font-bold text-purple-400">
                    {displayInsights?.metrics?.totalReach?.toLocaleString() ?? "0"}
                  </p>
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
                <ul className="space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Tâches terminées: 18/20</li>
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Temps traitement: 2h 45m</li>
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" /> Productivité: +8%</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Deadlines respectées: 95%</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Performance campagnes</h4>
                <ul className="space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> ROI moyen: 245%</li>
                  <li className="flex items-center gap-2"><ChartLine className="w-4 h-4 text-blue-400" /> Conversions: 312</li>
                  <li className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-yellow-400" /> Coût par Lead: 47 MAD</li>
                  <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#D4A017]" /> Meilleure plateforme: Meta</li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Audience</h4>
                <ul className="space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Abonnés gagnés: +1.2K</li>
                  <li className="flex items-center gap-2"><Eye className="w-4 h-4 text-pink-400" /> Impressions: 48K</li>
                  <li className="flex items-center gap-2"><Share2 className="w-4 h-4 text-purple-400" /> Clics sortants: 2.1K</li>
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Taux de croissance: +18%</li>
                </ul>
              </GlassCard>
            </div>
          </div>
        </PageTransition>
      );
    }

    if (activeModule === "Publications") {
      const filteredPosts = posts.filter(p => {
        if (publicationsFilter === "All") return true;
        return p.platform === publicationsFilter;
      });

      return (
        <PageTransition moduleKey="publications">
          <div className="grid gap-6 xl:grid-cols-[1fr_3fr]">
            <div className="space-y-6">
              <GlassCard>
                <h3 className="text-lg font-bold text-white">🚀 n8n Workflow Control</h3>
                <div className="mt-4 space-y-4">
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                    <p className="text-sm text-blue-200 font-medium mb-3">Generate AI-Powered Content Instantly</p>
                    <GenerateButton />
                  </div>
                </div>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white mb-3">Statut des API</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-1.5">🔵 Facebook Graph</span>
                    {metaInsights?.facebook && !metaInsights.facebook.isFallback ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">🟢 Connecté (Réel)</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">Simulé (Fallback)</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-1.5">💖 Instagram Graph</span>
                    {metaInsights?.instagram && !metaInsights.instagram.isFallback ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">🟢 Connecté (Réel)</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">Simulé (Fallback)</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-gray-300 opacity-60">
                    <span className="flex items-center gap-1.5">💼 LinkedIn API</span>
                    <span className="text-amber-400 font-semibold">Non Connecté</span>
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="flex flex-col h-[calc(100vh-200px)] overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Publications Réseaux Sociaux</h3>
                  <p className="text-xs text-gray-400 mt-1">Gérez et suivez vos publications en temps réel (Meta Graph API)</p>
                </div>
                
                {/* Visual tabs filter */}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button
                    onClick={() => setPublicationsFilter("All")}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                      publicationsFilter === "All" 
                        ? "bg-[#D4A017] text-slate-950 shadow-md"
                        : "text-gray-300 hover:text-white"
                    )}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setPublicationsFilter("Facebook")}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1",
                      publicationsFilter === "Facebook" 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-gray-300 hover:text-white"
                    )}
                  >
                    <Globe className="w-3.5 h-3.5" /> Facebook
                  </button>
                  <button
                    onClick={() => setPublicationsFilter("Instagram")}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1",
                      publicationsFilter === "Instagram" 
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/20"
                        : "text-gray-300 hover:text-white"
                    )}
                  >
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </button>
                </div>
              </div>

              {/* Grid content list */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-6">
                {filteredPosts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPosts.map((post) => {
                      const isFB = post.platform === "Facebook";
                      return (
                        <motion.div
                          key={post.id}
                          layout
                          className="group relative rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] overflow-hidden hover:border-[#D4A017]/30 hover:shadow-lg hover:shadow-[#D4A017]/5 transition-all duration-300 flex flex-col h-[400px]"
                        >
                          {/* Image visual wrapper */}
                          <div className="h-44 w-full relative overflow-hidden bg-slate-950 border-b border-white/10">
                            {post.image ? (
                              <img
                                src={post.image}
                                alt="Visual Post"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
                                <Megaphone className="w-12 h-12 text-white/20" />
                              </div>
                            )}
                            {/* Platform badge */}
                            <span className={clsx(
                              "absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-lg",
                              isFB 
                                ? "bg-blue-600/90 text-white border border-blue-400/30"
                                : "bg-gradient-to-r from-pink-600 to-purple-600 text-white border border-pink-400/30"
                            )}>
                              {isFB ? <Globe className="w-3 h-3" /> : <Instagram className="w-3 h-3" />} {post.platform}
                            </span>
                          </div>

                          {/* Post details */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-2 font-medium">
                                <CalendarDays className="w-3.5 h-3.5" />
                                {post.date} à {post.dateTime || "14:00"}
                              </p>
                              <p className="text-xs text-gray-200 line-clamp-4 leading-relaxed font-normal whitespace-pre-wrap">
                                {post.title}
                              </p>
                            </div>

                            {/* Rich metrics details */}
                            <div className="border-t border-white/5 pt-3 mt-3">
                              {isFB ? (
                                <div className="grid grid-cols-4 gap-2 text-center">
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Vues</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><Eye className="w-3 h-3 text-blue-400" /> {post.views ?? 0}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Abonnés</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> +{post.netFollows ?? 0}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Imp.</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><BarChart3 className="w-3 h-3 text-purple-400" /> {post.impressions ?? 0}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Likes</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><Heart className="w-3 h-3 text-rose-400" /> {post.likes ?? 0}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Likes</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><Heart className="w-3 h-3 text-pink-500" /> {post.likes ?? 0}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Comms</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3 text-pink-400" /> {post.comments ?? 0}</p>
                                  </div>
                                  <div className="bg-white/5 rounded-lg p-1.5 border border-white/5">
                                    <p className="text-[9px] text-gray-400 uppercase font-semibold">Eng.</p>
                                    <p className="text-xs font-bold text-white mt-0.5 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3 text-purple-400" /> {((((post.likes ?? 0) + (post.comments ?? 0)) / 1245) * 100).toFixed(1)}%</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <Megaphone className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-40" />
                    <p className="text-sm text-gray-400">Aucune publication trouvée dans cette catégorie.</p>
                  </div>
                )}
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Calendrier Éditorial</h3>
                <p className="mt-1 text-xs text-gray-400">Vue mensuelle des publications programmées (Google Sheets)</p>
              </div>
              {renderDateSelector()}
            </div>

            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-semibold text-[#D4A017] uppercase tracking-wider">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>

            {/* Calendar dynamic weekly grid */}
            <div className="grid grid-cols-7 gap-2 custom-scrollbar max-h-[calc(100vh-290px)] overflow-y-auto pb-4">
              {calendarCells.map((cell, idx) => {
                if (!cell.dayNum) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className={clsx(
                        "min-h-[110px] rounded-xl border border-dashed opacity-20",
                        theme === "dark" ? "border-white/5 bg-white/[0.01]" : "border-slate-300 bg-slate-100"
                      )} 
                    />
                  );
                }

                const events = calendarPosts.filter((p) => p.date === cell.dateString);
                
                return (
                  <div 
                    key={cell.dayNum} 
                    className={clsx(
                      "min-h-[110px] rounded-xl border p-2 flex flex-col transition-all duration-200",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                        : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                       <p className={clsx("text-xs font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>{cell.dayNum}</p>
                       {events.length > 0 && (
                         <span className="text-[9px] font-bold bg-[#D4A017]/20 text-[#D4A017] border border-[#D4A017]/30 px-1.5 py-0.5 rounded-full">
                           {events.length}
                         </span>
                       )}
                    </div>
                    
                    <div className="mt-1 space-y-1.5 flex-1 overflow-y-auto max-h-[70px] scrollbar-none">
                      {events.map((event) => {
                        const isPub = event.status.includes("Publie");
                        const isRej = event.status.includes("Rejete");
                        return (
                          <div 
                            key={event.id} 
                            className={clsx(
                              "rounded p-1 text-[9px] flex flex-col gap-0.5 border transition-all hover:scale-[1.02]",
                              isPub 
                                ? theme === "dark"
                                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 text-[8px]" 
                                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 text-[8px]"
                                : isRej
                                  ? theme === "dark"
                                    ? "bg-red-500/10 border-red-500/20 text-red-300 text-[8px]"
                                    : "bg-red-500/15 border-red-500/30 text-red-700 text-[8px]"
                                  : theme === "dark"
                                    ? "bg-[#D4A017]/10 border-[#D4A017]/20 text-[#D4A017] text-[8px]"
                                    : "bg-[#D4A017]/15 border-[#D4A017]/30 text-[#b07b12] text-[8px]"
                            )}
                          >
                            <span className="font-semibold truncate">{event.title}</span>
                            <span className="opacity-80 flex items-center gap-0.5 text-[8px]"><Clock className="w-2.5 h-2.5" /> {event.dateTime}</span>
                          </div>
                        );
                      })}
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
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    value={clientsFilter}
                    onChange={(e) => setClientsFilter(e.target.value)}
                    placeholder="Rechercher client..."
                    className={clsx(
                      "rounded-xl border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-400 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                  <GlassBtn
                    onClick={() => setIsClientModalOpen(true)}
                    variant="primary"
                    size="sm"
                    className="flex items-center gap-1.5 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    {language === "العربية" ? "عميل جديد" : language === "English" ? "New Client" : "Nouveau client"}
                  </GlassBtn>
                </div>
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



    if (activeModule === "Add Publication") {
      return (
        <PageTransition moduleKey="workflows">
          <div className="space-y-6">
            {/* Top row: Add Form (Full Width) */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Form panel */}
              <div className="lg:col-span-12">
                <GlassCard>
                  <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                    <Megaphone className="w-5 h-5 text-[#D4A017]" />
                    <h3 className={clsx("text-base font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>
                      {language === "العربية" ? "إضافة منشور إلى Google Sheet" : language === "English" ? "Add Publication to Google Sheet" : "Ajouter une Publication à Google Sheet"}
                    </h3>
                  </div>

                  <form onSubmit={handleCreatePublication} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={clsx(
                          "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                          theme === "dark" ? "text-gray-400" : "text-slate-500"
                        )}>
                          Service *
                        </label>
                        <input
                          type="text"
                          required
                          value={newPubService}
                          onChange={(e) => setNewPubService(e.target.value)}
                          placeholder={language === "العربية" ? "أدخل اسم الخدمة..." : language === "English" ? "Enter service name..." : "Saisissez le nom du service..."}
                          className={clsx(
                            "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                            theme === "dark"
                              ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                              : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                          )}
                        />
                      </div>

                      <div>
                        <label className={clsx(
                          "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                          theme === "dark" ? "text-gray-400" : "text-slate-500"
                        )}>
                          Statut *
                        </label>
                        <select
                          value={newPubStatus}
                          onChange={(e) => setNewPubStatus(e.target.value)}
                          className={clsx(
                            "w-full rounded-xl border px-3 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50 cursor-pointer",
                            theme === "dark"
                              ? "border-white/10 bg-[#071225] text-white focus:bg-[#091730]"
                              : "border-slate-200 bg-slate-50 text-slate-800 focus:bg-white"
                          )}
                        >
                          <option value="Published">Published ✅</option>
                          <option value="Refused">Refused ❌</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                    </div>



                    <div>
                      <label className={clsx(
                        "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                        theme === "dark" ? "text-gray-400" : "text-slate-500"
                      )}>
                        Hashtags
                      </label>
                      <input
                        type="text"
                        value={newPubHashtags}
                        onChange={(e) => setNewPubHashtags(e.target.value)}
                        placeholder="Ex: #Audit #TransformationDigitale #KSATECH"
                        className={clsx(
                          "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                          theme === "dark"
                            ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                            : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                        )}
                      />
                    </div>

                    <div>
                      <label className={clsx(
                        "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                        theme === "dark" ? "text-gray-400" : "text-slate-500"
                      )}>
                        Description *
                      </label>
                      <textarea
                        required
                        value={newPubDescription}
                        onChange={(e) => setNewPubDescription(e.target.value)}
                        placeholder="Saisissez la description de la publication..."
                        rows={3}
                        className={clsx(
                          "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50 resize-none",
                          theme === "dark"
                            ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                            : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                        )}
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <GlassBtn 
                        variant="primary" 
                        size="md" 
                        loading={isSubmittingPub}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#D4A017] to-[#B07B12] text-slate-950 font-bold shadow-lg shadow-[#D4A017]/10 flex items-center gap-1.5"
                      >
                        <Database className="w-4 h-4 text-slate-950" />
                        {language === "العربية" ? "نشر في Google Sheet" : language === "English" ? "Publish to Google Sheet" : "Publier sur Google Sheet"}
                      </GlassBtn>
                    </div>
                  </form>
                </GlassCard>
              </div>
            </div>

            {/* Bottom row: Google Sheet Data Table */}
            <GlassCard>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className={clsx("text-base font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>
                      Données Google Sheet (Tab: page of informations)
                    </h3>
                    <p className={clsx("text-[10px] mt-0.5", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                      Flux synchronisé en temps réel depuis votre feuille Google Spreadsheet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={clsx("text-[10px] font-semibold", theme === "dark" ? "text-gray-300" : "text-slate-600")}>
                    {sheetPublications.length} lignes chargées
                  </span>
                </div>
              </div>

              {sheetPublications.length === 0 ? (
                <div className="text-center py-16">
                  <Database className="w-10 h-10 text-gray-500 mx-auto mb-2 animate-bounce" />
                  <p className={clsx("text-xs font-semibold", theme === "dark" ? "text-gray-400" : "text-slate-600")}>
                    Aucune donnée disponible
                  </p>
                  <p className={clsx("text-[10px] mt-1", theme === "dark" ? "text-gray-500" : "text-slate-500")}>
                    Assurez-vous que le sheetId est bien configuré et contient des publications.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={clsx(
                        "border-b border-white/10 font-semibold select-none",
                        theme === "dark" ? "bg-white/3 text-gray-300" : "bg-slate-50 text-slate-700"
                      )}>
                        <th className="p-3 text-center w-12">Ligne</th>
                        <th className="p-3">Service</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Hashtags</th>
                        <th className="p-3 text-center">Statut</th>
                        <th className="p-3">Publié le</th>
                        <th className="p-3">Draft ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sheetPublications.map((pub, idx) => {
                        const isRefused = String(pub.Status).includes("Refused") || String(pub.Status).includes("❌");
                        const isPending = String(pub.Status).includes("Pending") || String(pub.Status).includes("⏳");
                        const selectValue = isRefused ? "Refused ❌" : isPending ? "Pending ⏳" : "Published ✅";
                        return (
                          <tr 
                            key={pub.draft_id_info || idx} 
                            className={clsx(
                              "transition-colors duration-150",
                              theme === "dark" 
                                ? "text-gray-300 hover:bg-white/5" 
                                : "text-slate-700 hover:bg-slate-50"
                            )}
                          >
                            <td className="p-3 text-center font-bold text-gray-500">
                              {pub.row_number || idx + 2}
                            </td>
                            <td className={clsx("p-3 font-semibold", theme === "dark" ? "text-white" : "text-slate-900")}>
                              {pub.Service || pub.ServiceTitle || "Publication"}
                            </td>
                            <td className="p-3 max-w-xs truncate" title={pub.Description || ""}>
                              {pub.Description || "—"}
                            </td>
                            <td className="p-3 text-[#D4A017] italic">
                              {pub.Hashtags || "—"}
                            </td>
                            <td className="p-3 text-center">
                              <select
                                value={selectValue}
                                onChange={(e) => handleUpdateStatus(pub.row_number || idx + 2, e.target.value, pub)}
                                className={clsx(
                                  "rounded-xl border px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50 select-none",
                                  isRefused
                                    ? "border-red-500/20 bg-red-500/10 text-red-500 focus:bg-red-500/20"
                                    : isPending
                                    ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-500 focus:bg-yellow-500/20"
                                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 focus:bg-emerald-500/20"
                                )}
                              >
                                <option value="Published ✅" className={theme === "dark" ? "bg-[#071225] text-emerald-500 font-bold" : "bg-white text-emerald-500 font-bold"}>Published ✅</option>
                                <option value="Refused ❌" className={theme === "dark" ? "bg-[#071225] text-red-500 font-bold" : "bg-white text-red-500 font-bold"}>Refused ❌</option>
                                <option value="Pending ⏳" className={theme === "dark" ? "bg-[#071225] text-yellow-500 font-bold" : "bg-white text-yellow-500 font-bold"}>Pending ⏳</option>
                              </select>
                            </td>
                            <td className="p-3 text-gray-500">
                              {pub.PublishedAt || "—"}
                            </td>
                            <td className="p-3 font-mono text-[10px] text-gray-400">
                              {pub.draft_id_info || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </div>
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
                <GlassBtn variant="primary" size="sm" onClick={() => {
                  setNewTaskTitle("");
                  setNewTaskColumn("A faire");
                  setNewTaskPriority("Normale");
                  setIsTaskModalOpen(true);
                }} className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Nouvelle tâche
                </GlassBtn>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {Object.entries(taskColumns).map(([column, tasks]) => (
                  <motion.div
                    key={column}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onTaskDrop(column)}
                    className={clsx(
                      "rounded-lg p-3 min-h-96 transition-all duration-300 border",
                      theme === "dark"
                        ? "bg-gradient-to-b from-white/8 to-white/3 border-white/10"
                        : "bg-slate-100/60 border-slate-200"
                    )}
                  >
                    <p className={clsx(
                      "mb-3 text-sm font-bold transition-colors duration-300",
                      theme === "dark" ? "text-white" : "text-slate-800"
                    )}>{column}</p>
                    <div className="space-y-2">
                      {tasks.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-xs text-gray-400">Aucune tâche</p>
                          <p className="text-[10px] text-gray-500 mt-1">Glissez une tâche ici</p>
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <motion.div
                            key={task.id}
                            draggable
                            onDragStart={() => setDraggedTask({ task, from: column })}
                            layout
                            className={clsx(
                              "cursor-grab active:cursor-grabbing rounded-lg p-2.5 text-xs transition border font-medium flex items-center justify-between group",
                              theme === "dark"
                                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-white/10 text-gray-200 hover:border-white/20"
                                : "bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm"
                            )}
                          >
                            <span className="truncate pr-1">
                              {dbPriorityToEmoji(task.priority)} {task.title}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskDelete(task.id);
                              }}
                              className="text-red-400 hover:text-red-600 transition p-0.5 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 ml-1 flex-shrink-0"
                              title="Supprimer la tâche"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
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
                <ul className="mt-3 space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2 font-medium text-red-400">
                    <AlertCircle className="w-4 h-4 text-red-500" /> Critique
                  </li>
                  <li className="flex items-center gap-2 font-medium text-amber-400">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Haute
                  </li>
                  <li className="flex items-center gap-2 font-medium text-yellow-400">
                    <ArrowRightCircle className="w-4 h-4 text-yellow-500" /> Normale
                  </li>
                  <li className="flex items-center gap-2 font-medium text-emerald-400">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-500" /> Basse
                  </li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white">Statuts</h4>
                <ul className="mt-3 space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-blue-400" /> À faire
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> En cours
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Validation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" /> Terminé
                  </li>
                </ul>
              </GlassCard>

              <GlassCard>
                <h4 className="text-sm font-bold text-white">Assignations & Suivi</h4>
                <ul className="mt-3 space-y-2.5 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4A017]" /> Auto-assign par rôle
                  </li>
                  <li className="flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-blue-400" /> Attribution manuelle
                  </li>
                  <li className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-pink-400" /> Notifications live
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" /> Suivi du temps réel
                  </li>
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
            <h3 className={clsx(
              "text-lg font-bold transition-colors duration-300",
              theme === "dark" ? "text-white" : "text-slate-800"
            )}>
              {t("team_performance", "Performance équipe")}
            </h3>
            <div className="mt-4 space-y-3">
              {dynamicTeam.length === 0 ? (
                <div className={clsx(
                  "text-center py-12 px-4 border border-dashed rounded-xl transition duration-300",
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-black/5"
                )}>
                  <Users className="w-10 h-10 text-[#D4A017] mx-auto mb-3 animate-pulse" />
                  <p className={clsx("text-sm font-semibold", theme === "dark" ? "text-white" : "text-slate-800")}>
                    {language === "العربية" ? "لا يوجد أعضاء في الفريق حالياً" : language === "English" ? "No team members found" : "Aucun membre de l'équipe"}
                  </p>
                  <p className={clsx("text-xs mt-1.5 max-w-md mx-auto", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                    {language === "العربية" 
                      ? "قم بتسجيل حساب جديد بدور (Community Manager, Manager, Designer...) عبر بوابة التسجيل للظهور هنا."
                      : language === "English"
                      ? "Register new accounts with team roles (Community Manager, Manager, Designer...) via the portal to see them here."
                      : "Enregistrez de nouveaux comptes avec des rôles d'équipe (Community Manager, Manager, Designer...) via le portail d'inscription pour les afficher ici."}
                  </p>
                </div>
              ) : (
                dynamicTeam.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={clsx(
                      "flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 transition duration-300",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 hover:bg-white/8 text-white"
                        : "border-slate-200 bg-black/5 hover:bg-black/10 text-slate-800 shadow-sm"
                    )}
                  >
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className={clsx("text-sm mt-0.5", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                        {member.role} • {member.tasks} {member.tasks > 1 ? "tâches" : "tâche"} • {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={clsx("text-xs font-mono opacity-65", theme === "dark" ? "text-gray-400" : "text-slate-500")}>Performance</span>
                      <div className="rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 px-3 py-1 text-xs font-bold text-orange-300 border border-orange-500/20 shadow-md">
                        {member.score}%
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </GlassCard>
        </PageTransition>
      );
    }

    if (activeModule === "Messages") {
      const filteredPosts = mergedPosts.filter((post) => {
        const matchesPlatform =
          messagesPlatformFilter === "All" ||
          post.platform.toLowerCase() === messagesPlatformFilter.toLowerCase();
        const matchesSearch =
          post.title.toLowerCase().includes(messagesSearchQuery.toLowerCase()) ||
          (post.platform || "").toLowerCase().includes(messagesSearchQuery.toLowerCase());
        return matchesPlatform && matchesSearch;
      });

      const currentSelectedPost = mergedPosts.find((p) => String(p.id) === String(selectedPostId)) || filteredPosts[0];

      return (
        <PageTransition moduleKey="messages">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Left Pane - Publications List */}
            <GlassCard className="flex flex-col h-[calc(100vh-210px)] overflow-hidden !p-4" hover={false}>
              <div className="mb-4">
                <h3 className={clsx(
                  "text-lg font-bold flex items-center gap-2",
                  theme === "dark" ? "text-white" : "text-slate-800"
                )}>
                  <MessageSquare className="w-5 h-5 text-[#D4A017]" />
                  Publications & Flux API
                </h3>
                <p className={clsx(
                  "text-xs mt-0.5",
                  theme === "dark" ? "text-gray-400" : "text-slate-500"
                )}>
                  Gérez les commentaires et répondez en direct
                </p>
              </div>

              {/* Search & Filters */}
              <div className="space-y-2 mb-3">
                <div className={clsx(
                  "relative flex items-center rounded-xl border px-3 py-1.5 transition-all",
                  theme === "dark"
                    ? "border-white/10 bg-white/5 focus-within:border-[#D4A017]/50"
                    : "border-slate-200 bg-black/5 focus-within:border-[#D4A017]/50"
                )}>
                  <Search className={clsx("w-4 h-4 mr-2", theme === "dark" ? "text-gray-400" : "text-slate-500")} />
                  <input
                    type="text"
                    value={messagesSearchQuery}
                    onChange={(e) => setMessagesSearchQuery(e.target.value)}
                    placeholder="Rechercher une publication..."
                    className={clsx(
                      "w-full bg-transparent text-xs outline-none",
                      theme === "dark" ? "text-white placeholder-gray-500" : "text-slate-800 placeholder-slate-400"
                    )}
                  />
                  {messagesSearchQuery && (
                    <button onClick={() => setMessagesSearchQuery("")} className="text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Platform Toggle */}
                <div className="flex gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl">
                  {(["All", "Facebook", "Instagram"] as const).map((plat) => (
                    <button
                      key={plat}
                      onClick={() => setMessagesPlatformFilter(plat)}
                      className={clsx(
                        "flex-1 text-center py-1 text-[11px] font-semibold rounded-lg transition-all",
                        messagesPlatformFilter === plat
                          ? "bg-gradient-to-r from-[#D4A017] to-[#B07B12] text-slate-950 font-bold shadow-md"
                          : theme === "dark"
                          ? "text-gray-400 hover:text-white hover:bg-white/5"
                          : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
                      )}
                    >
                      {plat === "All" ? "Tous" : plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className={clsx("text-sm", theme === "dark" ? "text-gray-500" : "text-slate-400")}>
                      Aucune publication trouvée
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post, i) => {
                    const isSelected = currentSelectedPost && String(post.id) === String(currentSelectedPost.id);
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setSelectedComment(null);
                        }}
                        className={clsx(
                          "flex gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                          isSelected
                            ? theme === "dark"
                              ? "border-[#D4A017]/40 bg-[#D4A017]/10 shadow-lg shadow-[#D4A017]/5"
                              : "border-[#D4A017] bg-[#D4A017]/5 shadow-sm"
                            : theme === "dark"
                            ? "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0 flex items-center justify-center border border-white/10">
                          {post.image ? (
                            <img src={post.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-gray-500">
                              {post.platform === "Facebook" ? "FB" : "IG"}
                            </span>
                          )}
                        </div>

                        {/* Text / Platform */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={clsx(
                              "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full",
                              post.platform === "Facebook"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                            )}>
                              {post.platform}
                            </span>
                            <span className={clsx("text-[9px]", theme === "dark" ? "text-gray-500" : "text-slate-400")}>
                              {post.date}
                            </span>
                          </div>
                          <p className={clsx(
                            "text-xs line-clamp-2 leading-tight font-medium",
                            theme === "dark" ? "text-gray-300" : "text-slate-700"
                          )}>
                            {post.title}
                          </p>
                        </div>

                        {/* Comments Count Badge */}
                        <div className="flex flex-col items-center justify-center">
                          <span className={clsx(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full",
                            (post.commentsList?.length || post.comments || 0) > 0
                              ? "bg-[#D4A017]/20 text-[#D4A017]"
                              : theme === "dark" ? "bg-white/5 text-gray-500" : "bg-black/5 text-slate-400"
                          )}>
                            {post.commentsList?.length || post.comments || 0}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </GlassCard>

            {/* Right Pane - Comments Thread & Composer */}
            <GlassCard className="flex flex-col h-[calc(100vh-210px)] overflow-hidden !p-4" hover={false}>
              {!currentSelectedPost ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-[#D4A017] mb-4 animate-pulse">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className={clsx(
                    "text-lg font-bold",
                    theme === "dark" ? "text-white" : "text-slate-800"
                  )}>
                    Sélectionnez une publication
                  </h4>
                  <p className={clsx(
                    "text-sm max-w-sm mt-1",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Choisissez un post sur le panneau de gauche pour gérer ses commentaires et envoyer vos réponses.
                  </p>
                </div>
              ) : (
                <>
                  {/* Selected Post Header */}
                  <div className={clsx(
                    "pb-3 border-b mb-3 flex items-start gap-4",
                    theme === "dark" ? "border-white/10" : "border-slate-200"
                  )}>
                    {currentSelectedPost.image && (
                      <img
                        src={currentSelectedPost.image}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={clsx(
                          "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full",
                          currentSelectedPost.platform === "Facebook"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-pink-500/10 text-pink-400"
                        )}>
                          {currentSelectedPost.platform}
                        </span>
                        <span className={clsx("text-xs font-semibold", theme === "dark" ? "text-[#D4A017]" : "text-amber-600")}>
                          Flux direct Meta Graph API
                        </span>
                      </div>
                      <p className={clsx(
                        "text-xs line-clamp-2 leading-snug font-medium",
                        theme === "dark" ? "text-gray-300" : "text-slate-600"
                      )}>
                        {currentSelectedPost.title}
                      </p>
                    </div>
                  </div>

                  {/* Comments Thread List */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 custom-scrollbar">
                    {(!currentSelectedPost.commentsList || currentSelectedPost.commentsList.length === 0) ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16">
                        <MessageCircle className="w-10 h-10 text-gray-500 mb-2" />
                        <p className={clsx("text-sm font-semibold", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                          Aucun commentaire sur cette publication
                        </p>
                        <p className={clsx("text-xs mt-0.5 max-w-xs", theme === "dark" ? "text-gray-500" : "text-slate-400")}>
                          Les nouveaux commentaires s&apos;afficheront automatiquement dès leur réception.
                        </p>
                      </div>
                    ) : (
                      currentSelectedPost.commentsList.map((c: any) => {
                        const isSelectedToReply = selectedComment && String(selectedComment.id) === String(c.id);
                        const isCM = c.isReply || c.from === "Community Manager (Moi)" || (currentUser && c.from === currentUser.name);
                        const initials = (c.from || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        const hash = (c.from || "User").split("").reduce((acc: number, char: string) => char.charCodeAt(0) + acc, 0);
                        const hue = hash % 360;
                        const avatarBg = `hsl(${hue}, 65%, 40%)`;

                        return (
                          <div
                            key={c.id}
                            className={clsx(
                              "flex gap-3 transition-all rounded-xl p-2.5",
                              c.isReply || isCM ? "ml-8 bg-black/5 dark:bg-white/[0.01]" : "",
                              isSelectedToReply ? "ring-1 ring-[#D4A017]/50 bg-[#D4A017]/5" : ""
                            )}
                          >
                            {/* Initials Avatar */}
                            {c.isReply || isCM ? (
                              <div className="w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: "#D4A017" }}>
                                {initials}
                              </div>
                            ) : (
                              <div
                                className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: avatarBg }}
                              >
                                {initials}
                              </div>
                            )}

                            {/* Comment details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={clsx(
                                  "text-xs font-bold",
                                  isCM ? "text-[#D4A017]" : theme === "dark" ? "text-white" : "text-slate-800"
                                )}>
                                  {c.from}
                                </span>
                                <span className={clsx("text-[10px]", theme === "dark" ? "text-gray-500" : "text-slate-400")}>
                                  {c.date}
                                </span>
                              </div>

                              <p className={clsx(
                                "text-xs leading-relaxed break-words",
                                theme === "dark" ? "text-gray-200" : "text-slate-700"
                              )}>
                                {c.isReply && <CornerDownRight className="inline w-3 h-3 mr-1 text-[#D4A017]" />}
                                {c.text}
                              </p>

                              {/* Action Footer */}
                              {!c.isReply && !isCM && (
                                <div className="mt-1.5 flex items-center gap-3">
                                  <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold flex items-center gap-1 select-none">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                                    Réponse possible
                                  </span>

                                  <button
                                    onClick={() => setSelectedComment(c)}
                                    className={clsx(
                                      "text-[10px] font-bold transition-all px-2 py-0.5 rounded-lg border",
                                      isSelectedToReply
                                        ? "border-[#D4A017] text-[#D4A017] bg-[#D4A017]/10"
                                        : theme === "dark"
                                        ? "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                                        : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                    )}
                                  >
                                    {isSelectedToReply ? "Ciblé dans le composer" : "Répondre"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Composer & Pinned Controls */}
                  <div className={clsx(
                    "pt-3 border-t",
                    theme === "dark" ? "border-white/10" : "border-slate-200"
                  )}>
                    {selectedComment ? (
                      <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg bg-[#D4A017]/10 border border-[#D4A017]/20 text-xs">
                        <span className={clsx(
                          "font-medium",
                          theme === "dark" ? "text-gray-300" : "text-slate-700"
                        )}>
                          En réponse à <strong className="text-[#D4A017]">@{selectedComment.from}</strong> : &quot;{selectedComment.text.substring(0, 30)}...&quot;
                        </span>
                        <button
                          onClick={() => setSelectedComment(null)}
                          className="p-0.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className={clsx(
                        "px-3 py-1.5 mb-2 rounded-lg text-xs font-semibold select-none",
                        theme === "dark" ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"
                      )}>
                        💡 Sélectionnez un commentaire spécifique ci-dessus pour lui répondre directement
                      </div>
                    )}

                    <div className="flex gap-2 items-end">
                      <textarea
                        value={commentReplyText}
                        onChange={(e) => setCommentReplyText(e.target.value)}
                        placeholder={
                          selectedComment
                            ? `Écrivez votre réponse à @${selectedComment.from}...`
                            : "Veuillez sélectionner un commentaire spécifique ci-dessus pour y répondre."
                        }
                        disabled={!selectedComment || isPostingReply}
                        rows={2}
                        className={clsx(
                          "flex-1 w-full rounded-xl border p-3 text-xs outline-none focus:ring-1 focus:ring-[#D4A017]/50 resize-none transition-all",
                          !selectedComment ? "opacity-60 cursor-not-allowed" : "",
                          theme === "dark"
                            ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                            : "border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:bg-slate-50 shadow-sm"
                        )}
                      />
                      <GlassBtn
                        variant="primary"
                        disabled={!selectedComment || !commentReplyText.trim() || isPostingReply}
                        loading={isPostingReply}
                        onClick={() => {
                          if (selectedComment) {
                            handleSendCommentReply(
                              selectedComment.id,
                              commentReplyText,
                              currentSelectedPost.platform
                            );
                          }
                        }}
                        className="h-10 px-4 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      >
                        {isPostingReply ? (
                          "Publication..."
                        ) : (
                          <>
                            Envoyer
                            <ArrowRightCircle className="w-4 h-4" />
                          </>
                        )}
                      </GlassBtn>
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
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

    if (activeModule === "Admin") {
      return (
        <PageTransition moduleKey="admin">
          <div className="space-y-6">
            <section>
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">n8n Control Panel</p>
                <h3 className="mt-2 text-xl font-bold text-white">Admin Workflow Management</h3>
              </div>
              <GlassCard className="border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white">🚀 Generate Content Now</h4>
                    <p className="mt-1 text-sm text-gray-300">
                      Trigger the n8n workflow to generate social media posts and images instantly
                    </p>
                  </div>
                  <GenerateButton />
                </div>
              </GlassCard>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <GlassCard className="border-purple-500/20">
                <h4 className="font-semibold text-white">⏰ Scheduled Trigger</h4>
                <p className="mt-2 text-sm text-gray-300">Runs Mon/Wed/Fri at 9 AM</p>
              </GlassCard>
              <GlassCard className="border-cyan-500/20">
                <h4 className="font-semibold text-white">⚡ Manual Trigger</h4>
                <p className="mt-2 text-sm text-gray-300">Click above to generate instantly</p>
              </GlassCard>
              <GlassCard className="border-emerald-500/20">
                <h4 className="font-semibold text-white">✅ Pipeline Status</h4>
                <p className="mt-2 text-sm text-emerald-300">Webhook is active</p>
              </GlassCard>
            </div>

            <GlassCard>
              <LiveWorkflowTracker />
            </GlassCard>
          </div>
        </PageTransition>
      );
    }

    return (
      <PageTransition moduleKey="settings">
        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-bold text-white">{t("settings_title", "Paramètres du Dashboard")}</h3>
            <p className="mt-1 text-sm text-blue-200">{t("settings_desc", "Gestion complète de l'interface et des identifiants de connexion API")}</p>
          </GlassCard>

          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">🎨 {t("apparence", "Apparence")}</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-2">{t("theme", "Thème")}</p>
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
                  <p className="text-xs text-gray-400 mb-2">{t("langue", "Langue")}</p>
                  <select
                    value={language}
                    onChange={(e) => {
                      setLanguage(e.target.value);
                      localStorage.setItem("dashboard-language", e.target.value);
                    }}
                    className="w-full rounded-lg border border-white/10 bg-[#0d1e3d] px-3 py-2 text-sm text-white focus:border-[#D4A017]/50 focus:ring-0 cursor-pointer"
                  >
                    <option value="Français" className="bg-slate-900 text-white">Français</option>
                    <option value="English" className="bg-slate-900 text-white">English</option>
                    <option value="العربية" className="bg-slate-900 text-white">العربية</option>
                  </select>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">👥 {t("userspermissions", "Utilisateurs & Permissions")}</h4>
              <ul className="space-y-2 text-xs text-gray-300">
                <li className="flex justify-between"><span>{t("admin_role", "Administrateur")}</span> <span className="text-green-400">Full Access</span></li>
                <li className="flex justify-between"><span>{t("manager_role", "Manager")}</span> <span className="text-blue-400">Campagnes + Équipe</span></li>
                <li className="flex justify-between"><span>{t("cm_role", "Community Manager")}</span> <span className="text-blue-400">Pub + Messages</span></li>
                <li className="flex justify-between"><span>{t("designer_role", "Designer")}</span> <span className="text-purple-400">Content</span></li>
                <li className="flex justify-between"><span>{t("commercial_role", "Commercial")}</span> <span className="text-orange-400">Leads</span></li>
                <li className="flex justify-between"><span>{t("client_role", "Client")}</span> <span className="text-yellow-400">Analytics</span></li>
              </ul>
            </GlassCard>

            
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">🔗 Intégrations API</h4>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Meta (Facebook, Instagram)</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> LinkedIn Professional</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> TikTok Integration</li>
                <li className="flex items-center gap-2"><Settings className="w-4 h-4 text-amber-400 animate-spin-slow" /> Configuration requise</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">🔐 Sécurité</h4>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Double Auth (2FA): Activé</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Chiffrement SSL/TLS: Activé</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Authentification: OAuth 2.0</li>
                <li className="flex items-center gap-2"><Shield className="w-4 h-4 text-[#D4A017]" /> Dernière vérification: 2 jours</li>
              </ul>
            </GlassCard>

            <GlassCard>
              <h4 className="text-sm font-bold text-white mb-3">💾 Sauvegarde & Données</h4>
              <ul className="space-y-2.5 text-xs text-gray-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Auto-backup: Quotidien</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Rétention: 90 jours</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Export format JSON/CSV</li>
                <li className="flex items-center gap-2"><Database className="w-4 h-4 text-blue-400" /> Dernière sync: il y a 2 h</li>
              </ul>
            </GlassCard>
          </div>

          <GlassCard>
            <h4 className="text-sm font-bold text-white mb-3">ℹ️ À propos</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="text-xs text-gray-300">
                <p className="text-gray-400 flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-400" /> Version</p>
                <p className="mt-1 font-semibold pl-5">Dashboard v2.0 (Frontend Ready)</p>
              </div>
              <div className="text-xs text-gray-300">
                <p className="text-gray-400 flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-[#D4A017]" /> Statut</p>
                <p className="mt-1 font-semibold pl-5">Prêt pour connexion DB</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </PageTransition>
    );
  };

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

  if (showLoading) {
    return <LoadingScreen duration={2.8} onComplete={() => setShowLoading(false)} />;
  }

  return (
    <div className={clsx(
      "min-h-screen relative transition-colors duration-300",
      theme === "dark"
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
        : "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900"
    )}>
      <ParticleBG />
      <div className="mx-auto max-w-[1560px] px-3 py-3 md:px-6 md:py-6">
        <div className="grid gap-4 md:gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
              "sticky top-3 hidden h-[calc(100vh-1.5rem)] flex-col rounded-2xl border backdrop-blur-xl lg:flex transition-all duration-300",
              theme === "dark"
                ? "border-white/10 bg-gradient-to-b from-[#071225]/60 to-[#061633]/60"
                : "border-slate-200 bg-white/70 shadow-sm"
            )}
          >
            <div className={clsx(
              "border-b p-4 transition-all duration-300",
              theme === "dark" ? "border-white/10" : "border-slate-200"
            )}>
              <a href="/" className="inline-block">
                <Image
                  src="/logo.png"
                  alt="Site logo"
                  width={160}
                  height={56}
                  className="h-14 w-auto"
                  style={{ objectFit: "contain" }}
                  priority
                />
              </a>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {visibleSidebarItems.map((item, i) => {
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
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition font-medium",
                      active
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-[#D4A017]/30 to-[#B07B12]/30 border border-[#D4A017]/30 text-white shadow-lg shadow-[#D4A017]/10"
                          : "bg-gradient-to-r from-[#D4A017]/20 to-[#B07B12]/20 border border-[#D4A017]/40 text-[#b07b12] shadow-sm shadow-[#D4A017]/5"
                        : theme === "dark"
                          ? "text-gray-300 hover:bg-white/5 hover:text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{t(item.label, item.label)}</span>
                  </motion.button>
                );
              })}
            </nav>

            <div className={clsx(
              "border-t p-3 transition-all duration-300",
              theme === "dark" ? "border-white/10" : "border-slate-200"
            )}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#D4A017]">{t("activeuser", "Active User")}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="truncate">
                  <p className={clsx("text-sm font-bold leading-tight truncate", theme === "dark" ? "text-white" : "text-slate-800")}>
                    {currentUser?.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                    {currentUser?.roleLabel}
                  </p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("dashboard-auth-user");
                    setCurrentUser(null);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Se déconnecter"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={clsx(
                "rounded-2xl border backdrop-blur-xl p-4 md:p-6 transition-all duration-300",
                theme === "dark"
                  ? "border-white/10 bg-gradient-to-r from-[#071225]/10 to-[#061633]/8 text-white"
                  : "border-slate-200 bg-white/70 shadow-sm text-slate-800"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#D4A017]">{t("livesync", "Realtime Cockpit")}</p>
                  <h2 className={clsx(
                    "mt-2 text-2xl font-bold md:text-3xl transition-colors duration-300",
                    theme === "dark" ? "text-white" : "text-slate-800"
                  )}>{t(activeModule, activeModule)}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D4A017]/20 to-[#B07B12]/20 border border-[#D4A017]/30 px-3 py-1 text-xs font-semibold text-[#D4A017]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#D4A017]" />
                    Live sync
                  </motion.span>
                  <GlassBtn
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveModule("Add Publication")}
                  >
                    + Publication
                  </GlassBtn>
                </div>
              </div>

              {/* Mobile Nav */}
              <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                {visibleSidebarItems.slice(0, 7).map((item) => (
                  <GlassBtn
                    key={item.label}
                    variant={activeModule === item.label ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setActiveModule(item.label)}
                  >
                    {t(item.label, item.label).slice(0, 8)}
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
              className={clsx(
                "flex items-center gap-2 rounded-lg border p-3 text-xs transition-all duration-300",
                theme === "dark"
                  ? "border-white/5 bg-white/2 text-gray-400"
                  : "border-slate-200 bg-slate-100/50 text-slate-500"
              )}
            >
              <Sparkles className="h-4 w-4 text-blue-400" />
              Frontend-only demo • All interactions are UI-based • Ready for API integration
            </motion.footer>
          </main>
        </div>
      </div>
      {isTaskModalOpen && (
        <div className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 transition-all duration-300",
          theme === "dark" ? "bg-slate-950/80" : "bg-slate-900/40"
        )}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={clsx(
              "w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden border transition-all duration-300",
              theme === "dark"
                ? "border-white/10 bg-gradient-to-b from-[#0a162e] to-[#050f24]"
                : "border-slate-200 bg-white text-slate-800"
            )}
          >
            {/* Background glowing gradient */}
            {theme === "dark" && (
              <>
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            <div className={clsx(
              "flex items-center justify-between border-b pb-4 mb-5",
              theme === "dark" ? "border-white/10" : "border-slate-200"
            )}>
              <h3 className={clsx("text-lg font-bold flex items-center gap-2", theme === "dark" ? "text-white" : "text-slate-800")}>
                <ListTodo className="w-5 h-5 text-[#D4A017]" /> Ajouter une tâche
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className={clsx(
                  "rounded-lg p-1.5 transition-colors",
                  theme === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newTaskTitle.trim()) {
                try {
                  const dbStatus = localStatusToDb(newTaskColumn);
                  const dbPriority = localPriorityToDb(newTaskPriority);

                  const { data: createdTask, error } = await supabase
                    .from("tasks")
                    .insert([
                      {
                        title: newTaskTitle.trim(),
                        status: dbStatus,
                        priority: dbPriority,
                      }
                    ])
                    .select()
                    .single();

                  if (error) throw error;

                  if (createdTask) {
                    setTaskColumns(prev => ({
                      ...prev,
                      [newTaskColumn]: [...prev[newTaskColumn], createdTask]
                    }));
                    setToast({
                      message: language === "العربية" 
                        ? "تم إنشاء المهمة بنجاح!" 
                        : language === "English" 
                        ? "Task created successfully!" 
                        : "Tâche créée avec succès !",
                      type: "success"
                    });
                  }
                  setIsTaskModalOpen(false);
                  setNewTaskTitle("");
                } catch (err) {
                  console.error("Failed to create new task in Supabase:", err);
                  setToast({
                    message: language === "العربية" 
                      ? "فشل في إنشاء المهمة." 
                      : language === "English" 
                      ? "Failed to create task." 
                      : "Erreur lors de la création de la tâche.",
                    type: "error"
                  });
                }
              }
            }} className="space-y-4">
              <div>
                <label className={clsx(
                  "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                  theme === "dark" ? "text-gray-400" : "text-slate-500"
                )}>
                  Nom de la tâche
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Rédiger le script du Reel..."
                  className={clsx(
                    "w-full rounded-xl px-4 py-2.5 text-sm outline-none border transition-all",
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-[#D4A017]/50 focus:bg-white/10"
                      : "border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-[#D4A017] focus:bg-white shadow-sm"
                  )}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={clsx(
                    "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Statut / Colonne
                  </label>
                  <select
                    value={newTaskColumn}
                    onChange={(e) => setNewTaskColumn(e.target.value)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2.5 text-sm outline-none border transition-all cursor-pointer",
                      theme === "dark"
                        ? "border-white/10 bg-[#0d1e3d] text-white focus:border-[#D4A017]/50"
                        : "border-slate-200 bg-slate-50 text-slate-800 focus:border-[#D4A017] shadow-sm"
                    )}
                  >
                    <option value="A faire">À faire</option>
                    <option value="En cours">En cours</option>
                    <option value="Validation">Validation</option>
                    <option value="Termine">Terminé</option>
                    <option value="Retard">Retard</option>
                  </select>
                </div>

                <div>
                  <label className={clsx(
                    "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Priorité
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className={clsx(
                      "w-full rounded-xl px-3 py-2.5 text-sm outline-none border transition-all cursor-pointer",
                      theme === "dark"
                        ? "border-white/10 bg-[#0d1e3d] text-white focus:border-[#D4A017]/50"
                        : "border-slate-200 bg-slate-50 text-slate-800 focus:border-[#D4A017] shadow-sm"
                    )}
                  >
                    <option value="Critique">🔴 Critique</option>
                    <option value="Haute">🟠 Haute</option>
                    <option value="Normale">🟡 Normale</option>
                    <option value="Basse">🟢 Basse</option>
                  </select>
                </div>
              </div>

              <div className={clsx(
                "flex items-center justify-end gap-3 pt-4 border-t mt-6",
                theme === "dark" ? "border-white/10" : "border-slate-200"
              )}>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className={clsx(
                    "px-4 py-2.5 rounded-xl border transition-all text-xs font-semibold",
                    theme === "dark"
                      ? "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                      : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B07B12] hover:opacity-90 transition-all text-xs font-bold text-slate-950 shadow-lg shadow-[#D4A017]/20"
                >
                  Ajouter la tâche
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {isClientModalOpen && (
        <div className={clsx(
          "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md p-4 transition-all duration-300",
          theme === "dark" ? "bg-slate-950/80" : "bg-slate-900/40"
        )}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={clsx(
              "w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden border transition-all duration-300",
              theme === "dark"
                ? "border-white/10 bg-gradient-to-b from-[#0a162e] to-[#050f24] text-white"
                : "border-slate-200 bg-white text-slate-800"
            )}
          >
            {/* Background glowing gradient */}
            {theme === "dark" && (
              <>
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            <div className={clsx(
              "flex items-center justify-between border-b pb-4 mb-5",
              theme === "dark" ? "border-white/10" : "border-slate-200"
            )}>
              <h3 className={clsx("text-lg font-bold flex items-center gap-2", theme === "dark" ? "text-white" : "text-slate-800")}>
                <Users className="w-5 h-5 text-[#D4A017]" /> Ajouter un client
              </h3>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className={clsx(
                  "rounded-lg p-1.5 transition-colors",
                  theme === "dark"
                    ? "text-gray-400 hover:text-white hover:bg-white/5"
                    : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className={clsx(
                  "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                  theme === "dark" ? "text-gray-400" : "text-slate-500"
                )}>
                  Nom de l&apos;entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                  placeholder="Ex: IKSATECH Digital"
                  className={clsx(
                    "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                      : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                  )}
                />
              </div>

              <div>
                <label className={clsx(
                  "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                  theme === "dark" ? "text-gray-400" : "text-slate-500"
                )}>
                  Nom du contact principal
                </label>
                <input
                  type="text"
                  value={newClientContact}
                  onChange={(e) => setNewClientContact(e.target.value)}
                  placeholder="Ex: Sophie Martin"
                  className={clsx(
                    "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                      : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={clsx(
                    "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className={clsx(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx(
                    "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+212 600-000000"
                    className={clsx(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={clsx(
                    "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Secteur d&apos;activité
                  </label>
                  <input
                    type="text"
                    value={newClientIndustry}
                    onChange={(e) => setNewClientIndustry(e.target.value)}
                    placeholder="Ex: Hôtellerie, Fitness"
                    className={clsx(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                </div>

                <div>
                  <label className={clsx(
                    "block text-xs font-semibold mb-1.5 uppercase tracking-wider",
                    theme === "dark" ? "text-gray-400" : "text-slate-500"
                  )}>
                    Statut initial
                  </label>
                  <select
                    value={newClientStatus}
                    onChange={(e) => setNewClientStatus(e.target.value)}
                    className={clsx(
                      "w-full rounded-xl border px-3 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50 cursor-pointer",
                      theme === "dark"
                        ? "border-white/10 bg-[#071225] text-white focus:bg-[#091730]"
                        : "border-slate-200 bg-slate-50 text-slate-800 focus:bg-white"
                    )}
                  >
                    <option value="Actif">Actif</option>
                    <option value="Inactif">Inactif</option>
                  </select>
                </div>
              </div>

              <div className={clsx(
                "flex items-center justify-end gap-3 pt-4 border-t mt-6",
                theme === "dark" ? "border-white/10" : "border-slate-200"
              )}>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className={clsx(
                    "px-4 py-2.5 rounded-xl border transition-all text-xs font-semibold",
                    theme === "dark"
                      ? "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                      : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A017] to-[#B07B12] hover:opacity-90 transition-all text-xs font-bold text-slate-950 shadow-lg shadow-[#D4A017]/20"
                >
                  Ajouter le client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={clsx(
              "flex items-center gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 max-w-sm",
              toast.type === "success"
                ? "border-amber-500/30 bg-[#071225]/90 text-white shadow-amber-500/10"
                : "border-red-500/30 bg-red-950/90 text-white shadow-red-500/10"
            )}
          >
            <div className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0",
              toast.type === "success" ? "bg-amber-500/20 text-[#D4A017]" : "bg-red-500/20 text-red-400"
            )}>
              {toast.type === "success" ? (
                <Sparkles className="h-5 w-5 animate-pulse" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                {toast.type === "success" ? "Succès" : "Erreur"}
              </p>
              <p className="text-xs font-medium leading-normal mt-0.5">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
