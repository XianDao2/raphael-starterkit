"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PronunciationResult {
  chinese: string;
  pinyin: string;
  englishMatch: string;
  explanation: string;
  examples: Array<{
    chinese: string;
    pinyin: string;
    english: string;
  }>;
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
      // 模拟API调用
      // 实际项目中应该替换为真实的API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟返回数据
      const mockResult: PronunciationResult = {
        chinese: inputText,
        pinyin: "nǐ hǎo" + (inputText.length > 2 ? "..." : ""),
        englishMatch: "need how",
        explanation: "简要解释发音细微差别以及英文单词如何创造相似的发音。重点关注'nǐ'的降升调和'hǎo'的降升调。",
        examples: [
          {
            chinese: "你好，很高兴认识你。",
            pinyin: "Nǐ hǎo, hěn gāoxìng rènshi nǐ.",
            english: "Hello, very happy to meet you."
          },
          {
            chinese: "你好吗？",
            pinyin: "Nǐ hǎo ma?",
            english: "How are you?"
          }
        ]
      };

      setResult(mockResult);
      saveRecentQuery(inputText);
      
      toast({
        title: "发音匹配成功",
        description: `已找到"${inputText}"的英文发音匹配`,
      });
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
    // 这里应该集成真实的音频播放功能
    toast({
      title: "播放中文发音",
      description: `播放"${result?.chinese}"的标准发音`,
    });
  };

  const playEnglishAudio = () => {
    // 这里应该集成真实的音频播放功能
    toast({
      title: "播放英文匹配",
      description: `播放"${result?.englishMatch}"的发音`,
    });
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
                <p className="text-5xl font-bold text-primary">"{result.englishMatch}"</p>
              </motion.div>
              
              {/* 解释文本 */}
              <div>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {result.explanation}
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
                    {result.examples.map((example, index) => (
                      <div key={index} className="pb-4 border-b border-border last:border-b-0">
                        <p className="font-chinese text-lg text-foreground">{example.chinese}</p>
                        <p className="text-muted-foreground">{example.pinyin}</p>
                        <p className="text-muted-foreground italic">"{example.english}"</p>
                      </div>
                    ))}
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