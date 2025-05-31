"use client";

import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { User } from "firebase/auth";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return "Guest";
    return user.displayName || user.email?.split("@")[0] || "User";
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-2">
              <span className="text-white text-xl font-bold">📡</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">RSS Scraper</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Dashboard</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => router.push("/")}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/settings")}
              className="text-slate-600 hover:text-blue-600 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
            >
              Settings
            </button>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Info - Hidden on mobile */}
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-800">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>

                {/* User Avatar */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-700">
                      {getUserDisplayName()}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isMenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                      {/* Mobile Navigation Links */}
                      <div className="md:hidden border-b border-slate-100 pb-2 mb-2">
                        <button
                          onClick={() => {
                            router.push("/");
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                        >
                          <span>📊</span>
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => {
                            router.push("/settings");
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                        >
                          <span>⚙️</span>
                          <span>Settings</span>
                        </button>
                      </div>

                      {/* User Info - Mobile */}
                      <div className="sm:hidden px-4 py-2 border-b border-slate-100 mb-2">
                        <p className="text-sm font-medium text-slate-800">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>

                      {/* Logout */}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </header>
  );
}