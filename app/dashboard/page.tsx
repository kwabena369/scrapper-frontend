/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import FeedComponent from "./FeedComponent";
import { useState, useEffect, useCallback, useMemo } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Interfaces
interface Feed {
  ID: string;
  CreatedAt: string;
  UpdatedAt: string;
  Name: string;
  Url: string;
  UserID: string;
}

interface FeedItem {
  _id?: string;
  id?: string;
  feed_id?: string;
  feedId?: string;
  FeedID?: string;
  title?: string;
  Title?: string;
  link?: string;
  Link?: string;
  description?: string;
  Description?: string;
  pub_date?: string;
  pubDate?: string;
  PubDate?: string;
  [key: string]: any;
}

interface FeedFollower {
  ID: string;
  FeedID: string;
  UserID: string;
  CreatedAt: string;
}

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 bg-gray-200 rounded-2xl w-48 mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <div className="h-4 bg-gray-200 rounded-full w-20 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded-full w-12"></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/20 h-64"></div>
      ))}
    </div>
  </div>
);

export default function Dashboard() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [feedItems, setFeedItems] = useState<Record<string, FeedItem[]>>({});
  const [followedFeeds, setFollowedFeeds] = useState<Set<string>>(new Set());
  const [newFeed, setNewFeed] = useState({ name: "", url: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [scrapingFeeds, setScrapingFeeds] = useState<Set<string>>(new Set());
  const [deletingFeeds, setDeletingFeeds] = useState<Set<string>>(new Set());
  const [followingFeeds, setFollowingFeeds] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Memoized computed values for performance
  const totalItems = useMemo(() =>
    Object.values(feedItems).reduce((total, items) => total + items.length, 0),
    [feedItems]
  );

  const recentItems = useMemo(() => {
    const allItems = Object.values(feedItems).flat();
    return allItems
      .filter(item => item.pub_date)
      .sort((a, b) => new Date(b.pub_date!).getTime() - new Date(a.pub_date!).getTime())
      .slice(0, 5);
  }, [feedItems]);

  const todayItems = useMemo(() => {
    const today = new Date();
    return recentItems.filter(item => {
      const itemDate = new Date(item.pub_date!);
      return itemDate.toDateString() === today.toDateString();
    }).length;
  }, [recentItems]);

  const filteredFeeds = useMemo(() => {
    if (!searchQuery) return feeds;
    return feeds.filter(feed =>
      feed.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.Url.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [feeds, searchQuery]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/auth");
      } else {
        Promise.all([
          fetchFeeds(),
          fetchFollowedFeeds(user)
        ]).finally(() => setLoading(false));
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchFollowedFeeds = useCallback(async (user: any) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feed-followers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch followed feeds: ${res.status}`);

      const data = await res.json();
      const followed = new Set<string>((Array.isArray(data) ? data : []).map((f: FeedFollower) => f.FeedID));
      setFollowedFeeds(followed);
    } catch (error) {
      console.error("Error fetching followed feeds:", error);
      toast.error("Failed to load followed feeds");
    }
  }, []);

  const handleFollowFeed = useCallback(async (feedId: string) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    setFollowingFeeds(prev => new Set(prev).add(feedId));

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feed-followers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feed_id: feedId, user_id: user.uid }),
      });

      if (!res.ok) throw new Error(`Failed to follow feed: ${res.status}`);

      setFollowedFeeds(prev => new Set(prev).add(feedId));
      toast.success("Feed followed!");
    } catch (error) {
      console.error("Error following feed:", error);
      toast.error("Failed to follow feed");
    } finally {
      setFollowingFeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedId);
        return newSet;
      });
    }
  }, []);

  const handleUnfollowFeed = useCallback(async (feedId: string) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    setFollowingFeeds(prev => new Set(prev).add(feedId));

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feed-followers/${feedId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to unfollow feed: ${res.status}`);

      setFollowedFeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedId);
        return newSet;
      });
      toast.success("Feed unfollowed");
    } catch (error) {
      console.error("Error unfollowing feed:", error);
      toast.error("Failed to unfollow feed");
    } finally {
      setFollowingFeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedId);
        return newSet;
      });
    }
  }, []);

  const extractItemData = useCallback((item: any): FeedItem => ({
    _id: item._id || item.id || item.ID || `item-${Math.random()}`,
    feedId: item.feed_id || item.feedId || item.FeedID || '',
    title: item.title || item.Title || 'Untitled',
    link: item.link || item.Link || '#',
    description: item.description || item.Description || '',
    pub_date: item.pub_date || item.pubDate || item.PubDate || ''
  }), []);

  const processItems = useCallback((rawData: any): FeedItem[] => {
    if (!rawData) return [];
    if (Array.isArray(rawData)) return rawData.map(extractItemData);
    if (typeof rawData === 'object') {
      const possibleArrays = Object.values(rawData).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        return (possibleArrays[0] as any[]).map(extractItemData);
      }
      return [extractItemData(rawData)];
    }
    return [];
  }, [extractItemData]);

  const fetchFeeds = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");

      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch feeds: ${res.status}`);

      const data = await res.json();
      const feedsData = Array.isArray(data) ? data : [];
      setFeeds(feedsData);

      // Fetch items for all feeds in parallel for better performance
      const itemsMap: Record<string, FeedItem[]> = {};
      await Promise.allSettled(
        feedsData.map(async (feed: Feed) => {
          if (feed.ID) {
            try {
              const items = await fetchFeedItems(feed.ID, token);
              itemsMap[feed.ID] = items;
            } catch (error) {
              console.error(`Failed to fetch items for feed ${feed.ID}:`, error);
              itemsMap[feed.ID] = [];
            }
          }
        })
      );
      setFeedItems(itemsMap);
    } catch (error) {
      console.error("Error fetching feeds:", error);
      toast.error("Failed to load feeds");
    }
  }, []);

  const fetchFeedItems = useCallback(async (feedId: string, token: string) => {
    if (!feedId) throw new Error("Feed ID is undefined");

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds/${feedId}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Failed to fetch items: ${res.status}`);

    const data = await res.json();
    return processItems(data);
  }, [processItems]);

  const handleCreateFeed = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }
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

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create feed: ${errorText}`);
      }

      const data = await res.json();
      setFeeds(prev => [...prev, data]);
      setNewFeed({ name: "", url: "" });
      setShowCreateForm(false);
      toast.success("Feed created successfully!");
      await fetchFeeds();
    } catch (error) {
      console.error("Create feed error:", error);
      toast.error("Failed to create feed");
    } finally {
      setCreating(false);
    }
  }, [newFeed, fetchFeeds]);

  const handleScrapeFeed = useCallback(async (feedId: string) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    setScrapingFeeds(prev => new Set(prev).add(feedId));

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds/${feedId}/scrape`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to scrape feed: ${res.status}`);

      const items = await fetchFeedItems(feedId, token);
      setFeedItems(prev => ({ ...prev, [feedId]: items }));
      toast.success(`Feed refreshed! Found ${items.length} items.`);
    } catch (error) {
      console.error("Error scraping feed:", error);
      toast.error("Failed to refresh feed");
    } finally {
      setScrapingFeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedId);
        return newSet;
      });
    }
  }, [fetchFeedItems]);

  const handleDeleteFeed = useCallback(async (feedId: string) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    setDeletingFeeds(prev => new Set(prev).add(feedId));

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds/${feedId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to delete feed: ${res.status}`);

      setFeeds(prev => prev.filter(feed => feed.ID !== feedId));
      setFeedItems(prev => {
        const updated = { ...prev };
        delete updated[feedId];
        return updated;
      });
      setFollowedFeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedId);
        return newSet;
      });
      toast.success("Feed deleted");
    } catch (error) {
      console.error("Error deleting feed:", error);
      toast.error("Failed to delete feed");
    } finally {
      setDeletingFeeds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedId);
        return newSet;
      });
    }
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "Today";
      if (diffDays === 2) return "Yesterday";
      if (diffDays <= 7) return `${diffDays - 1} days ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                RSS Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">Stay updated with your favorite sources</p>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search feeds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 pl-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
                />
                <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-2xl font-medium hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showCreateForm ? 'rotate-45' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Feed</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Total Feeds</p>
                  <p className="text-3xl font-bold text-gray-900">{feeds.length}</p>
                </div>
                <div className="bg-blue-100 rounded-2xl p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 16h14l-2-16" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Total Articles</p>
                  <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
                </div>
                <div className="bg-green-100 rounded-2xl p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-white/20 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Today</p>
                  <p className="text-3xl font-bold text-gray-900">{todayItems}</p>
                </div>
                <div className="bg-purple-100 rounded-2xl p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Feed Form */}
        <div className={`transition-all duration-500 ease-out ${showCreateForm ? 'opacity-100 translate-y-0 mb-8' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/30 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New RSS Feed</h2>
            <form onSubmit={handleCreateFeed} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feed Name
                  </label>
                  <input
                    type="text"
                    value={newFeed.name}
                    onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })}
                    placeholder="e.g., TechCrunch, BBC News"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RSS URL
                  </label>
                  <input
                    type="url"
                    value={newFeed.url}
                    onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })}
                    placeholder="https://example.com/feed"
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-200"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Feed"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-600 px-6 py-3 rounded-2xl font-medium hover:bg-gray-100/80 active:scale-95 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Items Section */}
        {recentItems.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/30 p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Articles</h2>
            <div className="space-y-3">
              {recentItems.map((item, index) => (
                <div key={item._id || index} className="group flex items-start gap-4 p-4 hover:bg-gray-50/80 rounded-2xl transition-all duration-200">
                  <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                      {item.link && item.link !== '#' ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(item.pub_date || '')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feeds Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Feeds</h2>
            {searchQuery && (
              <p className="text-sm text-gray-500">
                {filteredFeeds.length} of {feeds.length} feeds
              </p>
            )}
          </div>

          {filteredFeeds.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 border border-white/30 p-12 text-center">
              <div className="text-6xl mb-4">
                {searchQuery ? "🔍" : "📡"}
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? "No feeds found" : "No feeds yet"}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No feeds match "${searchQuery}". Try a different search term.`
                  : "Get started by adding your first RSS feed. Connect to news sites, blogs, or any website with an RSS feed."
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-medium hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-200"
                >
                  Add Your First Feed
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFeeds.map((feed) => (
                <FeedComponent
                  key={feed.ID || Math.random().toString(36).substr(2, 9)}
                  feed={feed}
                  feedItems={feedItems[feed.ID] || []}
                  isScrapingFeed={scrapingFeeds.has(feed.ID)}
                  isDeletingFeed={deletingFeeds.has(feed.ID)}
                  isFollowingFeed={followingFeeds.has(feed.ID)}
                  isFollowed={followedFeeds.has(feed.ID)}
                  onScrapeFeed={handleScrapeFeed}
                  onViewFeed={(feedId) => router.push(`/feeds/${feedId}`)}
                  onFollowFeed={handleFollowFeed}
                  onUnfollowFeed={handleUnfollowFeed}
                  onDeleteFeed={handleDeleteFeed}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Floating Button - Mobile Only */}
        <div className="fixed bottom-6 right-6 sm:hidden">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 active:scale-95 transition-all duration-200"
          >
            <svg
              className={`w-6 h-6 transition-transform duration-200 ${showCreateForm ? 'rotate-45' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Performance Metrics - Development Only */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-900/90 backdrop-blur-xl text-green-400 p-4 rounded-2xl text-xs font-mono border border-gray-700/50">
            <details>
              <summary className="cursor-pointer mb-2 text-green-300">⚡ Performance Metrics</summary>
              <div className="space-y-1 text-green-400/80">
                <div>Feeds: {feeds.length} | Items: {totalItems} | Recent: {recentItems.length}</div>
                <div>Followed: {Array.from(followedFeeds).length} | Today: {todayItems}</div>
                <div>Filtered: {filteredFeeds.length}/{feeds.length}</div>
                <div>Loading States: Scraping({scrapingFeeds.size}) Deleting({deletingFeeds.size}) Following({followingFeeds.size})</div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
