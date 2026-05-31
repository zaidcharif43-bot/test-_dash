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
  EyeOff,
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
  Menu,
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
  Trash2,
  Save,
  Trophy,
  Crown,
  Flame,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [language, setLanguage] = useState("Français");
  const [metaToken, setMetaToken] = useState("");
  const [metaPageId, setMetaPageId] = useState("");
  const [metaIgId, setMetaIgId] = useState("");
  const [googleSheetId, setGoogleSheetId] = useState("");

  const [inputToken, setInputToken] = useState("");
  const [inputPageId, setInputPageId] = useState("");
  const [inputIgId, setInputIgId] = useState("");
  const [inputSheetId, setInputSheetId] = useState("");
  const [showMetaToken, setShowMetaToken] = useState(false);

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
  const [newPubCustomImage, setNewPubCustomImage] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"link" | "upload">("link");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
  const [teamPasswordDrafts, setTeamPasswordDrafts] = useState<Record<number, string>>({});
  const [teamRoleDrafts, setTeamRoleDrafts] = useState<Record<number, string>>({});
  const [isSavingMember, setIsSavingMember] = useState<Record<number, boolean>>({});

  const visibleSidebarItems = useMemo(() => {
    if (!currentUser) return [];
    return sidebarItems.filter((item) => {
      if (currentUser.role === "client") {
        return ["Dashboard", "Publications", "Calendrier editorial", "Messages", "Notifications"].includes(item.label);
      }
      if (currentUser.role === "manager") {
        return item.label !== "Admin" && item.label !== "Parametres" && item.label !== "Equipe";
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

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeModule, currentUser]);

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

    if (diffMonths < 0) {
      return {
        isForecast: false,
        facebook: {
          name: metaInsights.facebook.name,
          followers: 0,
          likes: 0,
        },
        instagram: {
          username: metaInsights.instagram.username,
          followers: 0,
          posts: 0,
        },
        recentPosts: [],
        metrics: {
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalReach: 0,
        },
      };
    }

    if (diffMonths === 0) {
      return {
        isForecast: false,
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

  const isBeforeBaseline = selectedYear < 2026 || (selectedYear === 2026 && selectedMonth < 4);

  const PremiumEmptyState = ({
    icon: Icon,
    title,
    description,
    note,
    tone = "amber",
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    note?: string;
    tone?: "amber" | "blue" | "pink" | "emerald" | "purple";
  }) => {
    const toneStyles = {
      amber: {
        shell: theme === "dark"
          ? "border-[#D4A017]/20 bg-gradient-to-b from-[#D4A017]/10 via-white/5 to-[#061633] text-white shadow-[#D4A017]/5"
          : "border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-slate-200/70",
        iconWrap: theme === "dark" ? "border-[#D4A017]/30 bg-[#D4A017]/15" : "border-amber-200 bg-amber-50",
        icon: theme === "dark" ? "text-[#D4A017]" : "text-amber-600",
        chip: theme === "dark" ? "border-white/10 bg-white/5 text-gray-200" : "border-slate-200 bg-white text-slate-700",
      },
      blue: {
        shell: theme === "dark"
          ? "border-blue-400/20 bg-gradient-to-b from-blue-500/10 via-white/5 to-[#061633] text-white shadow-blue-500/5"
          : "border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-slate-200/70",
        iconWrap: theme === "dark" ? "border-blue-400/20 bg-blue-500/10" : "border-blue-200 bg-blue-50",
        icon: theme === "dark" ? "text-blue-300" : "text-blue-600",
        chip: theme === "dark" ? "border-white/10 bg-white/5 text-gray-200" : "border-slate-200 bg-white text-slate-700",
      },
      pink: {
        shell: theme === "dark"
          ? "border-pink-400/20 bg-gradient-to-b from-pink-500/10 via-white/5 to-[#061633] text-white shadow-pink-500/5"
          : "border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-slate-200/70",
        iconWrap: theme === "dark" ? "border-pink-400/20 bg-pink-500/10" : "border-pink-200 bg-pink-50",
        icon: theme === "dark" ? "text-pink-300" : "text-pink-600",
        chip: theme === "dark" ? "border-white/10 bg-white/5 text-gray-200" : "border-slate-200 bg-white text-slate-700",
      },
      emerald: {
        shell: theme === "dark"
          ? "border-emerald-400/20 bg-gradient-to-b from-emerald-500/10 via-white/5 to-[#061633] text-white shadow-emerald-500/5"
          : "border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-slate-200/70",
        iconWrap: theme === "dark" ? "border-emerald-400/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50",
        icon: theme === "dark" ? "text-emerald-300" : "text-emerald-600",
        chip: theme === "dark" ? "border-white/10 bg-white/5 text-gray-200" : "border-slate-200 bg-white text-slate-700",
      },
      purple: {
        shell: theme === "dark"
          ? "border-purple-400/20 bg-gradient-to-b from-purple-500/10 via-white/5 to-[#061633] text-white shadow-purple-500/5"
          : "border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-slate-200/70",
        iconWrap: theme === "dark" ? "border-purple-400/20 bg-purple-500/10" : "border-purple-200 bg-purple-50",
        icon: theme === "dark" ? "text-purple-300" : "text-purple-600",
        chip: theme === "dark" ? "border-white/10 bg-white/5 text-gray-200" : "border-slate-200 bg-white text-slate-700",
      },
    }[tone];

    return (
      <div className={clsx("relative overflow-hidden rounded-2xl border p-6 text-center shadow-lg", toneStyles.shell)}>
        <div className={clsx("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border", toneStyles.iconWrap)}>
          <Icon className={clsx("h-6 w-6", toneStyles.icon)} />
        </div>
        <p className="text-base font-bold">{title}</p>
        <p className={clsx("mt-2 text-sm", theme === "dark" ? "text-gray-300" : "text-slate-600")}>{description}</p>
        {note && <p className={clsx("mt-3 text-xs", theme === "dark" ? "text-gray-400" : "text-slate-500")}>{note}</p>}
      </div>
    );
  };

  // Dynamically compute comparative platform data
  const platformData = useMemo(() => {
    const isFallback = !displayInsights || displayInsights.facebook?.isFallback || displayInsights.instagram?.isFallback;

    if (!displayInsights) {
      return [
        { platform: "Instagram", value: 18200, color: "#ec4899", isConnected: true },
        { platform: "Facebook", value: 12450, color: "#3b82f6", isConnected: true },
        { platform: "LinkedIn", value: 0, color: "#fbbf24", isConnected: false },
      ];
    }
    const baseYear = 2026;
    const baseMonth = 4;
    const diffMonths = (selectedYear - baseYear) * 12 + (selectedMonth - baseMonth);

    if (diffMonths < 0) {
      return [
        { platform: "Instagram", value: 0, color: "#ec4899", isConnected: true },
        { platform: "Facebook", value: 0, color: "#3b82f6", isConnected: true },
        { platform: "LinkedIn", value: 0, color: "#fbbf24", isConnected: false },
      ];
    }

    const igFollowers = displayInsights.instagram?.followers ?? 0;
    const fbFollowers = displayInsights.facebook?.followers ?? 0;
    const liFollowers = 0; // LinkedIn not connected
    
    return [
      { platform: "Instagram", value: isFallback ? 18200 : igFollowers, color: "#ec4899", isConnected: true },
      { platform: "Facebook", value: isFallback ? 12450 : fbFollowers, color: "#3b82f6", isConnected: true },
      { platform: "LinkedIn", value: liFollowers, color: "#fbbf24", isConnected: false },
    ];
  }, [displayInsights, selectedYear, selectedMonth]);

  // Dynamically compute engagement growth curves based on month selection and real Meta API stats
  const engagementData = useMemo(() => {
    const isFallback = !displayInsights || displayInsights.facebook?.isFallback || displayInsights.instagram?.isFallback;
    const baseYear = 2026;
    const baseMonth = 4; // May
    const diffMonths = (selectedYear - baseYear) * 12 + (selectedMonth - baseMonth);

    if (diffMonths < 0) {
      return [
        { name: "Lun", engagement: 0, reach: 0 },
        { name: "Mar", engagement: 0, reach: 0 },
        { name: "Mer", engagement: 0, reach: 0 },
        { name: "Jeu", engagement: 0, reach: 0 },
        { name: "Ven", engagement: 0, reach: 0 },
        { name: "Sam", engagement: 0, reach: 0 },
        { name: "Dim", engagement: 0, reach: 0 },
      ];
    }

    if (isFallback) {
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
    }

    // Real API connected data: dynamically distribute actual reach, likes & comments!
    const realLikes = displayInsights?.metrics?.totalLikes ?? 0;
    const realComments = displayInsights?.metrics?.totalComments ?? 0;
    const realReach = displayInsights?.metrics?.totalReach ?? 0;
    const totalEngagement = realLikes + realComments;

    // Distribute percentages for each day of the week
    const distribution = [
      { name: "Lun", engPct: 0.10, reachPct: 0.12 },
      { name: "Mar", engPct: 0.12, reachPct: 0.14 },
      { name: "Mer", engPct: 0.10, reachPct: 0.11 },
      { name: "Jeu", engPct: 0.15, reachPct: 0.16 },
      { name: "Ven", engPct: 0.23, reachPct: 0.20 },
      { name: "Sam", engPct: 0.12, reachPct: 0.12 },
      { name: "Dim", engPct: 0.18, reachPct: 0.15 },
    ];

    const growthMultiplier = diffMonths > 0 ? 1 + diffMonths * 0.06 : 1;

    return distribution.map(d => ({
      name: d.name,
      engagement: Math.max(1, Math.round(totalEngagement * d.engPct * growthMultiplier)),
      reach: Math.max(10, Math.round(realReach * d.reachPct * growthMultiplier)),
    }));
  }, [selectedMonth, selectedYear, displayInsights]);

  const renderDateSelector = () => {
    return (
      <div className={clsx(
        "flex w-full max-w-full flex-wrap items-center justify-center gap-2 border rounded-2xl p-2 backdrop-blur-md self-center transition-all duration-300 sm:w-auto sm:justify-start",
        theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-300 shadow-sm"
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

        <div className="flex min-w-0 flex-wrap items-center justify-center gap-1.5 px-1 sm:justify-start">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className={clsx(
              "min-w-[120px] border rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 cursor-pointer transition-colors text-sm pr-7 appearance-none",
              theme === "dark"
                ? "bg-slate-900 border-white/10 text-white hover:text-[#D4A017] focus:ring-[#D4A017]/30"
                : "bg-white border-slate-300 text-black hover:text-black focus:ring-slate-400/30"
            )}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
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
              "min-w-[96px] border rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 cursor-pointer transition-colors text-sm pr-7 appearance-none",
              theme === "dark"
                ? "bg-slate-900 border-white/10 text-white hover:text-[#D4A017] focus:ring-[#D4A017]/30"
                : "bg-white border-slate-300 text-black hover:text-black focus:ring-slate-400/30"
            )}
            style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
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

  // Synchronize activeModule with browser URL path to support route bookmarks and dynamic routing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/publications") setActiveModule("Publications");
      else if (path === "/calendar") setActiveModule("Calendrier editorial");
      else if (path === "/add-publication") setActiveModule("Add Publication");
      else if (path === "/tasks") setActiveModule("Taches");
      else if (path === "/team") setActiveModule("Equipe");
      else if (path === "/messages") setActiveModule("Messages");
      else if (path === "/notifications") setActiveModule("Notifications");
      else if (path === "/settings") setActiveModule("Parametres");
      else if (path === "/admin") setActiveModule("Admin");
      else setActiveModule("Dashboard");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let targetPath = "/";
      if (activeModule === "Publications") targetPath = "/publications";
      else if (activeModule === "Calendrier editorial") targetPath = "/calendar";
      else if (activeModule === "Add Publication") targetPath = "/add-publication";
      else if (activeModule === "Taches") targetPath = "/tasks";
      else if (activeModule === "Equipe") targetPath = "/team";
      else if (activeModule === "Messages") targetPath = "/messages";
      else if (activeModule === "Notifications") targetPath = "/notifications";
      else if (activeModule === "Parametres") targetPath = "/settings";
      else if (activeModule === "Admin") targetPath = "/admin";
      
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, "", targetPath);
      }
    }
  }, [activeModule]);

  // Load configuration from database / env and fallback to localStorage on mount
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
    }

    async function fetchSavedCredentials() {
      try {
        const res = await fetch("/api/save-credentials");
        const data = await res.json();
        if (data && !data.error) {
          let tokenToUse = data.token || "";
          
          // Smart local resolution: if the database token is masked, restore the full token from localStorage if the prefixes match
          if (tokenToUse.endsWith("...") && typeof window !== "undefined") {
            const localToken = localStorage.getItem("meta-access-token") || "";
            const prefix = tokenToUse.replace("...", "");
            if (prefix && localToken.startsWith(prefix)) {
              tokenToUse = localToken;
            }
          }

          setInputToken(tokenToUse);
          setInputPageId(data.pageId || "");
          setInputIgId(data.igId || "");
          setInputSheetId(data.sheetId || "");

          setMetaToken(tokenToUse);
          setMetaPageId(data.pageId || "");
          setMetaIgId(data.igId || "");
          setGoogleSheetId(data.sheetId || "");
        } else {
          throw new Error("Failed to load configs from database");
        }
      } catch (err) {
        console.warn("Loading configs from localStorage fallback:", err);
        if (typeof window !== "undefined") {
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
        }
      }
    }
    fetchSavedCredentials();
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

  // Fetch team members from Supabase (all roles, active only)
  useEffect(() => {
    async function fetchTeam() {
      try {
        const { data: dbUsers, error } = await supabase
          .from("users")
          .select("*")
          .eq("is_active", true);

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
              from: reply.sender_name || (currentUser?.name || "Équipe (Moi)"),
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

    // Filter team members based on role privileges
    const filteredMembers = teamMembers.filter((member) => {
      if (currentUser?.role === "manager") {
        // Manager can see ONLY client accounts, and NOT themselves either
        const isSelf = member.email.toLowerCase() === currentUser.username.toLowerCase();
        return member.role === "client" && !isSelf;
      }
      return true; // Admin can see all active team members
    });

    return filteredMembers.map((member) => {
      const memberTasks = allTasks.filter(t => t.assigned_to === member.id);
      const totalCount = memberTasks.length;
      const completedCount = memberTasks.filter(t => t.status === "done").length;

      // Default baseline performance score if no tasks are assigned
      let score = 95;
      if (totalCount > 0) {
        score = Math.round((completedCount / totalCount) * 100);
      }

      let displayRole = member.role;
      if (member.role === "client") displayRole = "Client";
      else if (member.role === "manager") displayRole = "Manager";
      else if (member.role === "admin") displayRole = "Administrateur";

      return {
        id: member.id,
        name: member.full_name,
        role: displayRole,
        accessRole: member.role,
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
  }, [currentUser, metaToken, metaPageId, metaIgId, googleSheetId]);

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

  const teamRoleOptions = useMemo(() => {
    return ["admin", "manager", "client"];
  }, []);

  const labelForRole = (role: string) => {
    if (role === "client") return "Client";
    if (role === "manager") return "Manager";
    if (role === "admin") return "Admin";
    return role;
  };

  const updateTeamMemberRole = async (memberId: number, nextRole: string) => {
    setTeamMembers((prev) =>
      prev.map((member) => (member.id === memberId ? { ...member, role: nextRole } : member)),
    );

    try {
      const { error } = await supabase.from("users").update({ role: nextRole }).eq("id", memberId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update team member role:", err);
      setToast({
        type: "error",
        message: language === "العربية" ? "فشل تحديث الدور." : language === "English" ? "Failed to update role." : "Échec de la mise à jour du rôle.",
      });
      if (currentUser) {
        const { data: dbUsers } = await supabase.from("users").select("*");
        if (dbUsers) setTeamMembers(dbUsers);
      }
    }
  };

  const updateTeamMemberPassword = async (memberId: number) => {
    const nextPassword = teamPasswordDrafts[memberId]?.trim();
    if (!nextPassword) return;

    try {
      const { error } = await supabase.from("users").update({ password: nextPassword }).eq("id", memberId);
      if (error) throw error;

      setTeamPasswordDrafts((prev) => ({ ...prev, [memberId]: "" }));
      setToast({
        type: "success",
        message: language === "العربية" ? "تم تحديث كلمة المرور." : language === "English" ? "Password updated." : "Mot de passe mis à jour.",
      });
    } catch (err) {
      console.error("Failed to update team member password:", err);
      setToast({
        type: "error",
        message: language === "العربية" ? "فشل تحديث كلمة المرور." : language === "English" ? "Failed to update password." : "Échec de la mise à jour du mot de passe.",
      });
    }
  };

  const saveTeamMemberChanges = async (memberId: number) => {
    const defaultRole = teamMembers.find(m => m.id === memberId)?.role || "client";
    const nextRole = teamRoleDrafts[memberId] !== undefined ? teamRoleDrafts[memberId] : defaultRole;
    const nextPassword = teamPasswordDrafts[memberId]?.trim();

    setIsSavingMember((prev) => ({ ...prev, [memberId]: true }));

    try {
      const { error: roleError } = await supabase
        .from("users")
        .update({ role: nextRole })
        .eq("id", memberId);
      if (roleError) throw roleError;

      if (nextPassword) {
        const { error: passError } = await supabase
          .from("users")
          .update({ password: nextPassword })
          .eq("id", memberId);
        if (passError) throw passError;
        setTeamPasswordDrafts((prev) => ({ ...prev, [memberId]: "" }));
      }

      setTeamMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: nextRole } : m))
      );

      setToast({
        type: "success",
        message: language === "العربية" ? "تم حفظ معلومات العضو!" : language === "English" ? "Member details saved successfully!" : "Informations du membre enregistrées avec succès !",
      });
    } catch (err) {
      console.error("Failed to save team member info:", err);
      setToast({
        type: "error",
        message: language === "العربية" ? "فشل حفظ معلومات العضو." : language === "English" ? "Failed to save member details." : "Échec de l'enregistrement du membre.",
      });
    } finally {
      setIsSavingMember((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const deleteTeamMember = async (memberId: number) => {
    const memberToDelete = teamMembers.find((member) => member.id === memberId);
    if (!memberToDelete) return;

    const confirmDelete = window.confirm(
      language === "العربية"
        ? `هل تريد حذف ${memberToDelete.full_name || memberToDelete.email}؟`
        : language === "English"
        ? `Delete ${memberToDelete.full_name || memberToDelete.email}?`
        : `Supprimer ${memberToDelete.full_name || memberToDelete.email} ?`,
    );
    if (!confirmDelete) return;

    setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));

    try {
      const cleanupOperations = [
        supabase.from("tasks").update({ assigned_to: null }).eq("assigned_to", memberId),
        supabase.from("tasks").update({ created_by: null }).eq("created_by", memberId),
        supabase.from("campaigns").update({ created_by: null }).eq("created_by", memberId),
        supabase.from("clients").update({ assigned_user_id: null }).eq("assigned_user_id", memberId),
        supabase.from("leads").update({ assigned_to: null }).eq("assigned_to", memberId),
        supabase.from("messages").update({ assigned_to: null }).eq("assigned_to", memberId),
        supabase.from("notifications").update({ user_id: null }).eq("user_id", memberId),
        supabase.from("posts").update({ approved_by: null }).eq("approved_by", memberId),
        supabase.from("audit_log").update({ user_id: null }).eq("user_id", memberId),
      ];

      const cleanupResults = await Promise.all(cleanupOperations);
      const cleanupError = cleanupResults.find((result) => result.error);
      if (cleanupError?.error) throw cleanupError.error;

      const { error } = await supabase.from("users").delete().eq("id", memberId);
      if (error) throw error;

      setToast({
        type: "success",
        message: language === "العربية" ? "تم حذف المستخدم نهائياً." : language === "English" ? "User deleted permanently." : "Utilisateur supprimé définitivement.",
      });

      if (currentUser?.username === memberToDelete.email) {
        localStorage.removeItem("dashboard-auth-user");
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Failed to delete team member:", err);
      setToast({
        type: "error",
        message: language === "العربية" ? "فشل حذف المستخدم نهائياً." : language === "English" ? "Failed to delete user permanently." : "Échec de la suppression définitive du membre.",
      });
      if (currentUser) {
        const { data: dbUsers } = await supabase.from("users").select("*");
        if (dbUsers) setTeamMembers(dbUsers);
      }
    }
  };

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      const res = await fetch("https://api.cloudinary.com/v1_1/dmnkmwdmu/image/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Cloudinary upload failed");

      const data = await res.json();
      if (data.secure_url) {
        setNewPubCustomImage(data.secure_url);
        setToast({
          message: language === "العربية" ? "تم تحميل الصورة بنجاح!" : language === "English" ? "Image uploaded successfully!" : "Image téléchargée avec succès !",
          type: "success"
        });
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      setToast({
        message: language === "العربية" ? "فشل تحميل الصورة" : language === "English" ? "Image upload failed" : "Échec du téléchargement de l'image",
        type: "error"
      });
    } finally {
      setIsUploadingImage(false);
    }
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
        custom_image_url: newPubCustomImage.trim() || "false",
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
      setNewPubCustomImage("");
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
                from: currentUser?.name || "Équipe (Moi)",
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
              sender_name: currentUser?.name || "Équipe (Moi)",
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
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const cleanToken = inputToken.trim();
      const cleanPageId = inputPageId.trim();
      const cleanIgId = inputIgId.trim();
      const cleanSheetId = inputSheetId.trim();

      localStorage.setItem("meta-access-token", cleanToken);
      localStorage.setItem("meta-page-id", cleanPageId);
      localStorage.setItem("meta-instagram-id", cleanIgId);
      localStorage.setItem("google-sheet-id", cleanSheetId);

      setMetaToken(cleanToken);
      setMetaPageId(cleanPageId);
      setMetaIgId(cleanIgId);
      setGoogleSheetId(cleanSheetId);

      try {
        const res = await fetch("/api/save-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: cleanToken,
            pageId: cleanPageId,
            igId: cleanIgId,
            sheetId: cleanSheetId
          })
        });
        const data = await res.json();
        if (data.success) {
          createNotificationInDb(
            "Configuration sauvegardée",
            data.localEnvBackup
              ? "API synchronisée sur Supabase & sauvegardée localement dans le fichier .env !"
              : "API synchronisée en temps réel sur Supabase (Production Vercel active) !",
            "Interne"
          );
          setToast({
            message: data.localEnvBackup
              ? "Identifiants sauvegardés dans la base de données & synchronisés localement dans le .env !"
              : "Identifiants sauvegardés avec succès dans la base de données Supabase !",
            type: "success"
          });
          setTimeout(() => setToast(null), 4000);
        } else {
          throw new Error(data.error || "Echec de la sauvegarde");
        }
      } catch (err) {
        console.error("Error saving credentials to database:", err);
        createNotificationInDb(
          "Erreur de sauvegarde",
          "Les clés ont été appliquées localement mais la base de données n'a pas pu être mise à jour.",
          "Interne"
        );
        setToast({
          message: "Erreur de sauvegarde : Impossible de mettre à jour les clés dans la base de données.",
          type: "error"
        });
        setTimeout(() => setToast(null), 4000);
      }
    }
  };

  const renderModule = () => {
    if (activeModule === "Dashboard") {
      return (
        <PageTransition moduleKey="dashboard">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#071225]/40 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
              <div>
                <h3 className={clsx("text-xl font-bold", theme === "dark" ? "text-white" : "text-black")}>Visualisation des Insights</h3>
                <p className={clsx("text-xs mt-1", theme === "dark" ? "text-gray-400" : "text-slate-600")}>Sélectionnez la période pour filtrer vos indicateurs de performance</p>
              </div>
              {renderDateSelector()}
            </div>

            {/* ── Social Media Insights — Premium Redesign ── */}
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h3 className={clsx("text-xl font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>
                    Social Media Insights {displayInsights?.isForecast ? "(Forecast)" : ""}
                  </h3>
                  <p className={clsx("text-xs mt-1", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                    Live data from Meta Graph API
                  </p>
                </div>
                {displayInsights?.isForecast && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-semibold text-amber-300 shadow-lg shadow-amber-500/10">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Mode Prévisionnel
                  </span>
                )}
              </div>

              {isBeforeBaseline ? (
                <PremiumEmptyState
                  icon={Sparkles}
                  tone="amber"
                  title="Aucune donnée avant mai 2026"
                  description="Les statistiques restent à zéro jusqu'au mois de base."
                  note={`Mois sélectionné: ${monthsList[selectedMonth]} ${selectedYear} • Baseline: Mai 2026`}
                />
              ) : displayInsights ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* ── Facebook Panel ── */}
                  <div className={clsx(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group hover:shadow-xl",
                    theme === "dark"
                      ? "border-blue-500/20 bg-gradient-to-br from-blue-950/60 via-[#071225]/80 to-slate-950/60 hover:border-blue-400/40 shadow-blue-500/5"
                      : "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 hover:border-blue-300 shadow-sm"
                  )}>
                    {/* Decorative glow */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="relative flex items-center gap-3 mb-5">
                      <div className={clsx(
                        "flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg",
                        theme === "dark"
                          ? "border-blue-400/30 bg-blue-600/20 shadow-blue-500/20"
                          : "border-blue-200 bg-blue-100 shadow-blue-200/50"
                      )}>
                        <Globe className={clsx("h-5 w-5", theme === "dark" ? "text-blue-400" : "text-blue-600")} />
                      </div>
                      <div>
                        <p className={clsx("text-sm font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>Facebook</p>
                        <p className={clsx("text-[10px] font-medium", theme === "dark" ? "text-blue-300/70" : "text-blue-600/70")}>Meta Graph API</p>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                        </span>
                      </div>
                    </div>

                    <div className="relative grid grid-cols-2 gap-3">
                      <div className={clsx(
                        "rounded-xl border p-4 text-center transition-all hover:scale-[1.02]",
                        theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-blue-100 bg-blue-50/50"
                      )}>
                        <Users className={clsx("w-4 h-4 mx-auto mb-1.5", theme === "dark" ? "text-blue-400" : "text-blue-600")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider mb-1", theme === "dark" ? "text-gray-400" : "text-slate-500")}>Followers</p>
                        <p className={clsx("text-2xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>{displayInsights.facebook.followers.toLocaleString()}</p>
                      </div>
                      <div className={clsx(
                        "rounded-xl border p-4 text-center transition-all hover:scale-[1.02]",
                        theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-blue-100 bg-blue-50/50"
                      )}>
                        <Heart className={clsx("w-4 h-4 mx-auto mb-1.5", theme === "dark" ? "text-rose-400" : "text-rose-500")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider mb-1", theme === "dark" ? "text-gray-400" : "text-slate-500")}>Page Likes</p>
                        <p className={clsx("text-2xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>{displayInsights.facebook.likes.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Instagram Panel ── */}
                  <div className={clsx(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group hover:shadow-xl",
                    theme === "dark"
                      ? "border-pink-500/20 bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-[#071225]/80 hover:border-pink-400/40 shadow-pink-500/5"
                      : "border-pink-200 bg-gradient-to-br from-pink-50 via-white to-purple-50/30 hover:border-pink-300 shadow-sm"
                  )}>
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <div className="relative flex items-center gap-3 mb-5">
                      <div className={clsx(
                        "flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg",
                        theme === "dark"
                          ? "border-pink-400/30 bg-gradient-to-br from-pink-600/20 to-purple-600/20 shadow-pink-500/20"
                          : "border-pink-200 bg-gradient-to-br from-pink-100 to-purple-100 shadow-pink-200/50"
                      )}>
                        <Instagram className={clsx("h-5 w-5", theme === "dark" ? "text-pink-400" : "text-pink-600")} />
                      </div>
                      <div>
                        <p className={clsx("text-sm font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>Instagram</p>
                        <p className={clsx("text-[10px] font-medium", theme === "dark" ? "text-pink-300/70" : "text-pink-600/70")}>Meta Graph API</p>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                        </span>
                      </div>
                    </div>

                    <div className="relative grid grid-cols-2 gap-3">
                      <div className={clsx(
                        "rounded-xl border p-4 text-center transition-all hover:scale-[1.02]",
                        theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-pink-100 bg-pink-50/50"
                      )}>
                        <Users className={clsx("w-4 h-4 mx-auto mb-1.5", theme === "dark" ? "text-pink-400" : "text-pink-600")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider mb-1", theme === "dark" ? "text-gray-400" : "text-slate-500")}>Followers</p>
                        <p className={clsx("text-2xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>{displayInsights.instagram.followers.toLocaleString()}</p>
                      </div>
                      <div className={clsx(
                        "rounded-xl border p-4 text-center transition-all hover:scale-[1.02]",
                        theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-pink-100 bg-pink-50/50"
                      )}>
                        <Megaphone className={clsx("w-4 h-4 mx-auto mb-1.5", theme === "dark" ? "text-purple-400" : "text-purple-600")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider mb-1", theme === "dark" ? "text-gray-400" : "text-slate-500")}>Posts</p>
                        <p className={clsx("text-2xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>{displayInsights.instagram.posts.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={clsx(
                  "text-center py-10 font-mono text-sm rounded-2xl border",
                  theme === "dark" ? "opacity-50 border-white/5 bg-white/[0.02]" : "opacity-60 border-slate-200 bg-white"
                )}>
                  Loading Meta API Insights...
                </div>
              )}

              {/* ── Engagement Metrics Bar ── */}
              {!isBeforeBaseline && (
                <div className={clsx(
                  "rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300",
                  theme === "dark"
                    ? "border-white/10 bg-gradient-to-r from-[#071225]/60 to-[#061633]/60"
                    : "border-slate-200 bg-white/70 shadow-sm"
                )}>
                  <h3 className={clsx("text-sm font-bold mb-4 flex items-center gap-2", theme === "dark" ? "text-white" : "text-slate-800")}>
                    <Activity className={clsx("w-4 h-4", theme === "dark" ? "text-[#D4A017]" : "text-amber-600")} />
                    {t("metrics_title", "Métriques réseaux sociaux")}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Likes */}
                    <div className={clsx(
                      "relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.03]",
                      theme === "dark"
                        ? "border-white/5 bg-gradient-to-b from-rose-500/15 to-rose-500/5"
                        : "border-slate-100 bg-gradient-to-b from-rose-50 to-white shadow-sm"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className={clsx("w-3.5 h-3.5", theme === "dark" ? "text-rose-400" : "text-rose-500")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>{t("likes", "Likes")}</p>
                      </div>
                      <p className={clsx("text-xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>
                        {(displayInsights?.metrics?.totalLikes ?? 0).toLocaleString()}
                      </p>
                    </div>
                    {/* Comments */}
                    <div className={clsx(
                      "relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.03]",
                      theme === "dark"
                        ? "border-white/5 bg-gradient-to-b from-blue-500/15 to-blue-500/5"
                        : "border-slate-100 bg-gradient-to-b from-blue-50 to-white shadow-sm"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className={clsx("w-3.5 h-3.5", theme === "dark" ? "text-blue-400" : "text-blue-500")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>{t("comments", "Commentaires")}</p>
                      </div>
                      <p className={clsx("text-xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>
                        {(displayInsights?.metrics?.totalComments ?? 0).toLocaleString()}
                      </p>
                    </div>
                    {/* Shares */}
                    <div className={clsx(
                      "relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.03]",
                      theme === "dark"
                        ? "border-white/5 bg-gradient-to-b from-emerald-500/15 to-emerald-500/5"
                        : "border-slate-100 bg-gradient-to-b from-emerald-50 to-white shadow-sm"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 className={clsx("w-3.5 h-3.5", theme === "dark" ? "text-emerald-400" : "text-emerald-500")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>{t("shares", "Partages")}</p>
                      </div>
                      <p className={clsx("text-xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>
                        {(displayInsights?.metrics?.totalShares ?? 0).toLocaleString()}
                      </p>
                    </div>
                    {/* Reach */}
                    <div className={clsx(
                      "relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:scale-[1.03]",
                      theme === "dark"
                        ? "border-white/5 bg-gradient-to-b from-purple-500/15 to-purple-500/5"
                        : "border-slate-100 bg-gradient-to-b from-purple-50 to-white shadow-sm"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className={clsx("w-3.5 h-3.5", theme === "dark" ? "text-purple-400" : "text-purple-500")} />
                        <p className={clsx("text-[10px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>{t("reach", "Portée")}</p>
                      </div>
                      <p className={clsx("text-xl font-black tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>
                        {(displayInsights?.metrics?.totalReach ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid min-w-0 gap-6 xl:grid-cols-2">
              <GlassCard>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">Evolution engagement</h3>
                    <p className="text-xs text-gray-400">Activité et visibilité des publications</p>
                  </div>
                  {/* Legend guide / Hint of colors */}
                  <div className="flex items-center gap-3.5 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5 self-start sm:self-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
                      <span className="text-[10px] text-gray-300 font-semibold">Engagement (Bleu)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]" />
                      <span className="text-[10px] text-gray-300 font-semibold">Portée / Reach (Vert)</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="name"
                        stroke={theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                        tick={{ fill: theme === "dark" ? "#a1a1aa" : "#475569", fontSize: 11 }}
                      />
                      <YAxis
                        stroke={theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                        tick={{ fill: theme === "dark" ? "#a1a1aa" : "#475569", fontSize: 11 }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-950/95 border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
                                <p className="text-xs font-bold text-gray-400 mb-2">{payload[0].payload.name}</p>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center gap-6 justify-between">
                                    <span className="text-[#60a5fa] font-medium flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                                      Engagement
                                    </span>
                                    <span className="font-bold text-white pl-2">
                                      {payload[0].value?.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6 justify-between">
                                    <span className="text-[#4ade80] font-medium flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
                                      Portée (Reach)
                                    </span>
                                    <span className="font-bold text-white pl-2">
                                      {payload[1].value?.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="engagement" stroke="#60a5fa" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="reach" stroke="#4ade80" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              <GlassCard className="relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">Comparaison plateformes</h3>
                    <p className="text-xs text-gray-400">Abonnés réels par réseau social</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModule("Parametres")}
                      className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>💼 Connecter LinkedIn</span>
                    </button>
                  </div>
                </div>

                <div className="h-64 pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="platform"
                        stroke={theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                        tick={{ fill: theme === "dark" ? "#a1a1aa" : "#475569", fontSize: 11 }}
                      />
                      <YAxis
                        stroke={theme === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                        tick={{ fill: theme === "dark" ? "#a1a1aa" : "#475569", fontSize: 11 }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950/95 border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                  <p className="text-xs font-bold text-white">{data.platform}</p>
                                </div>
                                {data.isConnected ? (
                                  <div className="mt-1 flex items-baseline gap-1">
                                    <span className="text-lg font-black text-white">
                                      {data.value.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-gray-400">abonnés</span>
                                  </div>
                                ) : (
                                  <div className="mt-1">
                                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                                      ⚠️ Non connecté
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
                                      L'intégration LinkedIn API n'est pas connectée. Aucune donnée réelle disponible.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {platformData.map((item) => (
                          <Cell 
                            key={item.platform} 
                            fill={item.isConnected ? item.color : "rgba(71, 85, 105, 0.2)"}
                            stroke={item.isConnected ? "none" : "rgba(100, 116, 139, 0.4)"}
                            strokeDasharray={item.isConnected ? undefined : "4 4"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            {/* ── Live Performance Cards — Real Data ── */}
            {(() => {
              // ── Compute real task stats from Supabase taskColumns ──
              const allTasks = Object.values(taskColumns).flat();
              const totalTasks = allTasks.length;
              const completedTasks = (taskColumns["Termine"] || []).length;
              const inProgressTasks = (taskColumns["En cours"] || []).length;
              const overdueTasks = (taskColumns["Retard"] || []).length;
              const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const onTimeRate = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 0;

              // ── Compute real content performance from Meta API posts ──
              const totalPostLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
              const totalPostComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
              const totalPostShares = posts.reduce((sum, p) => sum + (p.shares || 0), 0);
              const totalPosts = posts.length;
              const avgEngagement = totalPosts > 0 ? ((totalPostLikes + totalPostComments + totalPostShares) / totalPosts).toFixed(1) : "0";
              const bestPost = posts.length > 0 ? posts.reduce((best, p) => (p.likes || 0) > (best.likes || 0) ? p : best, posts[0]) : null;

              // ── Audience Growth from Meta API ──
              const totalFollowers = (displayInsights?.facebook?.followers ?? 0) + (displayInsights?.instagram?.followers ?? 0);
              const totalReach = displayInsights?.metrics?.totalReach ?? 0;
              const totalImpressions = posts.reduce((sum, p) => sum + (p.impressions || 0), 0);
              const engagementRate = totalFollowers > 0 ? (((totalPostLikes + totalPostComments) / totalFollowers) * 100).toFixed(2) : "0";

              // ── Radial progress ring helper ──
              const RadialProgress = ({ value, max, size = 56, strokeWidth = 5, color, children }: any) => {
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const pct = max > 0 ? Math.min(value / max, 1) : 0;
                const offset = circumference * (1 - pct);
                return (
                  <div className="relative" style={{ width: size, height: size }}>
                    <svg width={size} height={size} className="transform -rotate-90">
                      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth={strokeWidth} />
                      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {children}
                    </div>
                  </div>
                );
              };

              return (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {/* ══════ Card 1: Team Performance (Real Supabase tasks) ══════ */}
                  <div className={clsx(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group hover:shadow-2xl",
                    theme === "dark"
                      ? "border-emerald-500/15 bg-gradient-to-br from-emerald-950/30 via-[#071225]/80 to-slate-950/60 hover:border-emerald-400/30"
                      : "border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 hover:border-emerald-300 shadow-sm"
                  )}>
                    <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-500/8 rounded-full blur-3xl group-hover:bg-emerald-500/15 transition-all pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />

                    <div className="relative flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "flex h-10 w-10 items-center justify-center rounded-xl border",
                          theme === "dark"
                            ? "border-emerald-400/20 bg-emerald-500/10"
                            : "border-emerald-200 bg-emerald-50"
                        )}>
                          <ListTodo className={clsx("h-5 w-5", theme === "dark" ? "text-emerald-400" : "text-emerald-600")} />
                        </div>
                        <div>
                          <p className={clsx("text-sm font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>Performance équipe</p>
                          <p className={clsx("text-[10px]", theme === "dark" ? "text-emerald-300/60" : "text-emerald-600/60")}>Supabase Tasks · Live</p>
                        </div>
                      </div>
                      <RadialProgress value={completedTasks} max={totalTasks} color={theme === "dark" ? "#34d399" : "#059669"}>
                        <span className={clsx("text-[11px] font-black", theme === "dark" ? "text-emerald-300" : "text-emerald-700")}>{completionRate}%</span>
                      </RadialProgress>
                    </div>

                    <div className="relative grid grid-cols-2 gap-2.5">
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-emerald-100 bg-emerald-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Terminées</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-white" : "text-slate-800")}>{completedTasks}<span className={clsx("text-xs font-medium ml-0.5", theme === "dark" ? "text-gray-500" : "text-slate-400")}>/{totalTasks}</span></p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-emerald-100 bg-emerald-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>En cours</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-blue-400" : "text-blue-600")}>{inProgressTasks}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-emerald-100 bg-emerald-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Retard</p>
                        <p className={clsx("text-lg font-black mt-0.5", overdueTasks > 0 ? "text-red-400" : theme === "dark" ? "text-emerald-400" : "text-emerald-600")}>{overdueTasks}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-emerald-100 bg-emerald-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>À temps</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-emerald-400" : "text-emerald-600")}>{onTimeRate}%</p>
                      </div>
                    </div>
                  </div>

                  {/* ══════ Card 2: Content Performance (Real Meta API posts) ══════ */}
                  <div className={clsx(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group hover:shadow-2xl",
                    theme === "dark"
                      ? "border-blue-500/15 bg-gradient-to-br from-blue-950/30 via-[#071225]/80 to-slate-950/60 hover:border-blue-400/30"
                      : "border-blue-200/60 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 hover:border-blue-300 shadow-sm"
                  )}>
                    <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/8 rounded-full blur-3xl group-hover:bg-blue-500/15 transition-all pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />

                    <div className="relative flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "flex h-10 w-10 items-center justify-center rounded-xl border",
                          theme === "dark"
                            ? "border-blue-400/20 bg-blue-500/10"
                            : "border-blue-200 bg-blue-50"
                        )}>
                          <Zap className={clsx("h-5 w-5", theme === "dark" ? "text-blue-400" : "text-blue-600")} />
                        </div>
                        <div>
                          <p className={clsx("text-sm font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>Content Performance</p>
                          <p className={clsx("text-[10px]", theme === "dark" ? "text-blue-300/60" : "text-blue-600/60")}>Meta Graph API · {totalPosts} posts</p>
                        </div>
                      </div>
                      <RadialProgress value={totalPostLikes} max={totalPostLikes + totalPostComments + totalPostShares || 1} color={theme === "dark" ? "#60a5fa" : "#2563eb"}>
                        <Heart className={clsx("w-3.5 h-3.5", theme === "dark" ? "text-blue-300" : "text-blue-600")} />
                      </RadialProgress>
                    </div>

                    <div className="relative grid grid-cols-2 gap-2.5">
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-blue-100 bg-blue-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Total Likes</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-white" : "text-slate-800")}>{totalPostLikes.toLocaleString()}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-blue-100 bg-blue-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Comments</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-blue-400" : "text-blue-600")}>{totalPostComments.toLocaleString()}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-blue-100 bg-blue-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Partages</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-cyan-400" : "text-cyan-600")}>{totalPostShares.toLocaleString()}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-blue-100 bg-blue-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Moy/Post</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-amber-400" : "text-amber-600")}>{avgEngagement}</p>
                      </div>
                    </div>

                    {bestPost && (
                      <div className={clsx(
                        "relative mt-3 rounded-xl border px-3 py-2 flex items-center gap-2",
                        theme === "dark" ? "border-white/5 bg-white/[0.02]" : "border-blue-100 bg-blue-50/30"
                      )}>
                        <Rocket className={clsx("w-3.5 h-3.5 shrink-0", theme === "dark" ? "text-[#D4A017]" : "text-amber-500")} />
                        <p className={clsx("text-[10px] truncate", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                          <span className="font-semibold">Best:</span> {bestPost.platform} · {bestPost.likes} likes
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ══════ Card 3: Audience Growth (Real Meta API data) ══════ */}
                  <div className={clsx(
                    "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 group hover:shadow-2xl",
                    theme === "dark"
                      ? "border-purple-500/15 bg-gradient-to-br from-purple-950/30 via-[#071225]/80 to-slate-950/60 hover:border-purple-400/30"
                      : "border-purple-200/60 bg-gradient-to-br from-purple-50/60 via-white to-slate-50 hover:border-purple-300 shadow-sm"
                  )}>
                    <div className="absolute -top-16 -right-16 w-36 h-36 bg-purple-500/8 rounded-full blur-3xl group-hover:bg-purple-500/15 transition-all pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />

                    <div className="relative flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "flex h-10 w-10 items-center justify-center rounded-xl border",
                          theme === "dark"
                            ? "border-purple-400/20 bg-purple-500/10"
                            : "border-purple-200 bg-purple-50"
                        )}>
                          <Users className={clsx("h-5 w-5", theme === "dark" ? "text-purple-400" : "text-purple-600")} />
                        </div>
                        <div>
                          <p className={clsx("text-sm font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>Audience Growth</p>
                          <p className={clsx("text-[10px]", theme === "dark" ? "text-purple-300/60" : "text-purple-600/60")}>Meta Graph API · Live</p>
                        </div>
                      </div>
                      <RadialProgress value={parseFloat(engagementRate)} max={10} color={theme === "dark" ? "#a78bfa" : "#7c3aed"}>
                        <span className={clsx("text-[10px] font-black", theme === "dark" ? "text-purple-300" : "text-purple-700")}>{engagementRate}%</span>
                      </RadialProgress>
                    </div>

                    <div className="relative grid grid-cols-2 gap-2.5">
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-purple-100 bg-purple-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Total Followers</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-white" : "text-slate-800")}>{totalFollowers.toLocaleString()}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-purple-100 bg-purple-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Impressions</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-pink-400" : "text-pink-600")}>{totalImpressions.toLocaleString()}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-purple-100 bg-purple-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Portée</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-purple-400" : "text-purple-600")}>{totalReach.toLocaleString()}</p>
                      </div>
                      <div className={clsx("rounded-xl border px-3 py-2.5", theme === "dark" ? "border-white/5 bg-white/[0.03]" : "border-purple-100 bg-purple-50/40")}>
                        <p className={clsx("text-[9px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Eng. Rate</p>
                        <p className={clsx("text-lg font-black mt-0.5", theme === "dark" ? "text-[#D4A017]" : "text-amber-600")}>{engagementRate}%</p>
                      </div>
                    </div>

                    <div className={clsx(
                      "relative mt-3 rounded-xl border px-3 py-2 flex items-center gap-3",
                      theme === "dark" ? "border-white/5 bg-white/[0.02]" : "border-purple-100 bg-purple-50/30"
                    )}>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span className={clsx("text-[10px] font-bold", theme === "dark" ? "text-gray-300" : "text-slate-600")}>{(displayInsights?.facebook?.followers ?? 0).toLocaleString()}</span>
                      </div>
                      <div className={clsx("w-px h-3", theme === "dark" ? "bg-white/10" : "bg-slate-200")} />
                      <div className="flex items-center gap-1.5">
                        <Instagram className="w-3 h-3 text-pink-400" />
                        <span className={clsx("text-[10px] font-bold", theme === "dark" ? "text-gray-300" : "text-slate-600")}>{(displayInsights?.instagram?.followers ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ══════════════════════════════════════════════════════ */}
            {/* ══════ TOP PUBLICATIONS — Per Platform Top 3 ══════ */}
            {/* ══════════════════════════════════════════════════════ */}
            {(() => {
              const scorePost = (p: Post) => ({
                ...p,
                engagementScore: (p.views || 0) * 3 + (p.likes || 0) * 2 + (p.comments || 0) * 5 + (p.shares || 0) * 4 + (p.impressions || 0),
              });

              const fbTop = [...posts].filter(p => p.platform === "Facebook").map(scorePost).sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 3);
              const igTop = [...posts].filter(p => p.platform === "Instagram").map(scorePost).sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 3);

              if (fbTop.length === 0 && igTop.length === 0) return null;

              const formatNum = (n: number) => {
                if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
                if (n >= 1000) return (n / 1000).toFixed(1) + "K";
                return String(n);
              };

              type ScoredPost = Post & { engagementScore: number };

              const renderPlatformSection = (
                platformPosts: ScoredPost[],
                platform: "Facebook" | "Instagram"
              ) => {
                if (platformPosts.length === 0) return null;
                const isFb = platform === "Facebook";
                const topPost = platformPosts[0];
                const runnersUp = platformPosts.slice(1);
                const maxScore = topPost.engagementScore || 1;

                const PlatIcon = isFb ? Globe : Instagram;

                const heroGradient = theme === "dark"
                  ? isFb
                    ? "border-blue-500/30 bg-gradient-to-br from-blue-950/60 via-[#071225] to-blue-900/20 hover:border-blue-400/50 shadow-lg shadow-blue-500/5"
                    : "border-pink-500/30 bg-gradient-to-br from-pink-950/50 via-[#071225] to-purple-900/20 hover:border-pink-400/50 shadow-lg shadow-pink-500/5"
                  : isFb
                    ? "border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50 hover:border-blue-300 shadow-md shadow-blue-100/50"
                    : "border-pink-200 bg-gradient-to-br from-pink-50/80 via-white to-purple-50/50 hover:border-pink-300 shadow-md shadow-pink-100/50";

                const badgeGradient = isFb
                  ? "from-blue-500 to-blue-600"
                  : "from-pink-500 via-purple-500 to-pink-600";

                const badgeShadow = isFb ? "shadow-blue-500/40" : "shadow-pink-500/40";

                const barGradient = isFb
                  ? "bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-300"
                  : "bg-gradient-to-r from-pink-500 via-purple-400 to-pink-300";

                return (
                  <div className="space-y-4">
                    {/* Platform Header */}
                    <div className="flex items-center gap-2.5">
                      <div className={clsx(
                        "flex h-9 w-9 items-center justify-center rounded-xl border shadow-md",
                        theme === "dark"
                          ? isFb ? "border-blue-400/30 bg-blue-600/20 shadow-blue-500/20" : "border-pink-400/30 bg-gradient-to-br from-pink-600/20 to-purple-600/20 shadow-pink-500/20"
                          : isFb ? "border-blue-200 bg-blue-100 shadow-blue-200/50" : "border-pink-200 bg-gradient-to-br from-pink-100 to-purple-100 shadow-pink-200/50"
                      )}>
                        <PlatIcon className={clsx("h-4 w-4", theme === "dark" ? isFb ? "text-blue-400" : "text-pink-400" : isFb ? "text-blue-600" : "text-pink-600")} />
                      </div>
                      <div>
                        <p className={clsx("text-sm font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>{platform}</p>
                        <p className={clsx("text-[10px]", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Top {platformPosts.length} publications</p>
                      </div>
                    </div>

                    {/* #1 Hero Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className={clsx(
                        "relative overflow-hidden rounded-2xl border p-0 transition-all duration-500 group hover:shadow-2xl",
                        heroGradient
                      )}
                    >
                      <div className={clsx(
                        "absolute -top-14 -right-14 w-36 h-36 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity pointer-events-none",
                        isFb ? "bg-blue-500/20" : "bg-pink-500/20"
                      )} />

                      <div className="relative aspect-[16/9] overflow-hidden">
                        {topPost.image ? (
                          <img
                            src={topPost.image}
                            alt={topPost.title?.substring(0, 50)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className={clsx("w-full h-full flex items-center justify-center", theme === "dark" ? "bg-slate-800" : "bg-slate-100")}>
                            <Megaphone className="w-10 h-10 text-gray-500" />
                          </div>
                        )}
                        <div className={clsx("absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-1 shadow-lg", badgeGradient, badgeShadow)}>
                          <Crown className="w-3.5 h-3.5 text-white" />
                          <span className="text-[10px] font-black text-white uppercase tracking-wider">#1 Top</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <p className={clsx("text-xs font-bold leading-relaxed line-clamp-2", theme === "dark" ? "text-white" : "text-slate-800")}>
                          {topPost.title}
                        </p>
                        <p className={clsx("text-[10px] font-medium", theme === "dark" ? "text-gray-500" : "text-slate-400")}>
                          {topPost.date} · {topPost.dateTime}
                        </p>

                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: "Vues", value: topPost.views || 0, icon: Eye, color: theme === "dark" ? "text-cyan-400" : "text-cyan-600" },
                            { label: "Likes", value: topPost.likes || 0, icon: Heart, color: theme === "dark" ? "text-rose-400" : "text-rose-500" },
                            { label: "Comments", value: topPost.comments || 0, icon: MessageCircle, color: theme === "dark" ? "text-blue-400" : "text-blue-600" },
                            { label: "Partages", value: topPost.shares || 0, icon: Share2, color: theme === "dark" ? "text-emerald-400" : "text-emerald-600" },
                          ].map((m, idx) => (
                            <div key={idx} className={clsx(
                              "rounded-lg border px-1.5 py-2 text-center transition-all hover:scale-[1.03]",
                              theme === "dark" ? "border-white/5 bg-white/[0.03]" : isFb ? "border-blue-100 bg-blue-50/40" : "border-pink-100 bg-pink-50/40"
                            )}>
                              <m.icon className={clsx("w-3 h-3 mx-auto mb-0.5", m.color)} />
                              <p className={clsx("text-[8px] font-semibold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>{m.label}</p>
                              <p className={clsx("text-sm font-black mt-0.5 tabular-nums", theme === "dark" ? "text-white" : "text-slate-800")}>{formatNum(m.value)}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={clsx("text-[8px] font-bold uppercase tracking-wider", theme === "dark" ? "text-gray-500" : "text-slate-400")}>Score</span>
                            <span className={clsx("text-[10px] font-black tabular-nums", theme === "dark" ? isFb ? "text-blue-400" : "text-pink-400" : isFb ? "text-blue-600" : "text-pink-600")}>{topPost.engagementScore.toLocaleString()}</span>
                          </div>
                          <div className={clsx("h-1.5 rounded-full overflow-hidden", theme === "dark" ? "bg-white/5" : "bg-slate-200")}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                              className={clsx("h-full rounded-full shadow-sm", barGradient)}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* #2 and #3 Runners Up */}
                    {runnersUp.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {runnersUp.map((post, idx) => {
                          const rank = idx + 2;
                          const pctBar = Math.round((post.engagementScore / maxScore) * 100);
                          return (
                            <motion.div
                              key={post.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.12 + 0.3 }}
                              className={clsx(
                                "relative overflow-hidden rounded-xl border p-0 transition-all duration-300 group hover:shadow-xl hover:-translate-y-0.5",
                                theme === "dark"
                                  ? isFb ? "border-blue-500/15 bg-gradient-to-br from-blue-950/40 to-[#071225] hover:border-blue-400/30" : "border-pink-500/15 bg-gradient-to-br from-pink-950/30 to-[#071225] hover:border-pink-400/30"
                                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                              )}
                            >
                              <div className="relative aspect-[16/9] overflow-hidden">
                                {post.image ? (
                                  <img src={post.image} alt={post.title?.substring(0, 40)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className={clsx("w-full h-full flex items-center justify-center", theme === "dark" ? "bg-slate-800/60" : "bg-slate-100")}>
                                    <Megaphone className="w-6 h-6 text-gray-500" />
                                  </div>
                                )}
                                <div className={clsx(
                                  "absolute top-2 left-2 flex items-center justify-center h-6 w-6 rounded-full border text-[10px] font-black",
                                  rank === 2
                                    ? "bg-gradient-to-br from-slate-300 to-slate-400 border-white/40 text-slate-800 shadow-md"
                                    : "bg-gradient-to-br from-amber-700 to-amber-800 border-amber-500/40 text-amber-100 shadow-md"
                                )}>
                                  #{rank}
                                </div>
                              </div>
                              <div className="p-2.5 space-y-2">
                                <p className={clsx("text-[10px] font-semibold leading-snug line-clamp-2", theme === "dark" ? "text-gray-200" : "text-slate-700")}>
                                  {post.title}
                                </p>
                                <div className="flex items-center gap-2.5 text-[9px]">
                                  <span className={clsx("flex items-center gap-0.5 font-bold", theme === "dark" ? "text-cyan-400" : "text-cyan-600")}>
                                    <Eye className="w-2.5 h-2.5" /> {formatNum(post.views || 0)}
                                  </span>
                                  <span className={clsx("flex items-center gap-0.5 font-bold", theme === "dark" ? "text-rose-400" : "text-rose-500")}>
                                    <Heart className="w-2.5 h-2.5" /> {formatNum(post.likes || 0)}
                                  </span>
                                  <span className={clsx("flex items-center gap-0.5 font-bold", theme === "dark" ? "text-blue-400" : "text-blue-600")}>
                                    <MessageCircle className="w-2.5 h-2.5" /> {post.comments || 0}
                                  </span>
                                </div>
                                <div>
                                  <div className={clsx("h-1 rounded-full overflow-hidden", theme === "dark" ? "bg-white/5" : "bg-slate-200")}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pctBar}%` }}
                                      transition={{ duration: 0.8, delay: idx * 0.15 + 0.5, ease: "easeOut" }}
                                      className={clsx("h-full rounded-full", isFb ? "bg-gradient-to-r from-blue-500 to-blue-400" : "bg-gradient-to-r from-pink-500 to-purple-400")}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="space-y-5">
                  {/* Section Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg",
                        theme === "dark"
                          ? "border-[#D4A017]/30 bg-gradient-to-br from-[#D4A017]/20 to-amber-600/10 shadow-[#D4A017]/20"
                          : "border-amber-300 bg-gradient-to-br from-amber-100 to-yellow-50 shadow-amber-200/50"
                      )}>
                        <Trophy className={clsx("h-5 w-5", theme === "dark" ? "text-[#D4A017]" : "text-amber-600")} />
                      </div>
                      <div>
                        <h3 className={clsx("text-lg font-bold", theme === "dark" ? "text-white" : "text-slate-800")}>
                          Top Publications
                        </h3>
                        <p className={clsx("text-[11px]", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                          Top 3 par plateforme · Classées par engagement
                        </p>
                      </div>
                    </div>
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
                      theme === "dark"
                        ? "border-[#D4A017]/30 bg-[#D4A017]/10 text-[#D4A017]"
                        : "border-amber-300 bg-amber-50 text-amber-700"
                    )}>
                      <Flame className="w-3 h-3" />
                      {fbTop.length + igTop.length} meilleures
                    </span>
                  </div>

                  {/* Dual Platform Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderPlatformSection(fbTop, "Facebook")}
                    {renderPlatformSection(igTop, "Instagram")}
                  </div>
                </div>
              );
            })()}


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
                    <GenerateButton disabled={currentUser?.role !== "admin"} />
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
                                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
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
                                <div className="grid grid-cols-1 gap-2 text-center sm:grid-cols-3">
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
            <div className="grid grid-cols-7 gap-1.5 mb-3 text-center text-[10px] font-semibold text-[#D4A017] uppercase tracking-wider sm:text-xs">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mer</div>
              <div>Jeu</div>
              <div>Ven</div>
              <div>Sam</div>
              <div>Dim</div>
            </div>

            {/* Calendar dynamic weekly grid */}
            <div className="grid grid-cols-7 gap-2 custom-scrollbar max-h-[calc(100vh-290px)] overflow-y-auto overflow-x-hidden pb-4">
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
                      <div className="flex items-center justify-between mb-2">
                        <label className={clsx(
                          "block text-xs font-bold uppercase tracking-wider",
                          theme === "dark" ? "text-gray-400" : "text-slate-500"
                        )}>
                          {language === "العربية" ? "صورة مخصصة (اختياري)" : language === "English" ? "Custom Image (Optional)" : "Image personnalisée (Optionnel)"}
                        </label>
                        
                        {/* Selector Tabs */}
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => setImageInputMode("link")}
                            className={clsx(
                              "px-2.5 py-1 rounded-lg transition-all",
                              imageInputMode === "link"
                                ? "bg-[#D4A017] text-slate-950"
                                : "text-gray-400 hover:text-white"
                            )}
                          >
                            {language === "العربية" ? "رابط" : language === "English" ? "Link" : "Lien"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageInputMode("upload")}
                            className={clsx(
                              "px-2.5 py-1 rounded-lg transition-all",
                              imageInputMode === "upload"
                                ? "bg-[#D4A017] text-slate-950"
                                : "text-gray-400 hover:text-white"
                            )}
                          >
                            {language === "العربية" ? "تحميل" : language === "English" ? "Upload" : "Télécharger"}
                          </button>
                        </div>
                      </div>

                      {imageInputMode === "link" ? (
                        <input
                          type="text"
                          value={newPubCustomImage}
                          onChange={(e) => setNewPubCustomImage(e.target.value)}
                          placeholder="https://example.com/my-image.jpg"
                          className={clsx(
                            "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                            theme === "dark"
                              ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                              : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                          )}
                        />
                      ) : (
                        <div className={clsx(
                          "relative rounded-xl border p-4 text-center transition-all flex flex-col items-center justify-center min-h-[110px] cursor-pointer hover:border-[#D4A017]/40",
                          theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-black/5"
                        )}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            disabled={isUploadingImage}
                          />
                          {isUploadingImage ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-5 h-5 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
                              <p className="text-[10px] text-[#D4A017] font-bold">
                                {language === "العربية" ? "جاري الرفع..." : language === "English" ? "Uploading..." : "Téléchargement..."}
                              </p>
                            </div>
                          ) : newPubCustomImage ? (
                            <div className="flex items-center gap-3 w-full">
                              <img
                                src={newPubCustomImage}
                                alt="Custom upload preview"
                                className="w-14 h-14 rounded-lg object-cover border border-[#D4A017]/30 shadow-md shadow-[#D4A017]/5"
                              />
                              <div className="text-left flex-1 min-w-0">
                                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <span>🟢</span>
                                  {language === "العربية" ? "تم الرفع بنجاح" : language === "English" ? "Uploaded successfully" : "Téléchargé avec succès"}
                                </p>
                                <p className="text-[9px] text-gray-500 truncate">{newPubCustomImage}</p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewPubCustomImage("");
                                }}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-400 px-2 py-1 rounded bg-rose-500/10 transition-all z-20"
                              >
                                {language === "العربية" ? "حذف" : language === "English" ? "Delete" : "Supprimer"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <WandSparkles className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
                              <p className="text-[11px] text-gray-400 font-semibold">
                                {language === "العربية" ? "اسحب الصورة هنا أو اضغط للتصفح" : language === "English" ? "Drag & drop image here or click to browse" : "Glissez-déposez une image ici ou cliquez pour parcourir"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
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
                        type="submit"
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
                <PremiumEmptyState
                  icon={Database}
                  tone="amber"
                  title="Aucune donnée disponible"
                  description="Assurez-vous que le sheetId est bien configuré et contient des publications."
                  note="Les lignes Google Sheet s'afficheront ici automatiquement."
                />
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
                        <th className="p-3">Image</th>
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
                            <td className="p-3 max-w-[120px] truncate">
                              {pub.custom_image_url && pub.custom_image_url !== "false" ? (
                                <a 
                                  href={pub.custom_image_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[#D4A017] hover:underline flex items-center gap-1.5 font-semibold"
                                >
                                  <img 
                                    src={pub.custom_image_url} 
                                    alt="Custom upload preview"
                                    className="w-8 h-8 rounded object-cover border border-white/10 shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                  <span className="truncate text-[10px]">{pub.custom_image_url}</span>
                                </a>
                              ) : (
                                <span className="text-gray-500">Générée (AI)</span>
                              )}
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
                        <PremiumEmptyState
                          icon={ListTodo}
                          tone="purple"
                          title="Aucune tâche"
                          description="Glissez une tâche ici"
                          note="Créez ou déplacez une carte pour commencer."
                        />
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
      const totalTeamTasks = dynamicTeam.reduce((sum, m) => sum + m.tasks, 0);
      const avgTeamScore = dynamicTeam.length > 0
        ? Math.round(dynamicTeam.reduce((sum, m) => sum + m.score, 0) / dynamicTeam.length)
        : 100;

      return (
        <PageTransition moduleKey="team">
          {/* Real Stats Row at the top */}
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <div className={clsx(
              "backdrop-blur-md border rounded-2xl p-4 flex items-center justify-between transition-all duration-300",
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-slate-200 shadow-sm"
            )}>
              <div>
                <p className={clsx("text-[10px] font-bold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                  {language === "العربية" ? "أعضاء الفريق" : language === "English" ? "Team Members" : "Membres de l'équipe"}
                </p>
                <h4 className={clsx("text-2xl font-bold mt-1", theme === "dark" ? "text-white" : "text-slate-800")}>{dynamicTeam.length}</h4>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-lg">👥</div>
            </div>

            <div className={clsx(
              "backdrop-blur-md border rounded-2xl p-4 flex items-center justify-between transition-all duration-300",
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-slate-200 shadow-sm"
            )}>
              <div>
                <p className={clsx("text-[10px] font-bold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                  {language === "العربية" ? "المهام المعينة" : language === "English" ? "Assigned Tasks" : "Tâches assignées"}
                </p>
                <h4 className={clsx("text-2xl font-bold mt-1", theme === "dark" ? "text-white" : "text-slate-800")}>{totalTeamTasks}</h4>
              </div>
              <div className="h-10 w-10 rounded-xl bg-[#D4A017]/10 flex items-center justify-center text-[#D4A017] text-lg">📋</div>
            </div>

            <div className={clsx(
              "backdrop-blur-md border rounded-2xl p-4 flex items-center justify-between transition-all duration-300",
              theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-slate-200 shadow-sm"
            )}>
              <div>
                <p className={clsx("text-[10px] font-bold uppercase tracking-wider", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                  {language === "العربية" ? "كفاءة الفريق" : language === "English" ? "Average Efficiency" : "Efficacité moyenne"}
                </p>
                <h4 className={clsx("text-2xl font-bold mt-1", theme === "dark" ? "text-white" : "text-slate-800")}>{avgTeamScore}%</h4>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">⚡</div>
            </div>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h3 className={clsx(
                "text-base font-bold transition-colors duration-300",
                theme === "dark" ? "text-white" : "text-slate-800"
              )}>
                {t("team_performance", "Performance équipe")}
              </h3>
              <span className="text-xs text-[#D4A017] bg-[#D4A017]/10 px-2.5 py-1 rounded-lg border border-[#D4A017]/20">
                {language === "العربية" ? "إدارة الأعضاء والصلاحيات" : language === "English" ? "Roles & Permissions Management" : "Gestion des Rôles & Permissions"}
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {dynamicTeam.length === 0 ? (
                <div className="col-span-2">
                  <PremiumEmptyState
                    icon={Users}
                    tone="blue"
                    title={language === "العربية" ? "لا يوجد أعضاء في الفريق حالياً" : language === "English" ? "No team members found" : "Aucun membre de l'équipe"}
                    description={language === "العربية"
                      ? "قم بتسجيل حساب جديد بدور (Manager, Client...) عبر بوابة التسجيل للظهور هنا."
                      : language === "English"
                      ? "Register new accounts with team roles (Manager, Client...) via the portal to see them here."
                      : "Enregistrez de nouveaux comptes avec des rôles d'équipe (Manager, Client...) via le portail d'inscription pour les afficher ici."}
                    note="Synchronisation en temps réel avec la base utilisateur."
                  />
                </div>
              ) : (
                dynamicTeam.map((member, i) => {
                  const initials = member.name
                    ? member.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                    : "CL";
                  
                  const isMe = currentUser && (
                    member.email.toLowerCase() === currentUser.username.toLowerCase() ||
                    member.name.toLowerCase() === currentUser.name.toLowerCase()
                  );

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={clsx(
                        "rounded-2xl border p-5 transition duration-300 flex flex-col justify-between relative overflow-hidden",
                        theme === "dark"
                          ? "border-white/10 bg-white/5 hover:bg-white/8 text-white"
                          : "border-slate-200 bg-white hover:shadow-md text-slate-800 shadow-sm"
                      )}
                    >
                      {/* Top Header Card */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Initials Avatar */}
                            <div className={clsx(
                              "h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm text-slate-950 shrink-0 shadow-inner select-none bg-gradient-to-tr",
                              member.accessRole === "admin"
                                ? "from-[#D4A017] to-amber-400"
                                : member.accessRole === "manager"
                                ? "from-blue-500 to-indigo-400"
                                : "from-emerald-500 to-teal-400"
                            )}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold truncate text-sm">{member.name}</p>
                                {isMe && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-[#D4A017]/20 border border-[#D4A017]/40 px-1.5 py-0.5 text-[9px] font-bold text-[#D4A017] uppercase tracking-wide shrink-0">
                                    Moi 👤
                                  </span>
                                )}
                              </div>
                              <p className={clsx("text-xs truncate", theme === "dark" ? "text-gray-400" : "text-slate-500")}>
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteTeamMember(member.id)}
                            className={clsx(
                              "h-8 w-8 inline-flex items-center justify-center rounded-xl border transition-all shrink-0",
                              theme === "dark"
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                                : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            )}
                            title={language === "العربية" ? "حذف" : language === "English" ? "Delete" : "Supprimer"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Middle Stats pills */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={clsx(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                            member.accessRole === "admin"
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : member.accessRole === "manager"
                              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          )}>
                            {labelForRole(member.accessRole || "client")}
                          </span>
                          <span className={clsx(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-md border",
                            theme === "dark" ? "bg-white/5 border-white/10 text-gray-300" : "bg-slate-100 border-slate-200 text-slate-600"
                          )}>
                            {member.tasks} {member.tasks > 1 ? "tâches assignées" : "tâche assignée"}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Controls / Admin inputs */}
                      <div className="mt-5 space-y-3 pt-3 border-t border-white/5">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Role Access</label>
                            <select
                              value={teamRoleDrafts[member.id] !== undefined ? teamRoleDrafts[member.id] : (member.accessRole || "client")}
                              onChange={(e) => setTeamRoleDrafts((prev) => ({ ...prev, [member.id]: e.target.value }))}
                              className={clsx(
                                "w-full rounded-xl border px-3 py-2 text-xs font-semibold outline-none transition-all cursor-pointer",
                                theme === "dark"
                                  ? "border-white/10 bg-[#0b162b] text-white focus:border-[#D4A017]/40 focus:bg-[#0d1b33]"
                                  : "border-slate-300 bg-slate-50 text-slate-900 focus:border-[#D4A017]/50 focus:bg-white"
                              )}
                            >
                              {teamRoleOptions.map((role) => (
                                <option key={role} value={role}>
                                  {labelForRole(role)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {currentUser?.role === "admin" && (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Admin Pass Control</label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={teamPasswordDrafts[member.id] || ""}
                                  onChange={(e) => setTeamPasswordDrafts((prev) => ({ ...prev, [member.id]: e.target.value }))}
                                  placeholder={language === "العربية" ? "كلمة مرور جديدة" : language === "English" ? "New password" : "Nouveau pass"}
                                  className={clsx(
                                    "w-full rounded-xl border pl-3 pr-8 py-2 text-xs outline-none transition-all font-mono",
                                    theme === "dark"
                                      ? "border-white/10 bg-[#0b162b] text-white placeholder-gray-600 focus:border-[#D4A017]/40"
                                      : "border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-[#D4A017]/50"
                                  )}
                                />
                                <KeyRound className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Explicit Save button inside card */}
                        <button
                          type="button"
                          disabled={isSavingMember[member.id]}
                          onClick={() => saveTeamMemberChanges(member.id)}
                          className={clsx(
                            "w-full inline-flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition-all shadow-md select-none border border-transparent",
                            theme === "dark"
                              ? "bg-[#D4A017] hover:bg-[#b07b12] text-slate-950 disabled:opacity-50"
                              : "bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
                          )}
                        >
                          {isSavingMember[member.id] ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent dark:border-white shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                          )}
                          {language === "العربية" ? "حفظ التعديلات" : language === "English" ? "Save Information" : "Sauvegarder les informations"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
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
                  <PremiumEmptyState
                    icon={Megaphone}
                    tone="pink"
                    title="Aucune publication trouvée"
                    description="Change de filtre ou ajoute une nouvelle publication pour remplir cette vue."
                    note="Le flux des publications s'affichera ici dès qu'il sera synchronisé."
                  />
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
                      <PremiumEmptyState
                        icon={MessageCircle}
                        tone="purple"
                        title="Aucun commentaire sur cette publication"
                        description="Les nouveaux commentaires s'afficheront automatiquement dès leur réception."
                        note="Le suivi conversationnel est prêt à se remplir en direct."
                      />
                    ) : (
                      currentSelectedPost.commentsList.map((c: any) => {
                        const isSelectedToReply = selectedComment && String(selectedComment.id) === String(c.id);
                        const isCM = c.isReply || c.from === "Équipe (Moi)" || (currentUser && c.from === currentUser.name);
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
                              {!c.isReply && !isCM && currentUser?.role !== "client" && (
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

                    {currentUser?.role === "client" ? (
                      <div className="w-full p-4 rounded-xl border text-xs font-bold text-center border-amber-500/20 bg-amber-500/5 text-amber-400/90 select-none">
                        🔒 Mode lecture seule — Les comptes clients ne disposent pas des permissions requises pour répondre aux commentaires.
                      </div>
                    ) : (
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
                    )}
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
                  <PremiumEmptyState
                    icon={Bell}
                    tone="amber"
                    title="Aucune notification"
                    description="Vous êtes à jour."
                    note="Les nouvelles alertes apparaîtront ici dès qu'elles arriveront."
                  />
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
                  <GenerateButton disabled={currentUser?.role !== "admin"} />
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
                <li className="flex justify-between"><span>{t("manager_role", "Manager")}</span> <span className="text-blue-400">Campagnes + Équipe (Sauf Paramètres)</span></li>
                <li className="flex justify-between"><span>{t("client_role", "Client")}</span> <span className="text-amber-400">Visualisation + Messages</span></li>
              </ul>
            </GlassCard>

            
          </div>

          {/* API Credentials Configuration Card (Editable keys!) */}
          <GlassCard className="border-amber-500/10 bg-gradient-to-br from-amber-500/5 to-transparent">
            <h4 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#D4A017]" />
              Configuration des Identifiants & API
            </h4>
            <p className="text-xs text-gray-400 mb-4">
              Mettez à jour vos identifiants d'API. Les modifications seront appliquées immédiatement sur votre instance Supabase (Production Vercel) et sauvegardées localement dans votre fichier .env.
            </p>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Meta Graph Access Token (Facebook & Instagram)
                  </label>
                  <div className="relative">
                    <input
                      type={showMetaToken ? "text" : "password"}
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      placeholder="Entrez votre jeton d'accès Meta (EAAS...)"
                      className={clsx(
                        "w-full rounded-xl border pl-3.5 pr-10 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                        theme === "dark"
                          ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                          : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMetaToken(!showMetaToken)}
                      className={clsx(
                        "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors",
                        theme === "dark"
                          ? "text-gray-400 hover:text-white hover:bg-white/10"
                          : "text-slate-400 hover:text-slate-700 hover:bg-black/5"
                      )}
                    >
                      {showMetaToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Google Sheet ID
                  </label>
                  <input
                    type="text"
                    value={inputSheetId}
                    onChange={(e) => setInputSheetId(e.target.value)}
                    placeholder="Ex: 1z9Awe0lwCFK57jKnm3Gqr..."
                    className={clsx(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={inputPageId}
                    onChange={(e) => setInputPageId(e.target.value)}
                    placeholder="Ex: 1188731377649494"
                    className={clsx(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Instagram Account ID
                  </label>
                  <input
                    type="text"
                    value={inputIgId}
                    onChange={(e) => setInputIgId(e.target.value)}
                    placeholder="Ex: 17841425769301431"
                    className={clsx(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50",
                      theme === "dark"
                        ? "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:bg-white/8"
                        : "border-slate-200 bg-black/5 text-slate-800 placeholder-slate-400 focus:bg-black/8"
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <GlassBtn
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder les configurations
                </GlassBtn>
              </div>
            </form>
          </GlassCard>

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
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.history.pushState(null, "", "/login");
    }
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
      "min-h-screen relative overflow-x-hidden transition-colors duration-300",
      theme === "dark"
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100"
        : "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900"
    )}>
      <ParticleBG />

      {/* Fixed top-left hamburger menu button (mobile/tablet only) */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className={clsx(
            "fixed top-4 left-4 z-50 flex items-center justify-center h-10 w-10 rounded-xl border backdrop-blur-xl shadow-lg transition-all duration-300 lg:hidden",
            theme === "dark"
              ? "border-white/15 bg-slate-900/80 text-white hover:bg-slate-800/90 hover:border-[#D4A017]/40 shadow-black/30"
              : "border-slate-200 bg-white/90 text-slate-700 hover:bg-white hover:border-[#D4A017]/40 shadow-slate-200/50"
          )}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="mx-auto max-w-[1560px] overflow-x-hidden px-3 py-3 md:px-6 md:py-6">
        <div className="grid min-w-0 gap-4 md:gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
              "sticky top-3 hidden h-[calc(100vh-1.5rem)] min-w-0 flex-col rounded-2xl border backdrop-blur-xl lg:flex transition-all duration-300",
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
                    document.cookie = "dashboard-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
          <main className="flex min-w-0 flex-col gap-4 md:gap-6">
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
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#D4A017]">{t("livesync", "Realtime Cockpit")}</p>
                  <h2 className={clsx(
                    "mt-2 text-2xl font-bold md:text-3xl transition-colors duration-300",
                    theme === "dark" ? "text-white" : "text-slate-800"
                  )}>{t(activeModule, activeModule)}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">

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
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setIsSidebarOpen(false)}
            className={clsx(
              "absolute inset-0 w-full h-full backdrop-blur-sm transition-all duration-300",
              theme === "dark" ? "bg-slate-950/70" : "bg-slate-900/40"
            )}
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={clsx(
              "absolute left-0 top-0 h-full w-[86vw] max-w-sm overflow-y-auto border-r p-4 shadow-2xl",
              theme === "dark"
                ? "border-white/10 bg-slate-950 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <Image
                  src="/logo.png"
                  alt="Site logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                  style={{ objectFit: "contain" }}
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D4A017]">Navigation</p>
                  <p className={clsx("text-xs truncate", theme === "dark" ? "text-gray-400" : "text-slate-500")}>{currentUser?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className={clsx(
                  "rounded-lg p-2 transition-colors",
                  theme === "dark" ? "text-gray-300 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-4 space-y-2">
              {visibleSidebarItems.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.label;
                return (
                  <motion.button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.label);
                      setIsSidebarOpen(false);
                    }}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                      active
                        ? theme === "dark"
                          ? "border border-[#D4A017]/30 bg-[#D4A017]/15 text-white"
                          : "border border-[#D4A017]/40 bg-[#D4A017]/10 text-black"
                        : theme === "dark"
                          ? "bg-white/5 text-gray-200 hover:bg-white/10 hover:text-white"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t(item.label, item.label)}</span>
                  </motion.button>
                );
              })}
            </nav>
          </motion.aside>
        </div>
      )}
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
