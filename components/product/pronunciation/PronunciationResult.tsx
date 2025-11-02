'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PronunciationResultProps {
  type: 'cn' | 'en';
  value: string;
  isLoading: boolean;
  result: ResultData | null;
}

interface ResultData {
  chinese: string;
  pinyin: string;
  chineseIpa: string;
  matchedWords: string[];
  englishPhonetic: string;
  pronunciationNote: string;
  translation?: string;
  example: {
    chinese: string;
    english: string;
  };
}

const PronunciationResult: React.FC<PronunciationResultProps> = ({ type, value, isLoading, result }) => {
  const { toast } = useToast();
  const [showExamples, setShowExamples] = useState<boolean>(false);

  // 重置示例展开状态当输入值改变时
  useEffect(() => {
    setShowExamples(false);
  }, [value]);

  const playChineseAudio = () => {
    // 使用浏览器的Web Speech API实现TTS功能
    if (result?.chinese && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(result.chinese);
      utterance.lang = "zh-CN"; // 设置为中文
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
        variant: "destructive",
      });
    }
  };

  const playEnglishAudio = (index = 0) => {
    // 使用浏览器的Web Speech API实现TTS功能
    if (result?.matchedWords && result.matchedWords[index] && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(result.matchedWords[index]);
      utterance.lang = "en-US"; // 设置为英语
      utterance.rate = 0.9; // 稍微放慢速度以便学习者听清楚

      // 播放前停止可能正在播放的语音
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      toast({
        title: "播放英文匹配",
        description: `正在播放"${result.matchedWords[index]}"的发音`,
      });
    } else {
      toast({
        title: "浏览器不支持",
        description: "您的浏览器不支持语音合成功能",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.section
      className="col-span-12 md:col-span-8 lg:col-span-9"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {!result && !isLoading ? (
        <motion.div 
          className="flex h-full items-center justify-center rounded-xl bg-muted/20 border-2 border-dashed border-border/50 p-8 hover:border-border transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center">
            <motion.span 
              className="text-6xl text-muted-foreground block mb-4"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              🔍
            </motion.span>
            <h2 className="text-xl font-bold text-foreground mb-2">
              结果将显示在这里
            </h2>
            <p className="text-muted-foreground">
              输入短语开始查询。
            </p>
          </div>
        </motion.div>
      ) : isLoading ? (
        <div className="flex h-full items-center justify-center rounded-xl bg-background p-8 shadow-md border border-border">
          <div className="text-center">
            <motion.div 
              className="inline-block rounded-full h-16 w-16 border-t-4 border-primary mx-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            ></motion.div>
            <h2 className="mt-6 text-xl font-bold text-foreground">
              正在分析发音...
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              我们正在为您查找最佳的发音匹配，请稍候...
            </p>
          </div>
        </div>
      ) : (
        <motion.div 
          className="rounded-xl bg-background p-6 md:p-8 shadow-lg border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-8">
            {/* 标题部分 - 优化中文发音展示 */}
            <motion.div 
              className="pb-5 border-b border-border/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex-1">
                {result.translation && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">原文</p>
                    <p className="text-xl text-foreground italic font-light">{result.translation}</p>
                  </div>
                )}
                <div className="flex items-center flex-wrap gap-4 mb-2">
                  <h1 className="text-4xl md:text-5xl font-chinese text-foreground">
                    {result.chinese}
                  </h1>
                  <motion.div
                    className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.2)' }}
                  >
                    {result.chineseIpa}
                  </motion.div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg text-muted-foreground font-medium">{result.pinyin}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  点击播放
                </p>
                <motion.button
                  className="flex items-center justify-center size-20 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                  onClick={playChineseAudio}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.span 
                    className="text-4xl"
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 15 }}
                  >
                    ▶️
                  </motion.span>
                </motion.button>
                <motion.p 
                  className="mt-2 text-xs text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  标准中文发音
                </motion.p>
              </div>
            </motion.div>

            {/* 发音匹配部分 - 优化显示 */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-primary rounded-full"></div>
                <h3 className="text-xl font-semibold text-foreground">相似发音 (Similar Pronunciations)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.matchedWords.map((words, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center justify-center bg-white dark:bg-background p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/30"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">英语近似</div>
                    <p className="text-2xl md:text-3xl font-bold text-primary mb-4 text-center">
                      "{words}"
                    </p>
                    <motion.button
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-full shadow-sm hover:bg-primary/90 active:scale-95 transition-all duration-200 text-sm font-medium"
                      onClick={() => playEnglishAudio(index)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      播放发音
                    </motion.button>
                  </motion.div>
                ))}
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">发音比较</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium text-foreground">
                        中文: <span className="font-mono text-primary">{result.chineseIpa}</span>
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        英语: <span className="font-mono text-primary">{result.englishPhonetic}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 解释文本 */}
            <motion.div
              className="bg-muted/20 p-5 rounded-lg border border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">发音指南</h4>
              <p className="text-muted-foreground text-base leading-relaxed">
                {result.pronunciationNote}
              </p>
            </motion.div>

            {/* 音频对比部分 - 优化交互体验 */}
            <motion.div 
              className="pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-12 bg-secondary rounded-full"></div>
                <h4 className="text-lg font-medium text-foreground">音频对比</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  className="flex flex-col items-center gap-3 bg-primary/5 p-5 rounded-lg border border-primary/20 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary text-xs px-2 py-1 rounded-bl-md">
                    中文
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-3">
                    标准中文发音
                  </p>
                  <motion.button
                    className="flex items-center justify-center size-16 bg-primary text-primary-foreground rounded-full shadow-md hover:shadow-lg hover:bg-primary/90 active:scale-95 transition-all duration-200"
                    onClick={playChineseAudio}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span 
                      className="text-4xl"
                      animate={{ rotate: 0 }}
                      whileHover={{ rotate: 15 }}
                    >
                      ▶️
                    </motion.span>
                  </motion.button>
                  <div className="waveform flex items-center h-10 gap-2 w-full max-w-xs justify-center">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-primary rounded-full"
                        initial={{ height: 4 }}
                        animate={{ 
                          height: ['4px', `${Math.random() * 20 + 10}px`, '4px'],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          delay: i * 0.1, 
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      ></motion.div>
                    ))}
                  </div>
                </motion.div>
                <motion.div 
                  className="flex flex-col items-center gap-3 bg-secondary/5 p-5 rounded-lg border border-secondary/20 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute top-0 right-0 bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-bl-md">
                    英文
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-3">
                    英文相似发音
                  </p>
                  <motion.button
                    className="flex items-center justify-center size-16 bg-secondary text-primary-foreground rounded-full shadow-md hover:shadow-lg hover:bg-secondary/90 active:scale-95 transition-all duration-200"
                    onClick={() => playEnglishAudio(0)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span 
                      className="text-4xl"
                      animate={{ rotate: 0 }}
                      whileHover={{ rotate: 15 }}
                    >
                      ▶️
                    </motion.span>
                  </motion.button>
                  <div className="waveform flex items-center h-10 gap-2 w-full max-w-xs justify-center">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-secondary rounded-full"
                        initial={{ height: 4 }}
                        animate={{ 
                          height: ['4px', `${Math.random() * 20 + 10}px`, '4px'],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          delay: i * 0.1, 
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                      ></motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* 例句部分 */}
            <motion.div 
              className="border border-border/50 rounded-lg overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <button
                className="flex w-full cursor-pointer items-center justify-between rounded-t-lg p-5 bg-muted hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                onClick={() => setShowExamples(!showExamples)}
              >
                <span className="text-base font-medium text-foreground">
                  例句
                </span>
                <motion.span
                  className="text-muted-foreground"
                  animate={{ rotate: showExamples ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.span>
              </button>

              {showExamples && (
                <motion.div
                  className="p-6 bg-background border-t border-border/50"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col gap-3">
                    <p className="font-chinese text-xl text-foreground">
                      {result.example.chinese}
                    </p>
                    <p className="text-muted-foreground">{result.pinyin}</p>
                    <div className="mt-2 p-4 bg-muted/20 rounded-lg">
                      <p className="text-muted-foreground italic text-lg">
                        "{result.example.english}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
};

export default PronunciationResult;