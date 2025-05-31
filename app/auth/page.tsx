// app/auth/page.tsx
"use client";

import { useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await sendTokenToBackend(token);
      toast.success("Logged in with Google!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Login failed: " + (error as Error).message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      await sendTokenToBackend(token);
      toast.success("Logged in with Email!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Email login error:", error);
      toast.error("Login failed: " + (error as Error).message);
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
      throw error; // Re-throw to be caught by the login handlers
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign In</h1>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-red-600 text-white py-2 rounded mb-4 hover:bg-red-700"
        >
          Sign in with Google
        </button>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Sign in with Email
          </button>
        </form>
      </div>
    </div>
  );
}
