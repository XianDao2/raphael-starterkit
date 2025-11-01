"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PronunciationGenerator from "@/components/product/pronunciation/pronunciation-generator";

export default function PronunciationPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-muted/20 to-background">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center space-y-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-primary/10 text-primary mb-4">
                <span className="mr-2">🎯</span>
                中文发音学习工具
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                用英文单词快速<br />
                <span className="text-primary">学习中文发音</span>
              </h1>

              <p className="mt-6 text-xl text-muted-foreground md:text-2xl max-w-3xl mx-auto">
                通过英语单词联想，轻松掌握中文发音。输入任何中文词语或短句，获取发音相似的英文单词。
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  onClick={() => {
                    const generatorSection = document.querySelector('[data-pronunciation-generator]');
                    if (generatorSection) {
                      generatorSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                >
                  开始学习发音
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium border border-border text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  返回首页
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  实时发音匹配
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  音频对比
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  例句学习
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content - Pronunciation Generator */}
      <section className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  发音学习工具
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  输入中文词语或短句，系统会自动找到发音相似的英文单词组合，帮助你快速掌握正确发音。
                </p>
              </div>

              <div id="pronunciation-generator" data-pronunciation-generator>
                {isClient && <PronunciationGenerator />}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl space-y-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                为什么选择我们的发音学习工具？
              </h2>
              <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
                独特的发音联想方法，让中文学习变得简单有趣，快速提高你的口语水平。
              </p>
            </motion.div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="rounded-2xl bg-background p-8 shadow-sm border border-border"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">🔤</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">发音联想</h3>
                  <p className="text-muted-foreground">
                    通过熟悉的英文单词，建立对中文发音的直观理解，提高记忆效率。
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="rounded-2xl bg-background p-8 shadow-sm border border-border"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">🔊</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">音频对比</h3>
                  <p className="text-muted-foreground">
                    直接对比中文原音和英文联想词的发音，帮助你掌握准确的语音语调。
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="rounded-2xl bg-background p-8 shadow-sm border border-border"
              >
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">例句学习</h3>
                  <p className="text-muted-foreground">
                    通过真实例句，了解词语在不同语境中的使用，全面提升语言能力。
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                如何使用发音学习工具？
              </h2>
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <motion.div 
                className="flex flex-col items-center p-6 rounded-xl bg-background shadow-sm border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                  <span className="text-xl">1️⃣</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">输入中文词语</h3>
                <p className="text-muted-foreground text-center">
                  在左侧输入框中输入你想学习发音的中文词语或短句
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 rounded-xl bg-background shadow-sm border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                  <span className="text-xl">2️⃣</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">点击搜索</h3>
                <p className="text-muted-foreground text-center">
                  点击蓝色按钮，获取发音相似的英文单词组合
                </p>
              </motion.div>
              
              <motion.div 
                className="flex flex-col items-center p-6 rounded-xl bg-background shadow-sm border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                  <span className="text-xl">3️⃣</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">听和练习</h3>
                <p className="text-muted-foreground text-center">
                  听音频，练习发音，并尝试例句，巩固记忆
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Back to top"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 15L12 9L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}