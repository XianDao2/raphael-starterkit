"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import OpenAI from "openai";
import { Search, RefreshCw, Info, User, Users, Calendar, Globe, BookOpen } from "lucide-react";
import PronunciationResult from "@/components/product/pronunciation/PronunciationResult";

interface FamousPerson {
  name: string; // 中文名
  nameEn: string; // 英文名
  pronunciation: string; // 类似英文读音
  image: string; // 头像URL
  birthYear: string; // 出生年份
  birthPlace: string; // 出生地
  field: string; // 领域
  description: string; // 人物简介
  achievements: string[]; // 主要成就
  quotes?: string; // 名言
  chineseIpa?: string; // 中文IPA音标
}

export default function FamousPeoplePage() {
  const [famousPerson, setFamousPerson] = useState<FamousPerson | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFamousPerson = async () => {
    setIsGenerating(true);
    try {
      // 1. 首先生成名人信息
      const personInfo = await generatePersonInfo();
      
      // 2. 然后根据生成的信息创建头像提示词并生成头像
      const imagePrompt = `简笔画风格的${personInfo.field}家${personInfo.name}，线条简单清晰，黑白风格，适合识别，不要文字，人物形象突出，背景简洁`;
      const imageUrl = await generateAvatar(imagePrompt);
      
      // 3. 组合完整的名人信息
      setFamousPerson({
        ...personInfo,
        image: imageUrl
      });
      
      toast({ title: "生成成功", description: `已生成${personInfo.name}的信息` });
    } catch (error) {
      console.error("生成名人信息失败:", error);
      toast({ title: "生成失败", description: "无法生成名人信息，请稍后再试" });
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePersonInfo = async (): Promise<Omit<FamousPerson, "image">> => {
    const client = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1",
      apiKey: 
        process.env.OPENROUTER_API_KEY || 
        process.env.OPENAI_API_KEY || 
        "sk-tvcwevarnuxopipulvzsqilteuwbrivzihandabyzprbijhl",
      dangerouslyAllowBrowser: true
    });

    const prompt = `
请随机生成一位中国或国际知名的历史人物、科学家、艺术家、政治人物、企业家等领域的名人信息。

请输出以下格式的JSON：
{
  "name": "中文名",
  "nameEn": "英文名",
  "pronunciation": "类似英文发音的注音（用简单的英文单词组合表示）",
  "chineseIpa": "中文IPA音标",
  "birthYear": "出生年份",
  "birthPlace": "出生地",
  "field": "领域（如科学家、艺术家等）",
  "description": "200字以内的人物简介，包括生平主要经历",
  "achievements": ["成就1", "成就2", "成就3"],
  "quotes": "一句名人名言（如果有）"
}

请确保信息准确，选择真实存在的历史人物或当代名人。
请直接返回JSON，不要添加其他说明文字。
`;

    const response = await client.chat.completions.create({
      model: "THUDM/GLM-4.1V-9B-Thinking",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 1000,
      temperature: 0.8
    });

    if (!response.choices[0]?.message?.content) {
      throw new Error("无法获取名人信息");
    }

    const content = response.choices[0].message.content;
    // 提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("响应格式错误");
    }
    
    return JSON.parse(jsonMatch[0]);
  };

  const generateAvatar = async (prompt: string): Promise<string> => {
    const client = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1",
      apiKey: 
        process.env.OPENROUTER_API_KEY || 
        process.env.OPENAI_API_KEY || 
        "sk-tvcwevarnuxopipulvzsqilteuwbrivzihandabyzprbijhl",
      dangerouslyAllowBrowser: true
    });

    const response = await client.images.generate({
      model: "Kwai-Kolors/Kolors",
      prompt: prompt,
      negative_prompt: "复杂背景, 文字, 模糊, 彩色, 细节过多",
      image_size: "1024x1024",
      num_inference_steps: 20,
      guidance_scale: 7.5
    });

    if (!response.data || !response.data[0]?.url) {
      throw new Error("无法生成头像");
    }

    return response.data[0].url;
  };

  // 组件加载时自动生成一位名人
  useEffect(() => {
    generateFamousPerson();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* 页面标题 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 text-foreground">认识名人</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            随机生成历史和当代名人信息，帮助你了解不同领域的杰出人物，扩展知识面
          </p>
        </motion.div>

        {/* 生成按钮 */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={generateFamousPerson}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-md font-medium"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            {isGenerating ? "生成中..." : "随机生成另一位名人"}
          </Button>
        </div>

        {/* 名人信息卡片 */}
        {isGenerating && !famousPerson ? (
          // 加载状态
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-border overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl">正在生成名人信息...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-32 h-32 rounded-full bg-muted animate-pulse" />
                    <div className="w-full space-y-4">
                      <div className="h-8 bg-muted rounded animate-pulse" />
                      <div className="h-6 bg-muted/50 rounded animate-pulse" />
                      <div className="h-6 bg-muted/50 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-6 bg-muted/70 rounded animate-pulse" />
                    <div className="h-48 bg-muted/50 rounded animate-pulse" />
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-6 bg-muted/70 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : famousPerson ? (
          // 名人信息
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="border-border overflow-hidden shadow-md">
              {/* 头部信息 */}
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  {famousPerson.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">{famousPerson.nameEn}</span> • {famousPerson.field}
                </p>
              </CardHeader>
              
              <CardContent className="pt-4">
                {/* 头像和基本信息 */}
                  <div className="flex flex-col gap-8">
                    {/* 头像 */}
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="flex justify-center"
                    >
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                        <img 
                          src={famousPerson.image} 
                          alt={famousPerson.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </motion.div>
                    
                    {/* 中文发音组件 */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <PronunciationResult 
                        type="cn" 
                        value={famousPerson.name} 
                        isLoading={false} 
                        result={{
                          chinese: famousPerson.name,
                          pinyin: famousPerson.pronunciation,
                          chineseIpa: famousPerson.chineseIpa || `/\${famousPerson.pronunciation}/`,
                          matchedWords: [famousPerson.nameEn.split(' ')[0] || 'Example'],
                          englishPhonetic: famousPerson.pronunciation,
                          pronunciationNote: `这是${famousPerson.name}的标准中文发音。${famousPerson.field}家${famousPerson.name}出生于${famousPerson.birthYear}年。`,
                          example: {
                            chinese: `${famousPerson.name}是著名的${famousPerson.field}家。`,
                            english: `${famousPerson.nameEn} is a famous ${famousPerson.field}.`
                          }
                        }}
                      />
                    </motion.div>
                    
                    {/* 基本信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">出生年份</p>
                          <p className="font-medium">{famousPerson.birthYear}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground">出生地</p>
                          <p className="font-medium">{famousPerson.birthPlace}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                
                {/* 人物简介 */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    人物简介
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {famousPerson.description}
                  </p>
                </motion.div>
                
                {/* 主要成就 */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    主要成就
                  </h3>
                  <ul className="space-y-2">
                    {famousPerson.achievements.map((achievement, index) => (
                      <motion.li 
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium mt-0.5 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-muted-foreground">{achievement}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
                
                {/* 名人名言 */}
                {famousPerson.quotes && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-primary/5 border border-primary/20 rounded-lg p-6"
                  >
                    <blockquote className="italic text-muted-foreground">
                      "{famousPerson.quotes}"
                    </blockquote>
                    <p className="text-right font-medium mt-2">— {famousPerson.name}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}