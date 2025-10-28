"use client";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ACTIVE_STATUSES } from "@/types/subscriptions";
import { SUBSCRIPTION_TIERS } from "@/config/subscriptions";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OpenAI from "openai";
export default function AvatarGeneratorPage() {
  // 所有Hooks必须在组件顶部调用，在任何条件渲染之前
  const router = useRouter();
  const { toast } = useToast();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 头像生成表单状态 - 移到组件顶部，确保每次渲染时Hooks调用顺序一致
  const [avatarStyle, setAvatarStyle] = useState("Cartoon");
  const [description, setDescription] = useState("");
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string | null>(
    null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const supabase = createClient();

        // 检查用户认证状态
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          toast({ title: "认证错误", description: userError.message });
          router.replace("/sign-in");
          return;
        }

        if (!user) {
          router.replace("/sign-in");
          return;
        }

        // 获取用户订阅信息
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select(
            `
            *,
            subscriptions (
              status,
              current_period_end,
              creem_product_id
            )
          `
          )
          .eq("user_id", user.id)
          .single();

        if (customerError) {
          toast({ title: "数据获取失败", description: customerError.message });
          return;
        }

        if (!customerData) {
          toast({ title: "数据缺失", description: "未找到您的账户信息" });
          return;
        }

        // 处理订阅数据（确保数组安全访问）
        const subscriptions = Array.isArray(customerData.subscriptions)
          ? customerData.subscriptions
          : customerData.subscriptions
            ? [customerData.subscriptions]
            : [];
        const activeSubscription = subscriptions.find(
          (sub) => sub && ACTIVE_STATUSES.includes(sub.status as string)
        );

        // 检查是否为Premium订阅
        if (activeSubscription) {
          const isPremiumTier = SUBSCRIPTION_TIERS.some(
            (tier) =>
              tier.productId === activeSubscription.creem_product_id &&
              tier.name === "Premium"
          );
          // 兼容直接产品ID检查
          const isPremiumProduct =
            activeSubscription.creem_product_id ===
            "prod_5Kqq7BxbLyxmO1sM0Pc5LY";
          setIsPremium(isPremiumTier || isPremiumProduct);
        }
      } catch (error) {
        console.error("获取用户数据失败:", error);
        toast({
          title: "系统错误",
          description: "加载数据时发生错误，请稍后重试",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserSubscription();
  }, [router, toast]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex-1 w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  const handleOptimizeDescription = async () => {
    // 验证输入
    if (!description.trim()) {
      toast({ title: "输入错误", description: "请先输入头像描述" });
      return;
    }

    setIsOptimizing(true);
    try {
      // 使用OpenAI库调用大模型
      const client = new OpenAI({
        baseURL: process.env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1",
        apiKey:
          process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "sk-tvcwevarnuxopipulvzsqilteuwbrivzihandabyzprbijhl",
          dangerouslyAllowBrowser: true
      });

      const response = await client.chat.completions.create({
        model: "THUDM/GLM-4.1V-9B-Thinking",
        messages: [
          {
            role: "user",
            content:
              "请优化以下头像描述，使其更详细、更具表现力，以便AI能够生成更精准的头像：\n\n" +
              description +
              "\n\n请直接返回优化后的描述文本，不要添加其他说明。",
          },
        ],
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.7,
        frequency_penalty: 0.5,
        n: 1,
      });

      if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
        setDescription(response.choices[0].message.content.trim());
        toast({ title: "优化成功", description: "头像描述已优化" });
      } else {
        throw new Error("无效的API响应格式");
      }
    } catch (error) {
      console.error("优化描述错误:", error);
      toast({
        title: "优化失败",
        description: "无法优化描述，请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleGenerate = async () => {
    // 验证输入
    if (!description.trim()) {
      toast({ title: "输入错误", description: "请输入头像描述" });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ style: avatarStyle, description }),
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.avatarUrl) {
        setGeneratedAvatarUrl(data.avatarUrl);
        toast({ title: "成功", description: "头像生成成功！" });
      } else {
        toast({
          title: "生成失败",
          description: data.error || "无法生成头像，请重试",
        });
      }
    } catch (error) {
      console.error("生成头像错误:", error);
      toast({ title: "系统错误", description: "生成头像时发生错误" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedAvatarUrl) {
      try {
        const link = document.createElement("a");
        link.href = generatedAvatarUrl;
        link.download = "generated-avatar.png";
        document.body.appendChild(link);
        link.click();
        // 延迟移除以确保下载触发
        setTimeout(() => document.body.removeChild(link), 100);
      } catch (error) {
        console.error("下载错误:", error);
        toast({ title: "下载失败", description: "无法下载头像，请重试" });
      }
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-6 px-4 sm:px-8 container py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">头像生成器</h1>
      <p className="text-muted-foreground mb-6">根据您的偏好生成自定义头像。</p>

      {isPremium ? (
        <div>
          {/* 头像生成表单 */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>生成您的头像</CardTitle>
              <CardDescription>高级用户可以生成自定义头像。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">头像风格</label>
                <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择头像风格" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cartoon">卡通</SelectItem>
                    <SelectItem value="Realistic">写实</SelectItem>
                    <SelectItem value="Anime">动漫</SelectItem>
                    <SelectItem value="Pixel Art">像素艺术</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">描述</label>
                <Textarea
                  placeholder="描述您想要生成的头像..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleOptimizeDescription}
                  disabled={isOptimizing}
                  className="mt-2"
                >
                  {isOptimizing ? "优化中..." : "优化描述"}
                </Button>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || isOptimizing}
              >
                {isGenerating ? "生成中..." : "生成头像"}
              </Button>
            </CardContent>
          </Card>

          {/* 头像预览 */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>生成的头像</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-md p-4 bg-muted/50 h-64 flex items-center justify-center">
                {generatedAvatarUrl ? (
                  <img
                    src={generatedAvatarUrl}
                    alt="生成的头像"
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <p className="text-muted-foreground">头像将显示在这里</p>
                )}
              </div>
            </CardContent>
            {generatedAvatarUrl && (
              <CardFooter className="flex gap-2">
                <Button onClick={handleDownload}>下载</Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? "生成中..." : "重新生成"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      ) : (
        <Card className="text-center">
          <CardHeader className="space-y-1">
            <div className="mx-auto text-primary text-4xl">🔒</div>
            <CardTitle>高级功能</CardTitle>
            <CardDescription>
              头像生成功能仅对高级订阅用户开放。
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <a href="/pricing">升级到高级版</a>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
