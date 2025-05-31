/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, Chrome } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await sendTokenToBackend(token);
      toast.success("Logged in with Google!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Login failed: " + (error as Error).message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      await sendTokenToBackend(token);
      toast.success("Logged in with Email!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Email login error:", error);
      toast.error("Login failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTokenToBackend = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8080/v1/users", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: auth.currentUser?.email,
          username: auth.currentUser?.displayName || "user",
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to register with backend");
      }
    } catch (error) {
      console.error("Backend request error:", error);
      throw error;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <motion.div variants={itemVariants}>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription className="text-slate-600 text-base">
                Sign in to your account to continue
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Login Button */}
            <motion.div variants={itemVariants}>
              <Button
                onClick={handleGoogleLogin}
                disabled={googleLoading || isLoading}
                className="w-full h-12 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                variant="outline"
              >
                {googleLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Chrome className="w-5 h-5 mr-3 text-blue-600" />
                    Continue with Google
                  </>
                )}
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants} className="relative">
              <Separator className="bg-slate-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-sm text-slate-500 font-medium">
                  or continue with email
                </span>
              </div>
            </motion.div>

            {/* Email/Password Form */}
            <motion.form onSubmit={handleEmailLogin} className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="pl-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                    disabled={isLoading || googleLoading}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                    required
                    disabled={isLoading || googleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    disabled={isLoading || googleLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading || googleLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </motion.div>
            </motion.form>

            {/* Footer */}
            <motion.div variants={itemVariants} className="text-center pt-4">
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <button className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200">
                  Sign up
                </button>
              </p>
            </motion.div>
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <motion.div
          variants={itemVariants}
          className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl -z-10"
        />
        <motion.div
          variants={itemVariants}
          className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl -z-10"
        />
      </motion.div>
    </div>
  );
}