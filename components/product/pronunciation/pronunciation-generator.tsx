"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import OpenAI from "openai";

interface PronunciationResult {
  chinese: string;
  pinyin: string;
  chineseIpa: string;
  englishPhonetic: string;
  matchedWords: string;
  pronunciationNote: string;
  example: {
    chinese: string;
    english: string;
  }
}

export default function PronunciationGenerator() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(false);
  
  // 添加CSS动画 - 仅在客户端执行
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes wave {
        0%, 100% { height: 4px; }
        50% { height: 24px; }
      }
      .animate-wave {
        animation: wave 1.2s linear infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // 清理
      document.head.removeChild(style);
    };
  }, []);

  // 加载最近查询
  React.useEffect(() => {
    const saved = localStorage.getItem('recentPronunciationQueries');
    if (saved) {
      setRecentQueries(JSON.parse(saved));
    }
  }, []);

  // 保存最近查询
  const saveRecentQuery = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5);
    setRecentQueries(updated);
    localStorage.setItem('recentPronunciationQueries', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!inputText.trim()) {
      toast({
        title: "输入不能为空",
        description: "请输入中文词语或短句",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // 使用OpenAI库调用大模型
      const client = new OpenAI({
        baseURL: process.env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1",
        apiKey: 
          process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "sk-tvcwevarnuxopipulvzsqilteuwbrivzihandabyzprbijhl",
        dangerouslyAllowBrowser: true
      });

      const prompt = `
 任务：帮英语母语者（中文零基础，仅熟悉 CEFR A1-B1 级英语常用词）通过英语熟词联想中文发音。 
 输入：中文词语 = ${inputText}，带声调拼音 = 需要你输出
 要求按以下步骤输出，格式严格遵循 JSON（无额外文字）： 
 1. 拼音转国际音标（IPA）：准确标注中文发音（含声调符号，如˨˩）； 
 2. IPA 转英语近似音标：映射为英语母语者熟悉的 DJ 音标，剔除英语无对应音的特殊音，保留核心发音； 
 3. 匹配英语熟词：按音节拆分拼音，匹配发音相似度≥85%的英语常用词（A1-B1级），多音节则拆分组合（如双音节→2个单词）； 
 4. 发音说明：简要说明英语单词与中文拼音的发音关联； 
 5. 简单例句：生成1个包含该中文词语的基础例句（中文+英语翻译）。 
 
 示例输出（必须严格遵循此格式）： 
 { 
   "chinese": "你好", 
   "pinyin": "nǐ hǎo", 
   "chineseIpa": "/ni˨˩ haʊ˨˩/", 
   "englishPhonetic": "/niː haʊ/", 
   "matchedWords": "need how", 
   "pronunciationNote": "need 发音对应 /niː/（匹配 nǐ 的核心音），how 发音对应 /haʊ/（完全匹配 hǎo 的发音）", 
   "example": { 
     "chinese": "你好，很高兴认识你。", 
     "english": "Hello, nice to meet you." 
   } 
 } 
 
 注意：禁止使用生僻词，单词组合无歧义，例句简洁易懂（适合零基础学习者）。 
 `;

      const response = await client.chat.completions.create({
        model: "THUDM/GLM-4.1V-9B-Thinking",
        messages: [
          { 
            role: "user", 
            content: prompt 
          }
        ],
        stream: false,
        max_tokens: 4096,
        temperature: 0.7
      });

      if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
        const apiResponse = response.choices[0].message.content.trim();
        
        // 解析JSON响应
        const parsedResult: PronunciationResult = JSON.parse(apiResponse);
        setResult(parsedResult);
        saveRecentQuery(inputText);
        
        toast({
          title: "发音匹配成功",
          description: `已找到"${inputText}"的英文发音匹配`,
        });
      } else {
        throw new Error("无效的API响应");
      }
    } catch (error) {
      console.error('搜索错误:', error);
      toast({
        title: "搜索失败",
        description: "无法获取发音匹配，请稍后再试。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentQueryClick = (query: string) => {
    setInputText(query);
    // 自动搜索
    setIsLoading(true);
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const playChineseAudio = () => {
    // 使用浏览器的Web Speech API实现TTS功能
    if (result?.chinese && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(result.chinese);
      utterance.lang = 'zh-CN'; // 设置为中文
      utterance.rate = 0.9; // 稍微放慢速度以便学习者听清楚
      
      // 播放前停止可能正在播放的语音
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      
      toast({
        title: "播放中文发音",
        description: `正在播放"${result.chinese}"的标准发音`,
      });
    } else {
      toast({
        title: "浏览器不支持",
        description: "您的浏览器不支持语音合成功能",
        variant: "destructive"
      });
    }
  };

  const playEnglishAudio = () => {
    // 使用浏览器的Web Speech API实现TTS功能
    if (result?.matchedWords && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(result.matchedWords);
      utterance.lang = 'en-US'; // 设置为英语
      utterance.rate = 0.9; // 稍微放慢速度以便学习者听清楚
      
      // 播放前停止可能正在播放的语音
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      
      toast({
        title: "播放英文匹配",
        description: `正在播放"${result.matchedWords}"的发音`,
      });
    } else {
      toast({
        title: "浏览器不支持",
        description: "您的浏览器不支持语音合成功能",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
      {/* 左侧输入区域 */}
      <motion.aside 
        className="col-span-12 md:col-span-4 lg:col-span-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sticky top-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-xl bg-background p-4 shadow-sm border border-border">
            <h2 className="text-2xl font-bold text-foreground">学习中文发音</h2>
            <p className="text-muted-foreground text-sm">
              输入中文词语或短句，找到发音相似的英文单词。
            </p>
          </div>
          
          <div className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-sm border border-border">
            <label className="flex flex-col w-full">
              <p className="text-sm font-medium text-foreground pb-2">中文词语或短句</p>
              <textarea 
                className="form-input min-h-32 resize-none rounded-lg text-foreground border border-input bg-background p-3"
                placeholder="输入中文词语/短句，如'你好'"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </label>
            
            <button 
              className={`flex w-full h-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'}`}
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? '搜索中...' : '搜索'}
            </button>
          </div>
          
          <div className="flex flex-col rounded-xl bg-background p-4 shadow-sm border border-border">
            <h3 className="text-lg font-bold text-foreground pb-3">最近查询</h3>
            {recentQueries.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {recentQueries.map((query, index) => (
                  <li key={index}>
                    <button 
                      className="block w-full text-left rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      onClick={() => handleRecentQueryClick(query)}
                    >
                      {query}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground p-2">暂无最近查询</p>
            )}
          </div>
        </div>
      </motion.aside>
      
      {/* 右侧结果区域 */}
      <motion.section 
        className="col-span-12 md:col-span-8 lg:col-span-9"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {!result && !isLoading ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-muted/20 border-2 border-dashed border-border p-8">
            <div className="text-center">
              <span className="text-6xl text-muted-foreground">🔍</span>
              <h2 className="mt-4 text-xl font-bold text-foreground">结果将显示在这里</h2>
              <p className="mt-2 text-muted-foreground">在左侧输入短语开始查询。</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex h-full items-center justify-center rounded-xl bg-background p-8 shadow-sm border border-border">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <h2 className="mt-4 text-xl font-bold text-foreground">正在分析发音...</h2>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-background p-6 shadow-sm border border-border">
            <div className="flex flex-col gap-6">
              {/* 标题部分 */}
              <div className="pb-4 border-b border-border">
                <h1 className="text-4xl font-chinese text-foreground">{result.chinese}</h1>
                <p className="text-lg text-muted-foreground">
                  {result.pinyin}
                </p>
              </div>
              
              {/* 发音匹配部分 */}
              <motion.div 
                className="flex flex-col items-center justify-center bg-primary/10 p-6 rounded-lg"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <p className="text-5xl font-bold text-primary">"{result.matchedWords}"</p>
                <p className="text-sm text-muted-foreground mt-2">
                  中文发音: {result.chineseIpa} | 英语近似音: {result.englishPhonetic}
                </p>
              </motion.div>
              
              {/* 解释文本 */}
              <div>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {result.pronunciationNote}
                </p>
              </div>
              
              {/* 音频比较部分 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm font-medium text-muted-foreground">中文发音</p>
                  <button 
                    className="flex items-center justify-center size-16 bg-secondary text-primary-foreground rounded-full shadow-md hover:bg-secondary/90 transition-colors"
                    onClick={playChineseAudio}
                  >
                    <span className="text-4xl">▶️</span>
                  </button>
                  <div className="waveform flex items-center h-8 gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-secondary rounded-full animate-wave"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm font-medium text-muted-foreground">英文匹配</p>
                  <button 
                    className="flex items-center justify-center size-16 bg-secondary text-primary-foreground rounded-full shadow-md hover:bg-secondary/90 transition-colors"
                    onClick={playEnglishAudio}
                  >
                    <span className="text-4xl">▶️</span>
                  </button>
                  <div className="h-8"></div>
                </div>
              </div>
              
              {/* 例句部分 */}
              <details className="group">
                <summary 
                  className="flex cursor-pointer list-none items-center justify-between rounded-lg p-4 bg-muted hover:bg-muted/80 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowExamples(!showExamples);
                  }}
                >
                  <span className="text-base font-medium text-foreground">例句</span>
                  <span className={`transition-transform duration-300 ${showExamples ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </summary>
                
                {showExamples && (
                  <motion.div 
                    className="mt-4 space-y-4 px-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="pb-4">
                      <p className="font-chinese text-lg text-foreground">{result.example.chinese}</p>
                      <p className="text-muted-foreground">{result.pinyin}</p>
                      <p className="text-muted-foreground italic">"{result.example.english}"</p>
                    </div>
                  </motion.div>
                )}
              </details>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}