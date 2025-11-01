"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

import NameGeneratorForm from "@/components/product/generator/name-generator-form";
import ChineseNamePricing from "@/components/product/pricing/chinese-name-pricing";
import PopularNames from "@/components/product/popular/popular-names";
import { saveFormData, loadFormData } from "@/utils/form-storage";

interface NameData {
  chinese: string;
  pinyin: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  meaning: string;
  culturalNotes: string;
  personalityMatch: string;
  style: string;
}

interface FormData {
  englishName: string;
  gender: 'male' | 'female' | 'other';
  birthYear?: string;
  personalityTraits?: string;
  namePreferences?: string;
  planType: '1' | '4';
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasTriedFree, setHasTriedFree] = useState(false);

  // Check localStorage for previous free trial usage
  useEffect(() => {
    if (!loading) {
      if (!user) {
        const hasUsedFree = localStorage.getItem('hasTriedFreeGeneration') === 'true';
        setHasTriedFree(hasUsedFree);
      } else {
        // Clear localStorage flag for authenticated users
        localStorage.removeItem('hasTriedFreeGeneration');
        setHasTriedFree(false);
      }
    }
  }, [user, loading]);

  // Load saved form data
  const [savedFormData, setSavedFormData] = useState<any>(null);
  useEffect(() => {
    const loadedData = loadFormData();
    if (loadedData) {
      setSavedFormData(loadedData);
    }
  }, []);


  const handleGenerate = async (formData: FormData) => {
    // Check if it's a free trial attempt
    if (!user && hasTriedFree) {
      toast({
        title: "Free trial used",
        description: "You've already used your free generation. Please sign in for unlimited access!",
      });
      router.push('/sign-in');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/chinese-names/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specifically
        if (response.status === 429 && data.rateLimited) {
          toast({
            title: "Daily limit reached",
            description: data.error || "You can generate 3 free names per day. Please sign in for unlimited access!",
          });
          // Show sign-in option
          setTimeout(() => {
            router.push('/sign-in');
          }, 3000);
          return;
        }
        throw new Error(data.error || 'Failed to generate names');
      }

      // Calculate total rounds based on generation round
      const estimatedTotalRounds = data.isContinuation
        ? Math.ceil(data.batch.totalNamesGenerated / 6)
        : data.generationRound;

      // Save results to sessionStorage and redirect to results page
      const sessionData = {
        names: data.names,
        formData: formData,
        batch: data.batch,
        generationRound: data.generationRound,
        totalGenerationRounds: estimatedTotalRounds,
        isHistoryMode: false,
      };

      sessionStorage.setItem('nameGenerationResults', JSON.stringify(sessionData));

      // Mark free trial as used for non-authenticated users
      if (!user) {
        setHasTriedFree(true);
        localStorage.setItem('hasTriedFreeGeneration', 'true');
      }

      // Save form data to localStorage for future use
      saveFormData({
        englishName: formData.englishName,
        gender: formData.gender,
        birthYear: formData.birthYear,
        personalityTraits: formData.personalityTraits,
        namePreferences: formData.namePreferences
      });

      toast({
        title: data.message || "Names generated successfully!",
        description: `Generated ${data.names.length} unique Chinese names${data.creditsUsed ? ` using ${data.creditsUsed} credits` : ' for free'}`,
      });

      // Navigate to results page
      router.push('/results');
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      console.error('Detailed error:', errorMessage);
      toast({
        title: "Generation failed",
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };



  const scrollToForm = () => {
    const formSection = document.querySelector('[data-name-generator-form]');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
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
                <span className="mr-2">🇨🇳</span>
                AI-Powered Chinese Name Generation
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Discover Your Perfect
                <br />
                <span className="text-primary">Chinese Name</span>
              </h1>

              <p className="mt-6 text-xl text-muted-foreground md:text-2xl max-w-3xl mx-auto">
                Create your authentic Chinese identity with our advanced AI that understands cultural significance, personal meaning, and traditional naming conventions.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                >
                  {loading ? 'Loading...' : !user ? (hasTriedFree ? '🔒 Sign In for More' : '🎁 Generate Free Name') : '🎯 Generate Name'}
                </button>
                <button
                  onClick={() => {
                    router.push('/product/random-generator');
                  }}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium border border-border text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  Random Name Generator
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
                  {loading ? 'Loading...' : !user ? '3 free names daily' : 'Unlimited generation'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Instant generation
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  Cultural accuracy
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
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
                  Create Your Chinese Name
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Tell us about yourself and let our AI create a meaningful Chinese name that reflects your personality and cultural significance.
                </p>
              </div>

              <div id="name-generator-form" data-name-generator-form>
                <NameGeneratorForm
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  hasTriedFree={hasTriedFree}
                  savedFormData={savedFormData}
                />

                {/* Personal Center Button for authenticated users */}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="text-center mt-6"
                  >
                    <button
                      onClick={() => router.push('/profile')}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors border border-primary/20 hover:border-primary/40 rounded-lg"
                    >
                      👤 Profile - View History & Saved Names
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Popular Names Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20" data-popular-names>
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <PopularNames onScrollToGenerator={scrollToForm} />
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
                Why Choose Our Chinese Name Generator?
              </h2>
              <p className="mx-auto max-w-3xl text-muted-foreground text-lg">
                Advanced AI technology combined with deep cultural understanding to create meaningful Chinese names that truly represent you.
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
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">AI-Powered Intelligence</h3>
                  <p className="text-muted-foreground">
                    Our advanced AI understands your personality traits, preferences, and cultural nuances to create names that truly represent you.
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
                    <span className="text-2xl">🏮</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Cultural Authenticity</h3>
                  <p className="text-muted-foreground">
                    Each name is crafted with deep understanding of Chinese naming traditions, character meanings, and cultural significance.
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
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Instant Generation</h3>
                  <p className="text-muted-foreground">
                    Get your personalized Chinese name in seconds, complete with detailed meanings, pronunciation guides, and cultural context.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pronunciation Feature Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-primary/10 rounded-3xl p-8 md:p-12 overflow-hidden relative"
            >
              <div className="absolute -right-20 -bottom-20 opacity-10">
                <span className="text-[300px]">🔤</span>
              </div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-primary text-primary-foreground mb-2">
                    <span className="mr-2">🎯</span>
                    新功能
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                    中文发音学习工具
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    用英语单词快速掌握中文发音！输入任何中文词语或短句，获取发音相似的英文单词组合，帮助你轻松记忆。
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span className="text-muted-foreground">发音联想记忆</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span className="text-muted-foreground">音频对比学习</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span className="text-muted-foreground">例句练习</span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push('/pronunciation')}
                    className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg mt-4"
                  >
                    开始学习发音
                  </motion.button>
                </div>
                
                <div className="bg-background rounded-2xl p-6 shadow-lg border border-border">
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-foreground mb-2">发音示例</h3>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-bold text-foreground">你好</p>
                          <p className="text-muted-foreground">nǐ hǎo</p>
                        </div>
                        <div className="text-primary font-bold text-xl">"need how"</div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-bold text-foreground">谢谢</p>
                          <p className="text-muted-foreground">xiè xiè</p>
                        </div>
                        <div className="text-primary font-bold text-xl">"sheh sheh"</div>
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xl font-bold text-foreground">再见</p>
                          <p className="text-muted-foreground">zài jiàn</p>
                        </div>
                        <div className="text-primary font-bold text-xl">"zigh jen"</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-muted/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-5xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pricing</h2>
            <p className="text-muted-foreground">查看 Premium 与 Ultimate 订阅，解锁更快更高清的生成体验。</p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/pricing")}
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                查看定价与升级
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="space-y-6"
            >
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Start Your Cultural Journey Today
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                Discover the perfect Chinese name that represents your identity, personality, and cultural connection.
                <br />
                Join thousands who have found their authentic Chinese identity.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors shadow-lg"
                >
                  {loading ? 'Loading...' : !user ? (hasTriedFree ? '🔒 Sign In for Unlimited Names' : '🎁 Get Your Free Chinese Name') : '🎯 Generate Chinese Name'}
                </button>
                <a
                  href="#chinese-name-pricing"
                  className="inline-flex items-center justify-center h-14 px-8 text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Premium Features →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
