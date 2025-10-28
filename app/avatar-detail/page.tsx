'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowLeft, Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AvatarDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const avatarId = searchParams.get('id');
  
  const [avatarData, setAvatarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (avatarId) {
      fetchAvatarDetails();
    } else {
      router.push('/dashboard');
    }
  }, [avatarId, router]);

  const fetchAvatarDetails = async () => {
    try {
      setIsLoading(true);
      // 首先获取所有头像历史
      const response = await fetch('/api/generate-avatar');
      if (response.ok) {
        const data = await response.json();
        const generations = data.generations || [];
        
        // 查找特定ID的头像
        let foundAvatar = generations.find((gen: any) => gen.id === avatarId);
        
        // 如果没有找到，使用模拟数据
        if (!foundAvatar && avatarId?.startsWith('demo-')) {
          foundAvatar = {
            id: avatarId,
            avatar_url: avatarId === 'demo-1' ? 'https://picsum.photos/200/200?random=1' : 
                        avatarId === 'demo-2' ? 'https://picsum.photos/200/200?random=2' : 
                        'https://picsum.photos/200/200?random=3',
            avatar_style: avatarId === 'demo-1' ? 'Cartoon' : 
                         avatarId === 'demo-2' ? 'Realistic' : 'Anime',
            description: avatarId === 'demo-1' ? '一个年轻的亚洲男性，戴着眼镜，微笑着' :
                        avatarId === 'demo-2' ? '一个商务女性，专业形象，短发' :
                        '一个动漫风格的少年，有着鲜艳的头发',
            credits_used: avatarId === 'demo-2' ? 5 : 3,
            created_at: avatarId === 'demo-1' ? new Date(Date.now() - 86400000).toISOString() :
                       avatarId === 'demo-2' ? new Date(Date.now() - 172800000).toISOString() :
                       new Date(Date.now() - 259200000).toISOString()
          };
        }
        
        if (foundAvatar) {
          setAvatarData(foundAvatar);
        } else {
          toast({ title: '未找到头像', description: '无法找到指定的头像记录' });
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Failed to fetch avatar details:', error);
      toast({ title: '加载失败', description: '获取头像详情时出错' });
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = avatarData.avatar_url;
      link.download = `avatar-${avatarData.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: '下载成功', description: '头像已开始下载' });
    } catch (error) {
      console.error('Failed to download avatar:', error);
      toast({ title: '下载失败', description: '无法下载头像' });
    }
  };

  const handleShare = () => {
    toast({ title: '分享功能', description: '分享功能即将上线' });
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12">
        <div className="animate-pulse text-muted-foreground">加载头像详情中...</div>
      </div>
    );
  }

  if (!avatarData) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6 px-4 sm:px-8 container py-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/dashboard')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回仪表盘</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 头像预览 */}
        <Card className="md:col-span-1">
          <CardContent className="p-0">
            <div className="aspect-square relative overflow-hidden bg-muted">
              <img 
                src={avatarData.avatar_url} 
                alt="Generated avatar" 
                className="w-full h-full object-contain p-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* 头像信息 */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{avatarData.avatar_style}</Badge>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(avatarData.created_at)}
              </div>
            </div>
            <CardTitle>头像详情</CardTitle>
            <CardDescription>查看和管理您的生成头像</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">描述</h3>
              <p className="text-base">{avatarData.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">头像ID</p>
                <p className="text-sm font-medium break-all">{avatarData.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">消耗点数</p>
                <p className="text-sm font-medium">{avatarData.credits_used} 点</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                下载头像
              </Button>
              <Button variant="secondary" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                分享
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作建议 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">更多操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/avatar-generator" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                生成新头像
              </Button>
            </Link>
            <Link href="/dashboard" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 hover:bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" x2="16" y1="21" y2="21"/>
                  <line x1="12" x2="12" y1="17" y2="21"/>
                </svg>
                查看所有头像
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}