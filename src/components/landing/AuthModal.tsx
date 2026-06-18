"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, X, Sparkles, Smartphone, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup" | "otp";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "otp">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (activeTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back to SyncSell!");
        onClose();
        // Redirect will happen via auth state listener or manual router push
        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success("Registration successful! Check your email to verify.");
        setActiveTab("login");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({
          phone: phone,
        });
        if (error) throw error;
        setOtpSent(true);
        toast.success("Verification code sent to your phone!");
      } else {
        const { error } = await supabase.auth.verifyOtp({
          phone: phone,
          token: otpCode,
          type: "sms",
        });
        if (error) throw error;
        toast.success("Successfully logged in via OTP!");
        onClose();
        window.location.href = "/dashboard";
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process phone authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to initialize Google Login");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border-2 border-slate-200 p-8 z-10 text-left shadow-2xl shadow-slate-300/50"
        >
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-accent-cyan" />

          {/* Subtle decorative blobs */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-primary/[0.06] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-secondary/[0.06] rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Enter the autopilot era</span>
            </div>
            <h2 className="text-2xl font-black font-heading text-slate-950 tracking-tight">
              {activeTab === "login"
                ? "Welcome Back"
                : activeTab === "signup"
                ? "Create Account"
                : "Secure OTP Login"}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              Start optimizing your eBay listings with SyncSell
            </p>
          </div>

          {/* Tabs */}
          <div className="relative flex p-1 mb-6 rounded-xl bg-slate-100 border border-slate-200">
            {(["login", "signup", "otp"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setOtpSent(false);
                }}
                className={`relative flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-colors duration-200 z-10 cursor-pointer ${
                  activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-white border border-slate-200 rounded-lg shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                {tab === "otp" ? "SMS OTP" : tab}
              </button>
            ))}
          </div>

          {/* Google 1-Click Login */}
          {activeTab !== "otp" && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-sm font-bold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 cursor-pointer shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Separator */}
              <div className="relative my-5 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Or email credentials
                </span>
              </div>
            </>
          )}

          {/* Email Login/Signup Forms */}
          {activeTab !== "otp" ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {activeTab === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 font-medium shadow-sm"
                    />
                    <Sparkles className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 font-medium shadow-sm"
                  />
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 font-medium shadow-sm"
                  />
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{activeTab === "login" ? "Login" : "Sign Up"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SMS OTP Form */
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Phone Number (with country code)</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    disabled={otpSent || isLoading}
                    placeholder="+15556667777"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 disabled:opacity-50 font-medium shadow-sm"
                  />
                  <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Provide format: +[country-code][number]</p>
              </div>

              {otpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label className="text-xs font-bold text-slate-600">OTP Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-white border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl py-2.5 px-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 font-medium shadow-sm"
                    />
                    <Check className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-accent-cyan to-primary hover:brightness-110 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-accent-cyan/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{otpSent ? "Verify & Log In" : "Send Verification Code"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs text-primary hover:underline hover:text-indigo-600 bg-transparent border-0 cursor-pointer font-bold"
                >
                  Change phone number
                </button>
              )}
            </form>
          )}

          {/* Policy Text */}
          <p className="text-[10px] text-center text-slate-400 mt-6 leading-relaxed font-medium">
            By signing in, you agree to SyncSell&apos;s{" "}
            <a href="#" className="underline text-slate-600 hover:text-primary font-bold">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline text-slate-600 hover:text-primary font-bold">
              Privacy Policy
            </a>.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
