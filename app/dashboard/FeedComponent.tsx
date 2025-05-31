/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { memo, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  Eye, 
  Heart, 
  HeartOff, 
  Trash2, 
  ExternalLink,
  Clock,
  Rss,
  Sparkles
} from "lucide-react";

interface FeedComponentProps {
  feed: any;
  feedItems: any[];
  isScrapingFeed: boolean;
  isDeletingFeed: boolean;
  isFollowingFeed: boolean;
  isFollowed: boolean;
  onScrapeFeed: (feedId: string) => void;
  onViewFeed: (feedId: string) => void;
  onFollowFeed: (feedId: string) => void;
  onUnfollowFeed: (feedId: string) => void;
  onDeleteFeed: (feedId: string) => void;
}

const FeedComponent = memo<FeedComponentProps>(({
  feed,
  feedItems,
  isScrapingFeed,
  isDeletingFeed,
  isFollowingFeed,
  isFollowed,
  onScrapeFeed,
  onViewFeed,
  onFollowFeed,
  onUnfollowFeed,
  onDeleteFeed,
}) => {
  // Memoized computations for performance
  const { displayUrl, itemCount, latestItems, timeAgo } = useMemo(() => {
    const displayUrl = feed.Url ? new URL(feed.Url).hostname.replace('www.', '') : 'No URL';
    const itemCount = feedItems.length;
    const latestItems = feedItems.slice(0, 2);
    
    const timeAgo = (() => {
      if (!feed.CreatedAt) return "Recently";
      try {
        const date = new Date(feed.CreatedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays <= 7) return `${diffDays} days ago`;
        if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
      } catch {
        return "Recently";
      }
    })();

    return { displayUrl, itemCount, latestItems, timeAgo };
  }, [feed, feedItems]);

  // Memoized handlers to prevent re-renders
  const handleScrape = useCallback(() => onScrapeFeed(feed.ID), [feed.ID, onScrapeFeed]);
  const handleView = useCallback(() => onViewFeed(feed.ID), [feed.ID, onViewFeed]);
  const handleFollow = useCallback(() => {
    isFollowed ? onUnfollowFeed(feed.ID) : onFollowFeed(feed.ID);
  }, [feed.ID, isFollowed, onFollowFeed, onUnfollowFeed]);
  const handleDelete = useCallback(() => onDeleteFeed(feed.ID), [feed.ID, onDeleteFeed]);

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    hover: { 
      y: -2,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const bounceVariants = {
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      layout
    >
      <Card className="group relative bg-white border-2 border-gray-100 hover:border-gray-200 rounded-2xl transition-all duration-300 hover:shadow-lg shadow-sm">
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className="relative"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                    <Rss className="w-5 h-5 text-white" />
                  </div>
                  {itemCount > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                    />
                  )}
                </motion.div>
                
                <div className="flex flex-col gap-1">
                  <Badge 
                    variant="secondary" 
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors px-3 py-1 text-xs rounded-full w-fit"
                  >
                    {itemCount} articles ✨
                  </Badge>
                  {isFollowed && (
                    <Badge 
                      variant="outline" 
                      className="bg-pink-50 text-pink-600 border-pink-200 px-3 py-1 text-xs rounded-full w-fit"
                    >
                      <Heart className="w-3 h-3 mr-1 fill-current" />
                      Following
                    </Badge>
                  )}
                </div>
              </div>
              
              <CardTitle className="text-xl font-bold text-black mb-2 group-hover:text-gray-700 transition-colors">
                {feed.Name || "Unnamed Feed"} 
                <span className="text-lg">📰</span>
              </CardTitle>
              
              <CardDescription className="flex items-center gap-2 text-sm text-gray-500">
                <ExternalLink className="w-4 h-4" />
                <span className="truncate">{displayUrl}</span>
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Added {timeAgo}</span>
            </div>
            {latestItems.length > 0 && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span>Fresh content!</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Latest Articles Preview */}
          <AnimatePresence>
            {latestItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-gray-50 rounded-xl"
              >
                <h4 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
                  📚 Latest Articles
                </h4>
                <div className="space-y-2">
                  {latestItems.map((item, index) => (
                    <motion.div
                      key={item._id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 p2 rounded-lg hover:bg-white transition-colors"
                    >
                      <div className="w-2 h-2 bg-black rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {item.title || 'Untitled Article'}
                      </p>
                    </motion.div>
                  ))}
                  {feedItems.length > 2 && (
                    <p className="text-xs text-gray-400 pl-4">
                      and {feedItems.length - 2} more! 🎉
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            <motion.div variants={bounceVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={handleScrape}
                disabled={!feed.ID || isScrapingFeed}
                size="sm"
                className="h-10 bg-black hover:bg-gray-800 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <AnimatePresence mode="wait">
                  {isScrapingFeed ? (
                    <motion.div
                      key="loading"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div key="refresh">
                      <RefreshCw className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            <motion.div variants={bounceVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={handleView}
                disabled={!feed.ID}
                size="sm"
                variant="outline"
                className="h-10 border-2 border-gray-200 bg-white text-black hover:bg-gray-50 hover:border-gray-300 rounded-xl transition-all duration-200"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div variants={bounceVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={handleFollow}
                disabled={!feed.ID || isFollowingFeed}
                size="sm"
                variant="outline"
                className={`h-10 rounded-xl transition-all duration-200 ${
                  isFollowed 
                    ? "border-2 border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100" 
                    : "border-2 border-gray-200 bg-white text-black hover:bg-gray-50"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isFollowingFeed ? (
                    <motion.div
                      key="loading"
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                  ) : isFollowed ? (
                    <motion.div
                      key="followed"
                      whileHover={{ scale: 1.2 }}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </motion.div>
                  ) : (
                    <motion.div key="follow">
                      <HeartOff className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            <motion.div variants={bounceVariants} whileHover="hover" whileTap="tap">
              <Button
                onClick={handleDelete}
                disabled={!feed.ID || isDeletingFeed}
                size="sm"
                variant="outline"
                className="h-10 border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                <AnimatePresence mode="wait">
                  {isDeletingFeed ? (
                    <motion.div
                      key="deleting"
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                    />
                  ) : (
                    <motion.div key="delete">
                      <Trash2 className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

FeedComponent.displayName = "FeedComponent";

export default FeedComponent;