"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Globe, 
  Check, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "manager" | "client";

export interface LoggedInUser {
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  avatarUrl?: string;
}

interface LoginScreenProps {
  theme: "dark" | "light";
  onLoginSuccess: (user: LoggedInUser) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

const loginTranslations: Record<string, Record<string, string>> = {
  "Français": {
    title: "Portail Dashboard AI",
    subtitle: "Gérez votre écosystème de marque intelligent",
    usernameLabel: "Adresse Email",
    passwordLabel: "Mot de passe",
    loginBtn: "Se connecter",
    errorMsg: "Adresse email non reconnue ou compte inactif.",
    placeholderUser: "Entrez votre adresse email",
    placeholderPass: "Entrez votre mot de passe",
    connecting: "Connexion en cours...",
    fullNameLabel: "Nom Complet",
    roleLabel: "Rôle de l'utilisateur",
    registerBtn: "Créer un compte",
    registerSuccessMsg: "Inscription réussie !",
    emailInUseMsg: "Cet email est déjà enregistré.",
    incorrectPasswordMsg: "Mot de passe incorrect.",
    toggleRegister: "Pas de compte ? Créer un compte",
    toggleLogin: "Déjà inscrit ? Se connecter",
    placeholderName: "Entrez votre nom complet"
  },
  "English": {
    title: "Dashboard AI Portal",
    subtitle: "Manage your intelligent brand ecosystem",
    usernameLabel: "Email Address",
    passwordLabel: "Password",
    loginBtn: "Sign In",
    errorMsg: "Email address not recognized or inactive account.",
    placeholderUser: "Enter your email address",
    placeholderPass: "Enter your password",
    connecting: "Connecting...",
    fullNameLabel: "Full Name",
    roleLabel: "User Role",
    registerBtn: "Register Account",
    registerSuccessMsg: "Registration successful!",
    emailInUseMsg: "This email is already registered.",
    incorrectPasswordMsg: "Incorrect password.",
    toggleRegister: "Don't have an account? Sign up",
    toggleLogin: "Already have an account? Sign in",
    placeholderName: "Enter your full name"
  },
  "العربية": {
    title: "بوابة لوحة التحكم بالذكاء الاصطناعي",
    subtitle: "إدارة نظام علامتك التجارية الذكي",
    usernameLabel: "البريد الإلكتروني",
    passwordLabel: "كلمة المرور",
    loginBtn: "تسجيل الدخول",
    errorMsg: "البريد الإلكتروني غير معروف أو الحساب غير نشط.",
    placeholderUser: "أدخل بريدك الإلكتروني",
    placeholderPass: "أدخل كلمة المرور",
    connecting: "جاري الاتصال...",
    fullNameLabel: "الاسم الكامل",
    roleLabel: "دور المستخدم",
    registerBtn: "إنشاء حساب",
    registerSuccessMsg: "تم التسجيل بنجاح!",
    emailInUseMsg: "هذا البريد الإلكتروني مسجل بالفعل.",
    incorrectPasswordMsg: "كلمة المرور غير صحيحة.",
    toggleRegister: "ليس لديك حساب؟ إنشاء حساب جديد",
    toggleLogin: "مسجل بالفعل؟ تسجيل الدخول",
    placeholderName: "أدخل اسمك الكامل"
  }
};

export function LoginScreen({ theme, onLoginSuccess, language, setLanguage }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Registration expansion states
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState("");
  const selectedRole = "client";

  const t = (key: string) => {
    const langDict = loginTranslations[language] || loginTranslations["Français"];
    return langDict[key] || key;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const sanitizedEmail = username.trim().toLowerCase();
      
      // Query Supabase dynamic users table
      const { data, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("email", sanitizedEmail)
        .eq("is_active", true)
        .maybeSingle();

      if (dbError) {
        throw new Error(dbError.message);
      }

      if (data) {
        // Enforce password verification if user has a password in DB
        if (data.password && data.password.trim() !== password.trim()) {
          setError(t("incorrectPasswordMsg"));
          setIsSubmitting(false);
          return;
        }

        // Map database enums to frontend routing privilege keys
        let mappedRole: UserRole = "client";
        let mappedRoleLabel = "Client";

        const dbRole = String(data.role).toLowerCase();
        
        if (dbRole === "admin") {
          mappedRole = "admin";
          mappedRoleLabel = "Administrateur";
        } else if (dbRole === "manager") {
          mappedRole = "manager";
          mappedRoleLabel = "Manager";
        } else if (dbRole === "client") {
          mappedRole = "client";
          mappedRoleLabel = "Client";
        } else {
          mappedRole = "client";
          mappedRoleLabel = "Client";
        }

        const userPayload: LoggedInUser = {
          username: data.email,
          name: data.full_name,
          role: mappedRole,
          roleLabel: mappedRoleLabel,
          avatarUrl: data.avatar_url || undefined
        };
        
        // Securely cache locally
        localStorage.setItem("dashboard-auth-user", JSON.stringify(userPayload));
        document.cookie = `dashboard-auth-user=${encodeURIComponent(JSON.stringify(userPayload))}; path=/; max-age=86400; SameSite=Lax`;
        onLoginSuccess(userPayload);
      } else {
        setError(t("errorMsg"));
      }
    } catch (err: any) {
      console.error("Login DB Error:", err);
      setError(language === "العربية" 
        ? "حدث خطأ في الاتصال بقاعدة البيانات." 
        : language === "English" 
        ? "A database connection error occurred." 
        : "Une erreur de connexion à la base de données est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const nameTrimmed = fullName.trim();
    const emailTrimmed = username.trim().toLowerCase();
    const passTrimmed = password.trim();

    // 1. Validate full name
    if (!nameTrimmed) {
      setError(
        language === "العربية" ? "الاسم الكامل مطلوب." :
        language === "English" ? "Full name is required." :
        "Le nom complet est obligatoire."
      );
      return;
    }
    if (nameTrimmed.length < 2) {
      setError(
        language === "العربية" ? "يجب أن يتكون الاسم الكامل من حرفين على الأقل." :
        language === "English" ? "Full name must be at least 2 characters." :
        "Le nom complet doit contenir au moins 2 caractères."
      );
      return;
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setError(
        language === "العربية" ? "صيغة البريد الإلكتروني غير صالحة." :
        language === "English" ? "Invalid email address format." :
        "Format de l'adresse email invalide."
      );
      return;
    }

    // 3. Validate password strength
    if (!passTrimmed) {
      setError(
        language === "العربية" ? "كلمة المرور مطلوبة." :
        language === "English" ? "Password is required." :
        "Le mot de passe est obligatoire."
      );
      return;
    }
    if (passTrimmed.length < 6) {
      setError(
        language === "العربية" ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." :
        language === "English" ? "Password must be at least 6 characters." :
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", emailTrimmed)
        .maybeSingle();

      if (checkError) throw new Error(checkError.message);

      if (existingUser) {
        setError(t("emailInUseMsg"));
        setIsSubmitting(false);
        return;
      }

      // Insert new user
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            full_name: nameTrimmed,
            email: emailTrimmed,
            password: passTrimmed,
            role: selectedRole,
            is_active: true
          }
        ])
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);

      if (newUser) {
        let mappedRole: UserRole = "client";
        let mappedRoleLabel = "Client";
        const dbRole = String(newUser.role).toLowerCase();
        
        if (dbRole === "admin") {
          mappedRole = "admin";
          mappedRoleLabel = "Administrateur";
        } else if (dbRole === "manager") {
          mappedRole = "manager";
          mappedRoleLabel = "Manager";
        } else if (dbRole === "client") {
          mappedRole = "client";
          mappedRoleLabel = "Client";
        }

        const userPayload: LoggedInUser = {
          username: newUser.email,
          name: newUser.full_name,
          role: mappedRole,
          roleLabel: mappedRoleLabel,
          avatarUrl: newUser.avatar_url || undefined
        };
        
        localStorage.setItem("dashboard-auth-user", JSON.stringify(userPayload));
        document.cookie = `dashboard-auth-user=${encodeURIComponent(JSON.stringify(userPayload))}; path=/; max-age=86400; SameSite=Lax`;
        onLoginSuccess(userPayload);
      }
    } catch (err: any) {
      console.error("Register DB Error:", err);
      const dbErrorMessage = err.message || err.details || "";
      let userFriendlyError = "";
      
      if (language === "العربية") {
        userFriendlyError = `حدث خطأ أثناء إنشاء الحساب: ${dbErrorMessage || "الرجاء المحاولة مرة أخرى."}`;
      } else if (language === "English") {
        userFriendlyError = `An error occurred during registration: ${dbErrorMessage || "Please try again."}`;
      } else {
        userFriendlyError = `Une erreur est survenue lors de l'inscription : ${dbErrorMessage || "Veuillez réessayer."}`;
      }
      
      setError(userFriendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = language === "العربية";

  return (
    <div className={clsx(
      "relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 transition-all duration-500",
      theme === "dark" 
        ? "bg-[#030914] text-white" 
        : "bg-slate-50 text-slate-900"
    )}>
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={clsx(
          "absolute -top-[40%] -left-[30%] h-[80vw] w-[80vw] rounded-full filter blur-[120px] opacity-40 animate-pulse transition-all duration-1000",
          theme === "dark" ? "bg-gradient-to-tr from-[#D4A017]/20 to-blue-500/10" : "bg-gradient-to-tr from-amber-200/30 to-blue-200/20"
        )} />
        <div className={clsx(
          "absolute -bottom-[40%] -right-[30%] h-[80vw] w-[80vw] rounded-full filter blur-[120px] opacity-40 animate-pulse transition-all duration-1000",
          theme === "dark" ? "bg-gradient-to-tr from-purple-500/10 to-[#D4A017]/10" : "bg-gradient-to-tr from-purple-200/20 to-amber-200/20"
        )} />
      </div>

      {/* Language Selector in Header */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className={clsx(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md transition-all duration-300",
          theme === "dark" ? "border-white/20 bg-white/5" : "border-slate-200 bg-white/80 shadow-sm"
        )}>
          <Globe className={clsx("h-4 w-4", theme === "dark" ? "text-[#D4A017]" : "text-amber-600")} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={clsx(
              "cursor-pointer rounded-full border px-2 py-1 text-xs font-semibold focus:outline-none appearance-none",
              theme === "dark"
                ? "border-white/20 bg-slate-900 text-white focus:border-[#D4A017]/40"
                : "border-slate-300 bg-white text-black focus:border-amber-500/40"
            )}
            style={
              theme === "dark"
                ? { backgroundColor: "#0f172a", color: "#ffffff" }
                : { backgroundColor: "#ffffff", color: "#000000", colorScheme: "light" }
            }
          >
            <option value="Français" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>Français</option>
            <option value="English" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>English</option>
            <option value="العربية" className={theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}>العربية</option>
          </select>
        </div>
      </div>

      {/* Main Glassmorphic Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className={clsx(
          "relative overflow-hidden rounded-3xl border p-8 backdrop-blur-2xl transition-all duration-500",
          theme === "dark"
            ? "border-white/10 bg-gradient-to-b from-slate-900/40 to-slate-950/60 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            : "border-slate-200/80 bg-white/70 shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
        )}>
          
          {/* Subtle top border glow for premium feel */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4A017]/50 to-transparent" />

          {/* Logo & Header */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="mx-auto flex items-center justify-center mb-6"
            >
              <img
                src="/logo.png"
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </motion.div>
            
            <h1 className={clsx(
              "mt-5 text-2xl font-black tracking-tight",
              theme === "dark" ? "text-white" : "text-slate-900"
            )}>
              {t("title")}
            </h1>
            <p className={clsx(
              "mt-2 text-xs",
              theme === "dark" ? "text-gray-400" : "text-slate-500"
            )}>
              {t("subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="mt-8 space-y-5" dir={isRtl ? "rtl" : "ltr"}>
            
            {/* Nom Complet (only for Registration) */}
            {isRegistering && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className={clsx(
                  "block text-xs font-bold uppercase tracking-wider",
                  theme === "dark" ? "text-gray-400" : "text-slate-500"
                )}>
                  {t("fullNameLabel")}
                </label>
                <div className="relative group">
                  <div className={clsx(
                    "absolute inset-y-0 flex items-center pointer-events-none transition-colors",
                    isRtl ? "right-3" : "left-3",
                    theme === "dark" ? "text-gray-400 group-focus-within:text-[#D4A017]" : "text-slate-400 group-focus-within:text-amber-600"
                  )}>
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("placeholderName")}
                    className={clsx(
                      "w-full rounded-xl border py-3 text-sm focus:outline-none transition-all duration-300",
                      isRtl ? "pr-10 pl-4" : "pl-10 pr-4",
                      theme === "dark"
                        ? "border-white/10 bg-slate-950/50 text-white placeholder-slate-600 focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/30"
                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                    )}
                  />
                </div>
              </div>
            )}

            {/* Username/Email Field */}
            <div className="space-y-1.5">
              <label className={clsx(
                "block text-xs font-bold uppercase tracking-wider",
                theme === "dark" ? "text-gray-400" : "text-slate-500"
              )}>
                {t("usernameLabel")}
              </label>
              <div className="relative group">
                <div className={clsx(
                  "absolute inset-y-0 flex items-center pointer-events-none transition-colors",
                  isRtl ? "right-3" : "left-3",
                  theme === "dark" ? "text-gray-400 group-focus-within:text-[#D4A017]" : "text-slate-400 group-focus-within:text-amber-600"
                )}>
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("placeholderUser")}
                  className={clsx(
                    "w-full rounded-xl border py-3 text-sm focus:outline-none transition-all duration-300",
                    isRtl ? "pr-10 pl-4" : "pl-10 pr-4",
                    theme === "dark"
                      ? "border-white/10 bg-slate-950/50 text-white placeholder-slate-600 focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/30"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  )}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className={clsx(
                "block text-xs font-bold uppercase tracking-wider",
                theme === "dark" ? "text-gray-400" : "text-slate-500"
              )}>
                {t("passwordLabel")}
              </label>
              <div className="relative group">
                <div className={clsx(
                  "absolute inset-y-0 flex items-center pointer-events-none transition-colors",
                  isRtl ? "right-3" : "left-3",
                  theme === "dark" ? "text-gray-400 group-focus-within:text-[#D4A017]" : "text-slate-400 group-focus-within:text-amber-600"
                )}>
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("placeholderPass")}
                  className={clsx(
                    "w-full rounded-xl border py-3 text-sm focus:outline-none transition-all duration-300",
                    isRtl ? "pr-10 pl-12" : "pl-10 pr-12",
                    theme === "dark"
                      ? "border-white/10 bg-slate-950/50 text-white placeholder-slate-600 focus:border-[#D4A017]/50 focus:ring-1 focus:ring-[#D4A017]/30"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={clsx(
                    "absolute inset-y-0 flex items-center px-3 hover:text-inherit focus:outline-none transition-colors",
                    isRtl ? "left-0" : "right-0",
                    theme === "dark" ? "text-gray-500 hover:text-white" : "text-slate-400 hover:text-slate-900"
                  )}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>



            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-500"
                >
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                "relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300",
                "bg-gradient-to-r from-[#D4A017] to-[#B07B12] hover:opacity-95 shadow-[#D4A017]/20 disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2 animate-fadeIn"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>{isRegistering ? (language === "العربية" ? "جاري إنشاء الحساب..." : language === "English" ? "Registering..." : "Inscription en cours...") : t("connecting")}</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? t("registerBtn") : t("loginBtn")}</span>
                  <ArrowRight className={clsx("h-4.5 w-4.5 transition-transform duration-300", isRtl ? "rotate-180" : "group-hover:translate-x-1")} />
                </>
              )}
            </motion.button>

            {/* Toggle Link */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError("");
                }}
                className={clsx(
                  "text-xs font-semibold hover:underline bg-transparent border-none cursor-pointer transition-colors",
                  theme === "dark" ? "text-amber-400 hover:text-amber-300" : "text-amber-700 hover:text-amber-600"
                )}
              >
                {isRegistering ? t("toggleLogin") : t("toggleRegister")}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
