/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, ExternalLink, Calendar, Globe, Rss, AlertCircle } from "lucide-react";

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
  feedId?: string;
  FeedID?: string;
  title?: string;
  Title?: string;
  link?: string;
  Link?: string;
  description?: string;
  Description?: string;
  pubDate?: string;
  PubDate?: string;
  [key: string]: any;
}

// Loading skeleton components for better perceived performance
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200/50">
      <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
    </div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-4 border border-gray-200/50">
        <div className="h-6 bg-gray-200 rounded-lg w-4/5 mb-3"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-3/4"></div>
      </div>
    ))}
  </div>
);

// Modern button component
const ModernButton = ({
  onClick,
  disabled,
  variant = "primary",
  size = "md",
  children,
  icon,
  className = ""
}: {
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md focus:ring-blue-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500",
    ghost: "hover:bg-gray-100 text-gray-700 focus:ring-gray-500"
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default function FeedDetail() {
  const { id } = useParams();
  const [feed, setFeed] = useState<Feed | null>(null);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Memoized helper functions for better performance
  const extractItemData = useCallback((item: any): FeedItem => {
    return {
      _id: item._id || item.id || item.ID || `item-${Math.random()}`,
      feedId: item.feedId || item.FeedID || '',
      title: item.title || item.Title || 'Untitled',
      link: item.link || item.Link || '#',
      description: item.description || item.Description || '',
      pubDate: item.pubDate || item.PubDate || item.publishedDate || ''
    };
  }, []);

  const processItems = useCallback((rawData: any): FeedItem[] => {
    if (!rawData) return [];

    if (Array.isArray(rawData)) {
      return rawData.map(extractItemData);
    }

    if (typeof rawData === 'object') {
      const possibleArrays = Object.values(rawData).filter(Array.isArray);
      if (possibleArrays.length > 0) {
        return (possibleArrays[0] as any[]).map(extractItemData);
      }
      return [extractItemData(rawData)];
    }

    return [];
  }, [extractItemData]);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return "No date";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  const formatRelativeDate = useCallback((dateString: string): string => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays}d ago`;

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid date";
    }
  }, []);

  // Optimized fetch function with better error handling
  const fetchFeedAndItems = useCallback(async (user: any) => {
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();

      const [feedsRes, itemsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds/${id}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (!feedsRes.ok) {
        throw new Error(`Failed to fetch feeds: ${feedsRes.status}`);
      }
      if (!itemsRes.ok) {
        throw new Error(`Failed to fetch items: ${itemsRes.status}`);
      }

      const [feedsData, itemsData] = await Promise.all([
        feedsRes.json(),
        itemsRes.json()
      ]);

      const selectedFeed = feedsData.find((f: Feed) => f.ID === id);
      if (!selectedFeed) {
        throw new Error("Feed not found");
      }

      setFeed(selectedFeed);
      setItems(processItems(itemsData));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      toast.error("Error loading feed: " + errorMessage);
    } finally {
      setLoading(false);
    }
  }, [id, processItems]);

  const handleScrapeFeed = useCallback(async (feedId: string) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setScraping(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds/${feedId}/scrape`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to scrape feed: ${res.status}`);
      }

      // Refresh items after scraping
      const itemsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/v1/feeds/${feedId}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        const processedItems = processItems(itemsData);
        setItems(processedItems);
        toast.success(`Feed updated! Found ${processedItems.length} items.`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to scrape feed";
      toast.error("Error scraping feed: " + errorMessage);
    } finally {
      setScraping(false);
    }
  }, [processItems]);

  useEffect(() => {
    let unsubscribe: () => void;

    const checkAuthAndFetch = async () => {
      setAuthLoading(true);
      try {
        unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (!user) {
            router.push("/auth");
            return;
          }
          setAuthLoading(false);
          await fetchFeedAndItems(user);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Authentication error";
        toast.error("Authentication error: " + errorMessage);
        setError(errorMessage);
        setAuthLoading(false);
      }
    };

    checkAuthAndFetch();
    return () => unsubscribe && unsubscribe();
  }, [fetchFeedAndItems, router]);

  // Memoized computed values
  const feedDomain = useMemo(() => {
    if (!feed?.Url) return '';
    try {
      return new URL(feed.Url).hostname;
    } catch {
      return feed.Url;
    }
  }, [feed?.Url]);

  // Loading states with modern design
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !feed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-red-200/50 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error}</p>
          <ModernButton onClick={() => window.location.reload()} variant="primary">
            Try Again
          </ModernButton>
        </div>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200/50 shadow-lg">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rss className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Feed Not Found</h2>
          <p className="text-gray-600 text-sm">The requested feed could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header with back navigation */}
        <div className="flex items-center mb-6">
          <ModernButton
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            className="mr-4"
          >
            Back
          </ModernButton>
          <div className="h-6 w-px bg-gray-300 mr-4"></div>
          <h1 className="text-lg font-medium text-gray-900">Feed Details</h1>
        </div>

        {/* Feed Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Rss className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold text-gray-900 mb-1 truncate">{feed.Name}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      <span className="font-medium">{feedDomain}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(feed.CreatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <a
                  href={feed.Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors break-all flex items-center gap-1 group"
                >
                  <span className="truncate">{feed.Url}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>

            <ModernButton
              onClick={() => handleScrapeFeed(id as string)}
              disabled={scraping}
              variant="primary"
              size="md"
              icon={scraping ?
                <RefreshCw className="w-4 h-4 animate-spin" /> :
                <RefreshCw className="w-4 h-4" />
              }
            >
              {scraping ? "Updating..." : "Update Feed"}
            </ModernButton>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Articles</h2>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rss className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                This feed doesn't have any articles. Try updating the feed to fetch the latest content.
              </p>
              <ModernButton
                onClick={() => handleScrapeFeed(id as string)}
                disabled={scraping}
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                {scraping ? "Updating..." : "Update Feed"}
              </ModernButton>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {items.map((item, index) => (
                <article
                  key={item._id || index}
                  className="p-6 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {item.link && item.link !== '#' ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 hover:underline"
                        >
                          <span className="flex-1">{item.title || 'Untitled'}</span>
                          <ExternalLink className="w-4 h-4 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span>{item.title || 'Untitled'}</span>
                      )}
                    </h3>

                    {item.description && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.pubDate || '')}</span>
                      </div>
                      {item.link && item.link !== '#' && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-32">
                            {(() => {
                              try {
                                return new URL(item.link).hostname;
                              } catch {
                                return 'External link';
                              }
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
