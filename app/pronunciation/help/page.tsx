"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function PronunciationHelpPage() {
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="flex flex-1 justify-center py-10 sm:py-16 px-4">
        <div className="flex w-full max-w-[960px] flex-col gap-8">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex min-w-72 flex-col gap-2 text-center w-full">
              <motion.h1 
                className="text-4xl font-bold leading-tight tracking-[-0.033em] text-foreground"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                如何用英语单词快速学中文发音？
              </motion.h1>
              <motion.p 
                className="text-base font-normal leading-normal text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                How to learn Chinese pronunciation with English words?
              </motion.p>
            </div>
          </div>

          {/* Text Grid - How It Works */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-background p-6 shadow-sm">
              <div className="text-primary">
                <span className="text-3xl">⌨️</span>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold leading-tight text-foreground">1. 输入：输入中文词语</h2>
                <p className="text-sm font-normal leading-normal text-muted-foreground">例如："谢谢"</p>
              </div>
            </div>
            
            <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-background p-6 shadow-sm">
              <div className="text-primary">
                <span className="text-3xl">🔍</span>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold leading-tight text-foreground">2. 搜索：点击生成结果</h2>
                <p className="text-sm font-normal leading-normal text-muted-foreground">点击蓝色按钮获取发音匹配结果</p>
              </div>
            </div>
            
            <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-background p-6 shadow-sm">
              <div className="text-primary">
                <span className="text-3xl">🔊</span>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold leading-tight text-foreground">3. 学习：聆听并联想</h2>
                <p className="text-sm font-normal leading-normal text-muted-foreground">将"你好"与"need how"发音联系起来</p>
              </div>
            </div>
          </motion.div>

          {/* Tips Section */}
          <motion.div 
            className="flex items-center gap-4 rounded-xl bg-primary/10 px-6 py-4 mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex shrink-0 items-center justify-center text-primary">
              <span className="text-2xl">💡</span>
            </div>
            <p className="flex-1 truncate text-base font-normal leading-normal text-foreground">
              提示：支持单个汉字（如"水"）、词语（如"谢谢"）和短句（如"我饿了"）。
            </p>
          </motion.div>

          {/* Features Section */}
          <motion.div 
            className="mt-8 p-6 rounded-xl border border-border bg-background shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">发音学习的原理</h2>
            
            <div className="space-y-6">
              <div className="bg-muted/30 p-5 rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-3">联想记忆法</h3>
                <p className="text-muted-foreground">
                  联想记忆法是一种强大的记忆技巧，通过将新信息与已知信息建立联系，大大提高记忆效率。我们的工具利用英语单词的发音与中文词语发音的相似性，帮助你快速建立记忆连接。
                </p>
              </div>
              
              <div className="bg-muted/30 p-5 rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-3">语音对比学习</h3>
                <p className="text-muted-foreground">
                  通过直接对比中文原音和英文联想词的发音，你可以更清晰地理解中文的语音特点，特别是声调的变化。这种对比学习方法能够帮助你更快地掌握正确的发音技巧。
                </p>
              </div>
              
              <div className="bg-muted/30 p-5 rounded-lg">
                <h3 className="text-xl font-bold text-foreground mb-3">例句练习</h3>
                <p className="text-muted-foreground">
                  提供的例句不仅帮助你理解词语的含义，还能让你了解词语在实际语境中的用法和发音变化。通过例句练习，你可以更全面地掌握中文发音和表达。
                </p>
              </div>
            </div>
          </motion.div>

          {/* Examples Section */}
          <motion.div 
            className="mt-8 p-6 rounded-xl border border-border bg-background shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">常见发音匹配示例</h2>
            
            <div className="space-y-4">
              <div className="border-b border-border pb-4">
                <p className="text-xl font-bold text-foreground">你好 (nǐ hǎo) → "need how"</p>
                <p className="text-muted-foreground">
                  "nǐ" 的发音类似于 "need" 的前半部分，"hǎo" 的发音类似于 "how"。注意中文的声调变化。
                </p>
              </div>
              
              <div className="border-b border-border pb-4">
                <p className="text-xl font-bold text-foreground">谢谢 (xiè xiè) → "sheh sheh"</p>
                <p className="text-muted-foreground">
                  "xiè" 的发音可以通过 "sheh" 来联想，注意 "x" 在中文中的发音更接近英文 "she" 的 "sh"。
                </p>
              </div>
              
              <div className="border-b border-border pb-4">
                <p className="text-xl font-bold text-foreground">再见 (zài jiàn) → "zigh jen"</p>
                <p className="text-muted-foreground">
                  "zài" 可以联想为 "zigh"，"jiàn" 可以联想为 "jen"。注意 "zh" 和 "j" 的发音区别。
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div 
            className="flex justify-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <button
              onClick={() => router.push('/pronunciation')}
              className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
            >
              开始发音学习
            </button>
          </motion.div>
        </div>
      </main>

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