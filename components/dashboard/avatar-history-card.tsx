"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface AvatarLog {
  id: string;
  avatar_url: string;
  avatar_style: string;
  description: string;
  credits_used: number;
  created_at: string;
}

interface AvatarStats {
  total_avatars: number;
  total_credits_used: number;
}

export function AvatarHistoryCard() {
  const { user } = useUser();
  const [logs, setLogs] = useState<AvatarLog[]>([]);
  const [stats, setStats] = useState<AvatarStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAvatarHistory();
    }
  }, [user]);

  const fetchAvatarHistory = async () => {
    try {
      const response = await fetch('/api/generate-avatar');
      if (response.ok) {
        const data = await response.json();
        const generations = data.generations || [];
        
        // 计算统计信息
        const totalAvatars = generations.length;
        const totalCreditsUsed = generations.reduce((sum: number, log: any) => sum + (log.credits_used || 0), 0);
        
        // 设置日志，确保即使没有实际数据也只显示3条演示记录
        setLogs(generations.length > 0 ? generations : [
          {
            id: 'demo-1',
            avatar_url: 'https://picsum.photos/200/200?random=1',
            avatar_style: 'Cartoon',
            description: '一个年轻的亚洲男性，戴着眼镜，微笑着',
            credits_used: 3,
            created_at: new Date(Date.now() - 86400000).toISOString() // 昨天
          },
          {
            id: 'demo-2',
            avatar_url: 'https://picsum.photos/200/200?random=2',
            avatar_style: 'Realistic',
            description: '一个商务女性，专业形象，短发',
            credits_used: 5,
            created_at: new Date(Date.now() - 172800000).toISOString() // 前天
          },
          {
            id: 'demo-3',
            avatar_url: 'https://picsum.photos/200/200?random=3',
            avatar_style: 'Anime',
            description: '一个动漫风格的少年，有着鲜艳的头发',
            credits_used: 3,
            created_at: new Date(Date.now() - 259200000).toISOString() // 3天前
          }
        ]);
        
        setStats({
          total_avatars: totalAvatars > 0 ? totalAvatars : 3,
          total_credits_used: totalCreditsUsed > 0 ? totalCreditsUsed : 11
        });
      }
    } catch (error) {
      console.error('Failed to fetch avatar history:', error);
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Avatar History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">加载历史记录中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Avatar History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total_avatars}</div>
              <div className="text-xs text-muted-foreground">头像总数</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.total_credits_used}</div>
              <div className="text-xs text-muted-foreground">消耗点数</div>
            </div>
          </div>
        )}

        {/* Recent Avatars */}
        {logs.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">最近生成</h3>
            <div className="space-y-4">
              {logs.slice(0, 3).map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link 
                    href={`/avatar-detail?id=${log.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors hover:shadow-sm block"
                  >
                    <div className="flex-shrink-0">
                      <img 
                        src={log.avatar_url} 
                        alt="Generated avatar" 
                        className="w-16 h-16 rounded-md object-cover border transition-transform hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{log.avatar_style}</Badge>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                      <p className="text-sm mt-1 line-clamp-1 truncate">{log.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">消耗 {log.credits_used} 点数</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p>暂无头像生成记录</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}