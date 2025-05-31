/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Toaster } from "sonner";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { metadata } from "./metadata";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Load Geist fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      (authUser) => {
        setUser(authUser);
        setIsLoading(false);
        if (!authUser && typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
          router.push("/auth");
        }
      },
      (error) => {
        console.error("Auth state change error:", error);
        setIsLoading(false);
        router.push("/auth");
      }
    );

    return () => unsubscribe();
  }, [router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <html lang="en">
        <head>
          <title>RSS Scraper Dashboard</title>
          <meta name="description" content="Manage and monitor your RSS feeds" />
        </head>
        <body
          className={cn(
            "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans antialiased",
            geistSans.variable,
            geistMono.variable
          )}
        >
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600 font-medium">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>RSS Scraper Dashboard</title>
        <meta name="description" content="Manage and monitor your RSS feeds" />
        {/* Add other metadata tags as needed */}
      </head>
      <body
        className={cn(
          "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans antialiased flex flex-col",
          geistSans.variable,
          geistMono.variable
        )}
      >
        {/* Header - Only show when user is authenticated */}
        {user && <Header />}

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer - Only show when user is authenticated */}
        {user && <Footer />}

        {/* Toast Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}