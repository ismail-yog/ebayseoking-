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
          redirectTo: `${window.location.origin}/dashboard`,
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl glass-premium p-8 z-10 text-left"
        >
          {/* Decorative Glowing Orbs */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Enter the autopilot era</span>
            </div>
            <h2 className="text-2xl font-bold font-heading text-white">
              {activeTab === "login"
                ? "Welcome Back"
                : activeTab === "signup"
                ? "Create Account"
                : "Secure OTP Login"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Start optimizing your eBay listings with SyncSell
            </p>
          </div>

          {/* Tabs */}
          <div className="relative flex p-1 mb-6 rounded-lg bg-white/5 border border-white/10">
            {(["login", "signup", "otp"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setOtpSent(false);
                }}
                className={`relative flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors duration-200 z-10 ${
                  activeTab === tab ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-primary/30 border border-primary/40 rounded-md -z-10"
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
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
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
                  <div className="w-full border-t border-white/5" />
                </div>
                <span className="relative px-3 bg-[#0a0915] text-[11px] uppercase tracking-wider text-gray-500">
                  Or email credentials
                </span>
              </div>
            </>
          )}

          {/* Email Login/Signup Forms */}
          {activeTab !== "otp" ? (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {activeTab === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2 px-10 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200"
                    />
                    <Sparkles className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2 px-10 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200"
                  />
                  <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2 px-10 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200"
                  />
                  <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white font-medium py-2.5 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Phone Number (with country code)</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    disabled={otpSent || isLoading}
                    placeholder="+15556667777"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2 px-10 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200 disabled:opacity-50"
                  />
                  <Smartphone className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
                </div>
                <p className="text-[10px] text-gray-500">Provide format: +[country-code][number]</p>
              </div>

              {otpSent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-xs font-semibold text-gray-400">OTP Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 rounded-lg py-2 px-10 text-sm placeholder:text-gray-600 focus:outline-none transition-all duration-200"
                    />
                    <Check className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-500" />
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 mt-2 bg-gradient-to-r from-accent-cyan to-primary hover:brightness-110 text-white font-medium py-2.5 rounded-lg text-sm transition-all duration-200 shadow-lg shadow-accent-cyan/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  className="w-full text-center text-xs text-primary hover:underline hover:text-indigo-400 bg-transparent border-0 cursor-pointer"
                >
                  Change phone number
                </button>
              )}
            </form>
          )}

          {/* Policy Text */}
          <p className="text-[10px] text-center text-gray-500 mt-6 leading-relaxed">
            By signing in, you agree to SyncSell&apos;s{" "}
            <a href="#" className="underline text-gray-400 hover:text-white">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline text-gray-400 hover:text-white">
              Privacy Policy
            </a>.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
