"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Search, Clock, Info, AlertTriangle } from "lucide-react";
import { SearchHistoryRecord } from "@/utils/search-history-utils";
import { createClient } from "@/utils/supabase/client";

interface SearchHistoryDetailProps {
  params: {
    id: string;
  };
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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

const SearchHistoryDetail = () => {
  const router = useRouter();
  const params = useParams() as { id: string };
  const { user, loading } = useUser();
  const { toast } = useToast();
  const [historyDetail, setHistoryDetail] = useState<SearchHistoryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
      return;
    }

    if (user && params.id) {
      fetchHistoryDetail();
    }
  }, [user, loading, params.id, router]);

  const fetchHistoryDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      
      // 获取搜索历史详情
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user!.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setHistoryDetail(data);
    } catch (err) {
      console.error('Failed to fetch history detail:', err);
      setError('无法加载搜索历史详情，请稍后再试。');
      toast({
        title: "加载失败",
        description: "无法加载搜索历史详情，请稍后再试。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 md:px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/profile')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </div>
        </div>
        
        {/* Loading */}
        <div className="container px-4 md:px-6 py-8">
          <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !historyDetail) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 md:px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/profile')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </div>
        </div>
        
        {/* Error */}
        <div className="container px-4 md:px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">无法找到记录</h3>
                <p className="text-muted-foreground mb-6">
                  {error || "搜索历史记录不存在或已被删除"}
                </p>
                <Button onClick={() => router.push('/profile')}>
                  返回个人资料
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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
              onClick={() => router.push('/profile')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">搜索历史详情</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Search Query Card */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{historyDetail.search_query}</CardTitle>
                <Badge className={getSearchTypeColor(historyDetail.search_type)}>
                  {getSearchTypeLabel(historyDetail.search_type)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(historyDetail.metadata?.search_date || new Date().toISOString())}</span>
                </div>
                {historyDetail.metadata?.results_count && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <span>{historyDetail.metadata.results_count} 条结果</span>
                  </div>
                )}
              </div>
              
              {/* Additional Info */}
              {historyDetail.metadata?.additional_info && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium mb-1">详细信息</h4>
                      <p className="text-sm text-muted-foreground">
                        {historyDetail.metadata.additional_info}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Search Results Card */}
          {historyDetail.search_results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">搜索结果</CardTitle>
                <CardDescription>
                  本次搜索返回的结果
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyDetail.search_type === 'pronunciation_search' && historyDetail.search_results ? (
                  // 发音搜索结果的特殊展示
                  <div className="rounded-xl bg-background p-6 md:p-8 shadow-lg border border-border overflow-hidden">
                    <div className="flex flex-col gap-8">
                      {/* 标题部分 - 优化中文发音展示 */}
                      <div className="pb-5 border-b border-border/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex-1">
                          {historyDetail.search_results.translation && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">原文</p>
                              <p className="text-xl text-foreground italic font-light">{historyDetail.search_results.translation}</p>
                            </div>
                          )}
                          <div className="flex items-center flex-wrap gap-4 mb-2">
                            <h1 className="text-4xl md:text-5xl font-chinese text-foreground">
                              {historyDetail.search_results.chinese}
                            </h1>
                            <div className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                              {historyDetail.search_results.chineseIpa}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-lg text-muted-foreground font-medium">{historyDetail.search_results.pinyin}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            点击播放
                          </p>
                          <button
                            className="flex items-center justify-center size-20 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                            onClick={() => {
                              if ("speechSynthesis" in window) {
                                const utterance = new SpeechSynthesisUtterance(historyDetail.search_results.chinese);
                                utterance.lang = "zh-CN";
                                utterance.rate = 0.9;
                                window.speechSynthesis.cancel();
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                          >
                            <span className="text-4xl">▶️</span>
                          </button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            标准中文发音
                          </p>
                        </div>
                      </div>

                      {/* 发音匹配部分 */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-12 bg-primary rounded-full"></div>
                          <h3 className="text-xl font-semibold text-foreground">相似发音 (Similar Pronunciations)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {historyDetail.search_results.matchedWords && historyDetail.search_results.matchedWords.map((words, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center justify-center bg-white dark:bg-background p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30"
                            >
                              <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">英语近似</div>
                              <p className="text-2xl md:text-3xl font-bold text-primary mb-4 text-center">
                                "{words}"
                              </p>
                              <button
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90 active:scale-95 transition-all duration-200 text-sm font-medium"
                                onClick={() => {
                                  if ("speechSynthesis" in window) {
                                    const utterance = new SpeechSynthesisUtterance(words);
                                    utterance.lang = "en-US";
                                    utterance.rate = 0.9;
                                    window.speechSynthesis.cancel();
                                    window.speechSynthesis.speak(utterance);
                                  }
                                }}
                              >
                                播放发音
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground mb-1">发音比较</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  中文: <span className="font-mono text-primary">{historyDetail.search_results.chineseIpa}</span>
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                  英语: <span className="font-mono text-primary">{historyDetail.search_results.englishPhonetic}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 解释文本 */}
                      {historyDetail.search_results.pronunciationNote && (
                        <div className="bg-muted/20 p-5 rounded-lg border border-border/50">
                          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">发音指南</h4>
                          <p className="text-muted-foreground text-base leading-relaxed">
                            {historyDetail.search_results.pronunciationNote}
                          </p>
                        </div>
                      )}

                      {/* 例句部分 */}
                      {historyDetail.search_results.example && (
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                          <div className="p-5 bg-muted">
                            <span className="text-base font-medium text-foreground">
                              例句
                            </span>
                          </div>
                          <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">中文</p>
                                <p className="text-xl text-foreground font-chinese">
                                  {historyDetail.search_results.example.chinese}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">英文</p>
                                <p className="text-muted-foreground italic text-lg">
                                  "{historyDetail.search_results.example.english}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : historyDetail.search_type === 'famous_person_search' && historyDetail.search_results ? (
                  // 名人搜索结果的特殊展示
                  <div className="rounded-xl bg-background p-6 md:p-8 shadow-lg border border-border overflow-hidden">
                    <div className="space-y-8">
                      {/* 标题和发音部分 - 重点突出名字发音 */}
                      <div className="pb-5 border-b border-border/70">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                              {historyDetail.search_results.name || historyDetail.search_query}
                              {historyDetail.search_results.englishName && (
                                <span className="ml-3 text-xl text-muted-foreground font-normal">
                                  ({historyDetail.search_results.englishName})
                                </span>
                              )}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {historyDetail.search_results.pronunciation && (
                                <span className="text-lg text-muted-foreground font-medium">{historyDetail.search_results.pronunciation}</span>
                              )}
                              {historyDetail.search_results.pinyin && (
                                <div className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                  {historyDetail.search_results.pinyin}
                                </div>
                              )}
                              {historyDetail.search_results.englishPronunciation && (
                                <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full text-sm font-medium">
                                  {historyDetail.search_results.englishPronunciation}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 发音播放按钮 */}
                          <div className="flex flex-col items-center">
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              播放名字发音
                            </p>
                            <button
                              className="flex items-center justify-center size-20 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                              onClick={() => {
                                if ("speechSynthesis" in window) {
                                  const nameToSpeak = historyDetail.search_results.name || historyDetail.search_query;
                                  const utterance = new SpeechSynthesisUtterance(nameToSpeak);
                                  utterance.lang = "zh-CN";
                                  utterance.rate = 0.9;
                                  window.speechSynthesis.cancel();
                                  window.speechSynthesis.speak(utterance);
                                }
                              }}
                            >
                              <span className="text-4xl">▶️</span>
                            </button>
                          </div>
                        </div>
                        
                        {/* 时期标签 */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {historyDetail.search_results.period && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                              {historyDetail.search_results.period}
                            </Badge>
                          )}
                          {historyDetail.search_results.englishPeriod && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              {historyDetail.search_results.englishPeriod}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* 发音详情卡片 */}
                      {(historyDetail.search_results.pronunciation || historyDetail.search_results.nameMeaning || historyDetail.search_results.englishNameMeaning || historyDetail.search_results.matchedWords) && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="text-primary">名字发音与含义</span>
                            </CardTitle>
                            <CardDescription>
                              Name Pronunciation & Meaning
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* 发音详情 */}
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium text-muted-foreground">发音详情 / Pronunciation Details</h3>
                              <div className="flex flex-wrap gap-3">
                                {historyDetail.search_results.pronunciation && (
                                  <div className="flex items-center px-4 py-2 bg-background rounded-lg border border-border">
                                    <span className="text-sm font-medium">标准发音:</span>
                                    <span className="ml-2 text-foreground">{historyDetail.search_results.pronunciation}</span>
                                  </div>
                                )}
                                {historyDetail.search_results.pinyin && (
                                  <div className="flex items-center px-4 py-2 bg-background rounded-lg border border-border">
                                    <span className="text-sm font-medium">拼音:</span>
                                    <span className="ml-2 text-primary font-medium">{historyDetail.search_results.pinyin}</span>
                                  </div>
                                )}
                                {historyDetail.search_results.phonetic && (
                                  <div className="flex items-center px-4 py-2 bg-background rounded-lg border border-border">
                                    <span className="text-sm font-medium">国际音标:</span>
                                    <span className="ml-2 text-foreground font-mono">{historyDetail.search_results.phonetic}</span>
                                  </div>
                                )}
                                {historyDetail.search_results.englishPhonetic && (
                                  <div className="flex items-center px-4 py-2 bg-background rounded-lg border border-blue-200 dark:border-blue-900">
                                    <span className="text-sm font-medium">英语发音:</span>
                                    <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium font-mono">{historyDetail.search_results.englishPhonetic}</span>
                                  </div>
                                )}
                                {historyDetail.search_results.englishPronunciation && (
                                  <div className="flex items-center px-4 py-2 bg-background rounded-lg border border-border">
                                    <span className="text-sm font-medium">English Pronunciation:</span>
                                    <span className="ml-2 text-foreground font-medium">{historyDetail.search_results.englishPronunciation}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* 匹配发音词 */}
                            {historyDetail.search_results.matchedWords && (
                              <div className="mt-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">匹配发音词 / Matched Words</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Array.isArray(historyDetail.search_results.matchedWords) && historyDetail.search_results.matchedWords.map((word, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border">
                                      <span className="text-primary font-medium">{word}</span>
                                      <button
                                        className="ml-auto px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                                        onClick={() => {
                                          if ("speechSynthesis" in window) {
                                            const utterance = new SpeechSynthesisUtterance(word);
                                            utterance.lang = "en-US";
                                            utterance.rate = 0.9;
                                            window.speechSynthesis.cancel();
                                            window.speechSynthesis.speak(utterance);
                                          }
                                        }}
                                      >
                                        播放
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 发音注释 */}
                            {historyDetail.search_results.pronunciationNote && (
                              <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <h3 className="text-sm font-medium text-primary mb-2">发音指南 / Pronunciation Guide</h3>
                                <p className="text-foreground leading-relaxed">
                                  {historyDetail.search_results.pronunciationNote}
                                </p>
                              </div>
                            )}
                            
                            {/* 名字含义 */}
                            {(historyDetail.search_results.nameMeaning || historyDetail.search_results.englishNameMeaning) && (
                              <div className="mt-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">名字含义 / Name Meaning</h3>
                                {historyDetail.search_results.nameMeaning && (
                                  <p className="text-foreground leading-relaxed mb-3">
                                    {historyDetail.search_results.nameMeaning}
                                  </p>
                                )}
                                {historyDetail.search_results.englishNameMeaning && (
                                  <p className="text-foreground leading-relaxed">
                                    {historyDetail.search_results.englishNameMeaning}
                                  </p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                      

                      {/* 文化意义 */}
                      {(historyDetail.search_results.culturalSignificance || historyDetail.search_results.englishCulturalSignificance) && (
                        <div className="border border-border/50 rounded-lg overflow-hidden">
                          <div className="p-5 bg-muted">
                            <div>
                              <span className="text-base font-medium text-foreground">
                                文化意义
                              </span>
                            </div>
                            <div>
                              <span className="text-base font-medium text-muted-foreground">
                                Cultural Significance
                              </span>
                            </div>
                          </div>
                          <div className="p-5 space-y-4">
                            {historyDetail.search_results.culturalSignificance && (
                              <p className="text-muted-foreground leading-relaxed">
                                {historyDetail.search_results.culturalSignificance}
                              </p>
                            )}
                            {historyDetail.search_results.englishCulturalSignificance && (
                              <p className="text-muted-foreground leading-relaxed">
                                {historyDetail.search_results.englishCulturalSignificance}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // 其他类型搜索结果的JSON展示
                  <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-96">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(historyDetail.search_results, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.push('/profile')}
            >
              返回历史列表
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryDetail;