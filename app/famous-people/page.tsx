"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import OpenAI from "openai";
import { Search,
  RefreshCw,
  Info,
  User,
  Users,
  Calendar,
  Globe,
  BookOpen
} from "lucide-react";
import PronunciationResult from "@/components/product/pronunciation/PronunciationResult";
import { consumeCredits } from "@/utils/credits-utils";
import { recordSearchHistory } from "@/utils/search-history-utils";

interface FamousPerson {
  name: string; // 中文名
  nameEn: string; // 英文名
  pronunciation: string; // 带声调的拼音
  image: string; // 头像URL
  birthYear: string; // 出生年份
  birthPlace: string; // 出生地
  field: string; // 领域
  description: string; // 人物简介
  achievements: string[]; // 主要成就
  quotes?: string; // 名言
  chineseIpa?: string; // 中文IPA音标
  englishPhonetic?: string; // 英语近似音标
  matchedWords?: string[]; // 匹配的英语单词
  pronunciationNote?: string; // 发音关系说明
  example?: {
    chinese: string;
    english: string;
  }; // 例句
}

export default function FamousPeoplePage() {
  const [famousPerson, setFamousPerson] = useState<FamousPerson | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFamousPerson = async () => {
    setIsGenerating(true);
    try {
      // 1. 首先尝试扣除积分
      const creditsDeducted = await consumeCredits(5, 'famous_person_search');
      if (!creditsDeducted) {
        toast({
          title: "积分不足",
          description: "您的积分不足，无法继续搜索名人信息",
          variant: "destructive"
        });
        return;
      }
      
      // 2. 积分扣除成功后，生成名人信息
      const personInfo = await generatePersonInfo();

      // 3. 然后根据生成的信息创建头像提示词并生成头像
      const imagePrompt = `简笔画风格的${personInfo.field}家${personInfo.name}，线条简单清晰，黑白风格，适合识别，不要文字，人物形象突出，背景简洁`;
      const imageUrl = await generateAvatar(imagePrompt);

      // 4. 组合完整的名人信息
      const fullPersonInfo = {
        ...personInfo,
        image: imageUrl,
      };
      setFamousPerson(fullPersonInfo);

      // 5. 记录搜索历史
      await recordSearchHistory({
        search_type: 'famous_person_search',
        search_query: `随机生成名人 - ${personInfo.name}`,
        search_results: fullPersonInfo,
        metadata: {
          field: personInfo.field,
          birthYear: personInfo.birthYear,
          generationTime: new Date().toISOString()
        }
      });

      toast({
        title: "生成成功",
        description: `已扣除1积分，生成${personInfo.name}的信息`,
      });
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
      dangerouslyAllowBrowser: true,
    });

    const prompt = `
请随机生成一位中国或国际知名的历史人物、科学家、艺术家、政治人物、企业家等领域的名人信息。

对于名人的中文名，请按照以下步骤生成对应的拼音和发音信息，帮助英语母语者（初级中文学习者，只熟悉CEFR A1-B1级别的英语单词）将中文发音与熟悉的英语单词联系起来：
1. 准确标记中文发音的拼音（带声调）
2. 转换拼音为国际音标（IPA），包括声调符号
3. 转换IPA为英语近似音标（DJ音标），消除没有对应英语发音的特殊音，保留核心发音
4. 按音节拆分拼音，匹配发音相似度≥85%的英语常用词（A1-B1级别），返回恰好三个最匹配的单词组合
5. 简要解释英语单词与中文拼音之间的发音关系
6. 生成包含中文单词的简单例句（中文+英文翻译）

请输出以下格式的JSON：
{
  "name": "中文名",
  "nameEn": "英文名",
  "pronunciation": "带声调的拼音",
  "chineseIpa": "中文IPA音标",
  "englishPhonetic": "英语近似音标",
  "matchedWords": ["匹配的英语单词组1", "匹配的英语单词组2", "匹配的英语单词组3"],
  "pronunciationNote": "发音关系说明",
  "example": {
    "chinese": "包含中文名的中文例句",
    "english": "英文翻译"
  },
  "birthYear": "出生年份",
  "birthPlace": "出生地",
  "field": "领域（如科学家、艺术家等）",
  "description": "200字以内的人物简介，包括生平主要经历",
  "achievements": ["成就1", "成就2", "成就3"],
  "quotes": "一句名人名言（如果有）"
}

请确保信息准确，选择真实存在的历史人物或当代名人。
请直接返回JSON，不要添加其他说明文字。
例如{"name": "钱学森","nameEn": "Qian Xuesen","pronunciation": "Qián Xuésēn","chineseIpa": "/tɕʰjɛ̌n ɕɥɛ̌ sən/","englishPhonetic": "/tʃjɛn ʃweɪ sən/","matchedWords": ["Chee yen Shway sen", "Chien Shue sen", "Chyan Xue sen"],"pronunciationNote": "“Qián” 发音近似英语 “Chee”（奶酪 cheese 开头音）+“yen”（日元货币词），声调为第二声；“Xué” 近似 “Shway”（shoe+way 组合音），第二声；“sēn” 近似 “sen”（send 去掉尾音 d），第一声，均为 A1-B1 级别基础词汇组合。","example": {"chinese": "钱学森是中国著名的科学家。","english": "Qian Xuesen is a famous scientist in China."},"birthYear": "1911 年","birthPlace": "中国浙江省杭州市","field": "科学家（航空航天领域）","description": "1911 年生于杭州，曾留学美国获博士学位。1955 年回国，投身中国航天事业，是 “两弹一星” 功勋人物，被誉为 “中国航天之父”，2009 年逝世。","achievements": ["主导中国导弹、原子弹研制，奠定航天基础","创建中国第一个火箭、导弹研究机构","推动 “两弹一星” 工程成功，获国家最高科学技术奖"],"quotes": "外国人能搞的，难道中国人不能搞？"}
`;

    const response = await client.chat.completions.create({
      model: "THUDM/GLM-4.1V-9B-Thinking",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 1000,
      temperature: 0.8,
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
      dangerouslyAllowBrowser: true,
    });

    const response = await client.images.generate({
      model: "Kwai-Kolors/Kolors",
      prompt: prompt,
      negative_prompt: "复杂背景, 文字, 模糊, 彩色, 细节过多",
      image_size: "1024x1024",
      num_inference_steps: 20,
      guidance_scale: 7.5,
    });

    if (!response.data || !response.data[0]?.url) {
      throw new Error("无法生成头像");
    }

    return response.data[0].url;
  };

  // 组件加载时自动生成一位名人
  // useEffect(() => {
  //   generateFamousPerson();
  // }, []);

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
            className="max-w-6xl mx-auto"
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
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-6 bg-muted/70 rounded animate-pulse"
                        />
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
            className="max-w-6xl mx-auto"
          >
            <Card className="border-border overflow-hidden shadow-md">
              {/* 头部信息 */}
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <User className="h-6 w-6 text-primary" />
                  {famousPerson.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium">{famousPerson.nameEn}</span> •{" "}
                  {famousPerson.field}
                </p>
              </CardHeader>

              <CardContent className="pt-4">
                {/* 头像和发音信息并排布局 */}
                <div className="space-y-8">
                  {/* 个人基本信息区域 */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
                  >
                    {/* 左侧：头像和基本信息 */}
                    <div className="md:col-span-1 space-y-6">
                      {/* 头像区域 */}
                      <div className="flex flex-col items-center">
                        <div className="relative group">
                          <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg transition-all duration-300 group-hover:shadow-xl">
                            <img
                              src={famousPerson.image}
                              alt={famousPerson.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                            <User className="h-5 w-5" />
                          </div>
                        </div>
                        
                        {/* 基本信息卡片 */}
                        <div className="w-full bg-card rounded-xl p-4 border border-border shadow-sm">
                          <h3 className="text-md font-semibold mb-3 text-center text-primary">基本信息</h3>
                          
                          {/* 出生年份 */}
                          <div className="flex items-center gap-3 mb-3">
                            <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                出生年份
                              </p>
                              <p className="font-medium">
                                {famousPerson.birthYear}
                              </p>
                            </div>
                          </div>

                          {/* 出生地 */}
                          <div className="flex items-center gap-3">
                            <Globe className="h-5 w-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                出生地
                              </p>
                              <p className="font-medium">
                                {famousPerson.birthPlace}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 中间：人物简介 */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="md:col-span-1 bg-card rounded-xl p-5 border border-border shadow-sm"
                    >
                      <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-primary">
                        <BookOpen className="h-5 w-5" />
                        人物简介
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {famousPerson.description}
                      </p>
                    </motion.div>

                    {/* 右侧：主要成就 */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="md:col-span-1 bg-card rounded-xl p-5 border border-border shadow-sm"
                    >
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                        <Users className="h-5 w-5" />
                        主要成就
                      </h3>
                      <ul className="space-y-3">
                        {famousPerson.achievements.map((achievement, index) => (
                          <motion.li
                            key={index}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{
                              duration: 0.3,
                              delay: 0.4 + index * 0.1,
                            }}
                            className="flex items-start gap-3"
                          >
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-medium mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            <span className="text-muted-foreground leading-relaxed">
                              {achievement}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  </motion.div>

                  {/* 名人名言 - 居中强调展示 */}
                  {famousPerson.quotes && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: 0.5 }}
                      className="mt-6 mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/30 rounded-xl p-6 md:p-8 w-full shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-3 left-3 text-4xl text-primary/10 font-serif">
                        "
                      </div>
                      <blockquote className="italic text-muted-foreground text-base md:text-lg pl-6 relative z-10">
                        {famousPerson.quotes}
                      </blockquote>
                      <p className="text-right font-semibold text-primary mt-3 pr-4">
                        — {famousPerson.name}
                      </p>
                    </motion.div>
                  )}
                  
                  {/* 中文发音组件 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <PronunciationResult
                      type="cn"
                      value={famousPerson.name}
                      isLoading={false}
                      result={{
                        chinese: famousPerson.name,
                        pinyin: famousPerson.pronunciation,
                        chineseIpa:
                          famousPerson.chineseIpa ||
                          `/${famousPerson.pronunciation}/`,
                        englishPhonetic:
                          famousPerson.englishPhonetic ||
                          famousPerson.pronunciation,
                        matchedWords: famousPerson.matchedWords || [
                          famousPerson.nameEn.split(" ")[0] || "Example",
                        ],
                        pronunciationNote:
                          famousPerson.pronunciationNote ||
                          `这是${famousPerson.name}的标准中文发音。${famousPerson.field}家${famousPerson.name}出生于${famousPerson.birthYear}年。`,
                        example: famousPerson.example || {
                          chinese: `${famousPerson.name}是著名的${famousPerson.field}家。`,
                          english: `${famousPerson.nameEn} is a famous ${famousPerson.field}.`,
                        },
                      }}
                    />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
