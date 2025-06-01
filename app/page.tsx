/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Plus, Rss, ArrowRight, Calendar, Globe, Zap, Shield, Users } from "lucide-react";
import { toast } from "sonner";

interface Feed {
  ID: string;
  CreatedAt: string;
  UpdatedAt: string;
  Name: string;
  Url: string;
  UserID: string;
}

export default function HomePage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [newFeed, setNewFeed] = useState({ name: "", url: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/auth");
      } else {
        setLoading(false);
        fetchFeeds();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchFeeds = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch feeds");
      const data = await res.json();
      setFeeds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching feeds:", error);
      toast.error("Failed to load feeds");
    }
  }, []);

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (!newFeed.name.trim() || !newFeed.url.trim()) {
      toast.error("Please fill in both name and URL");
      return;
    }

    setCreating(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...newFeed, user_id: user.uid }),
      });
      if (!res.ok) throw new Error("Failed to create feed");
      const data = await res.json();
      setFeeds([...feeds, data]);
      setNewFeed({ name: "", url: "" });
      setShowCreateForm(false);
      toast.success("Feed created successfully!");
    } catch (error) {
      console.error("Error creating feed:", error);
      toast.error("Failed to create feed");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-12 w-12 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
            <Rss className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            RSS Hub
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Your centralized platform for managing RSS feeds. Stay updated with your favorite content sources, all in one place.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {showCreateForm ? "Hide Form" : "Add New Feed"}
                </Button>

                {feeds.length > 0 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push("/dashboard")}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-xl transition-all duration-200"
                  >
                    View All Feeds
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>

              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 pt-8 border-t border-gray-200"
                >
                  <form onSubmit={handleCreateFeed} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Feed Name
                        </label>
                        <Input
                          type="text"
                          value={newFeed.name}
                          onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                          placeholder="e.g., TechCrunch, BBC News"
                          className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          RSS URL
                        </label>
                        <Input
                          type="url"
                          value={newFeed.url}
                          onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                          placeholder="https://example.com/rss"
                          className="rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200"
                    >
                      {creating ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Creating...
                        </>
                      ) : (
                        "Create Feed"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Why Choose RSS Hub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Real-time Updates
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Get the latest content from your favorite sources as soon as it's published.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure & Private
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your data is protected with enterprise-grade security and privacy controls.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Easy to Use
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Intuitive interface designed for effortless feed management and content discovery.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Feeds Preview */}
        {feeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Your Recent Feeds
                  </CardTitle>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {feeds.length} {feeds.length === 1 ? 'feed' : 'feeds'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feeds.slice(0, 6).map((feed, index) => (
                    <motion.div
                      key={feed.ID}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="group bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:bg-white transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/feeds/${feed.ID}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Rss className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                            {feed.Name || "Unnamed Feed"}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <Globe className="w-3 h-3" />
                            <span className="truncate">
                              {feed.Url ? new URL(feed.Url).hostname : "No URL"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(feed.CreatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {feeds.length > 6 && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg transition-all duration-200"
                    >
                      View All {feeds.length} Feeds
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {feeds.length === 0 && !showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rss className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No feeds yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by adding your first RSS feed to begin tracking your favorite content sources.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Feed
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
