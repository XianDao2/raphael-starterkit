"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Heart, 
  Search, 
  ChevronRight,
  Clock,
  Trash2,
  AlertTriangle
} from "lucide-react";

import { getUserSearchHistory, deleteSearchHistory, SearchHistoryRecord } from "@/utils/search-history-utils";

interface SavedName {
  id: string;
  chinese_name: string;
  pinyin: string;
  meaning: string;
  cultural_notes: string;
  personality_match: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  generation_metadata?: {
    style: string;
    saved_from: string;
    saved_at: string;
    page?: number;
  };
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();
  
  const [searchHistory, setSearchHistory] = useState<SearchHistoryRecord[]>([]);
  const [savedNames, setSavedNames] = useState<SavedName[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [deletingHistoryId, setDeletingHistoryId] = useState<string | null>(null);
  const [historyToDelete, setHistoryToDelete] = useState<SearchHistoryRecord | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
      return;
    }
    
    if (user) {
      loadSearchHistory();
      loadSavedNames();
    }
  }, [user, loading, router]);

  const loadSearchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getUserSearchHistory(50);
      setSearchHistory(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
      toast({
        title: "Loading Failed",
        description: "Unable to load search history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadSavedNames = async () => {
    setIsLoadingSaved(true);
    try {
      const response = await fetch('/api/saved-names');
      if (response.ok) {
        const data = await response.json();
        setSavedNames(data.names || []);
      }
    } catch (error) {
      console.error('Failed to load saved names:', error);
      toast({
        title: "Loading Failed",
        description: "Unable to load saved names. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSearchTypeLabel = (searchType: string) => {
    switch (searchType) {
      case 'famous_person_search':
        return 'Famous Person';
      case 'pronunciation_search':
        return 'Pronunciation';
      default:
        return 'Other';
    }
  };

  const getSearchTypeColor = (searchType: string) => {
    switch (searchType) {
      case 'famous_person_search':
        return 'bg-amber-100 text-amber-700';
      case 'pronunciation_search':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDeleteHistory = async (history: SearchHistoryRecord) => {
    setHistoryToDelete(history);
  };

  const confirmDeleteHistory = async () => {
    if (!historyToDelete?.id) return;
    
    setDeletingHistoryId(historyToDelete.id);
    try {
      const success = await deleteSearchHistory(historyToDelete.id);
      
      if (success) {
        // Remove from local state
        setSearchHistory(prev => prev.filter(h => h.id !== historyToDelete.id));
        toast({
          title: "Deleted Successfully",
          description: `Search record for "${historyToDelete.search_query}" has been deleted.`,
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete search history:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete search record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingHistoryId(null);
      setHistoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setHistoryToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Profile</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history" className="gap-2">
                <Search className="h-4 w-4" />
                Search History ({searchHistory.length})
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Heart className="h-4 w-4" />
                Saved Names ({savedNames.length})
              </TabsTrigger>
            </TabsList>

            {/* Search History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Search History</h2>
                <Badge variant="secondary">
                  {searchHistory.length} searches total
                </Badge>
              </div>

              {isLoadingHistory ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-1/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : searchHistory.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Search History</h3>
                    <p className="text-muted-foreground mb-4">
                      Start generating your first Chinese name!
                    </p>
                    <Button onClick={() => router.push('/')}>
                      Start Generating
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {searchHistory.map((history) => (
                    <motion.div
                      key={history.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group"
                    >
                      <Card 
                        className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                        onClick={() => router.push(`/profile/history/${history.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-3">
                                <h3 className="text-xl font-semibold">{history.search_query}</h3>
                                <Badge className={getSearchTypeColor(history.search_type)}>
                                  {getSearchTypeLabel(history.search_type)}
                                </Badge>
                              </div>
                                
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {formatDate(history.metadata?.search_date || new Date().toISOString())}
                                </div>
                                {history.metadata?.results_count && (
                                  <div className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    {history.metadata.results_count} results
                                  </div>
                                )}
                                <div className="hidden md:flex items-center gap-1 text-primary/70 group-hover:text-primary">
                                  <span className="text-xs">View Details</span>
                                  <ChevronRight className="h-3 w-3" />
                                </div>
                              </div>

                              {history.metadata?.additional_info && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-sm">
                                    <span className="font-medium">Details: </span>
                                    {history.metadata.additional_info}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteHistory(history);
                                }}
                                disabled={deletingHistoryId === history.id}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                {deletingHistoryId === history.id ? (
                                  <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Names Tab */}
            <TabsContent value="saved" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Saved Names</h2>
                <Badge variant="secondary">
                  {savedNames.length} names total
                </Badge>
              </div>

              {isLoadingSaved ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="h-6 bg-muted rounded w-2/3"></div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : savedNames.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Saved Names</h3>
                    <p className="text-muted-foreground mb-4">
                      Click "Save" when generating names to save your favorites
                    </p>
                    <Button onClick={() => router.push('/')}>
                      Start Generating
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedNames.map((name) => (
                    <motion.div
                      key={name.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-serif">{name.chinese_name}</CardTitle>
                            <Heart className="h-5 w-5 text-red-500 fill-current" />
                          </div>
                          <p className="text-muted-foreground">{name.pinyin}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm font-medium">{name.meaning}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {name.cultural_notes}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {name.generation_metadata?.style && (
                              <Badge variant="outline" className="text-xs">
                                {name.generation_metadata.style}
                              </Badge>
                            )}
                            <span>{formatDate(name.created_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!historyToDelete} onOpenChange={() => cancelDelete()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Search Record
            </DialogTitle>
            <DialogDescription className="space-y-2">
              Are you sure you want to delete this search record?
              <br />
              <span className="text-sm text-muted-foreground">
                This will permanently delete the search record for "{historyToDelete?.search_query}" 
                and cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteHistory}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}