"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import PronunciationResult from './PronunciationResult';
import OpenAI from "openai";

interface PronunciationResult {
  chinese: string;
  pinyin: string;
  chineseIpa: string;
  englishPhonetic: string;
  matchedWords: string[];
  pronunciationNote: string;
  example: {
    chinese: string;
    english: string;
  };
  translation?: string; // 用于英文输入模式的中文翻译
}

export default function PronunciationGenerator() {
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showExamples, setShowExamples] = useState(false);
  const [isChineseToEnglish, setIsChineseToEnglish] = useState(true); // 默认中文到英文模式

  // 添加CSS动画 - 仅在客户端执行
  useEffect(() => {
    const style = document.createElement("style");
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
    const saved = localStorage.getItem("recentPronunciationQueries");
    if (saved) {
      setRecentQueries(JSON.parse(saved));
    }
  }, []);

  // 保存最近查询
  const saveRecentQuery = (query: string) => {
    if (!query.trim()) return;

    const updated = [query, ...recentQueries.filter((q) => q !== query)].slice(
      0,
      5
    );
    setRecentQueries(updated);
    localStorage.setItem("recentPronunciationQueries", JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!inputText.trim()) {
      toast({
        title: "输入不能为空",
        description: isChineseToEnglish ? "请输入中文词语或短句" : "请输入英文词语或句子",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 使用OpenAI库调用大模型
      const client = new OpenAI({
        baseURL: process.env.OPENAI_BASE_URL || "https://api.siliconflow.cn/v1",
        apiKey:
          process.env.OPENROUTER_API_KEY ||
          process.env.OPENAI_API_KEY ||
          "sk-tvcwevarnuxopipulvzsqilteuwbrivzihandabyzprbijhl",
        dangerouslyAllowBrowser: true,
      });

      let prompt = "";
      if (isChineseToEnglish) {
        // 中文到英文模式
        prompt = `
Task: Help English native speakers (beginner Chinese learners, only familiar with CEFR A1-B1 level English words) associate Chinese pronunciation with familiar English words.
Input: Chinese word = ${inputText}, Pinyin with tone marks = to be output
Please follow these steps and output in strict JSON format (no extra text):
1. Convert Pinyin to International Phonetic Alphabet (IPA): Accurately mark Chinese pronunciation (including tone symbols, such as ˨˩);
2. Convert IPA to English approximate phonetics: Map to DJ phonetics familiar to English native speakers, eliminating special sounds without corresponding English sounds, preserving core pronunciation;
3. Match English familiar words: Split Pinyin by syllables, match English common words (A1-B1 level) with pronunciation similarity ≥85%, return an array of exactly three most matching words or word combinations;
4. Pronunciation note: Briefly explain the pronunciation relationship between English words and Chinese Pinyin;
5. Simple example sentence: Generate 1 basic example sentence containing the Chinese word (Chinese + English translation).

Example output (must strictly follow this format):
{
  "chinese": "你好",
  "pinyin": "nǐ hǎo",
  "chineseIpa": "/ni˨˩ haʊ˨˩/",
  "englishPhonetic": "/niː haʊ/",
  "matchedWords": ["need how", "knee cow", "neat house"],
  "pronunciationNote": "need/how sounds closest, knee/cow and neat/house can also be used as auxiliary memory",
  "example": {
    "chinese": "你好，很高兴认识你。",
    "english": "Hello, nice to meet you."
  }
}

Note: Avoid using rare words, ensure word combinations have no ambiguity, and make example sentences concise and easy to understand (suitable for beginner learners).
 `;
      } else {
        // 英文到中文模式
        prompt = `
Task: Translate English text to Chinese and help English native speakers associate Chinese pronunciation with familiar English words.
Input: English text = ${inputText}
Please follow these steps and output in strict JSON format (no extra text):
1. Translate the English text to natural Chinese:
2. Get Pinyin with tone marks for the translated Chinese;
3. Convert Pinyin to International Phonetic Alphabet (IPA): Accurately mark Chinese pronunciation (including tone symbols, such as ˨˩);
4. Convert IPA to English approximate phonetics: Map to DJ phonetics familiar to English native speakers, eliminating special sounds without corresponding English sounds, preserving core pronunciation;
5. Match English familiar words: Split Pinyin by syllables, match English common words (A1-B1 level) with pronunciation similarity ≥85%, return an array of exactly three most matching words or word combinations;
6. Pronunciation note: Briefly explain the pronunciation relationship between English words and Chinese Pinyin;
7. Simple example sentence: Generate 1 basic example sentence containing the Chinese translation (Chinese + English translation).

Example output (must strictly follow this format):
{
  "translation": "what is your name",
  "chinese": "你的名字是什么",
  "pinyin": "nǐ de míng zì shì shén me",
  "chineseIpa": "/ni˨˩ dɤ˧˥ miŋ˧˥ tsɨ˥˩ ʂɨ˥˩ ʂən˧˥ mə˧˥/",
  "englishPhonetic": "/niː də mɪŋ tsi ʃɪ ʃən mə/",
  "matchedWords": ["knee duck ming tea sheen ma", "need duh mean see shin mo", "neat do meen key shen muh"],
  "pronunciationNote": "Break down into syllables: ni (knee), de (duh), ming (mean), zi (tea), shi (sheen), shen (shin), me (ma)",
  "example": {
    "chinese": "请问，你的名字是什么？",
    "english": "Excuse me, what is your name?"
  }
}

Note: For longer sentences, focus on the core words for pronunciation matching. Keep translations natural and example sentences concise.
 `;
      }

      const response = await client.chat.completions.create({
        model: "THUDM/GLM-4.1V-9B-Thinking",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
      });

      if (
        response.choices &&
        response.choices[0] &&
        response.choices[0].message &&
        response.choices[0].message.content
      ) {
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
      console.error("搜索错误:", error);
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
    if (e.key === "Enter") {
      handleSearch();
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
            <h2 className="text-2xl font-bold text-foreground">{isChineseToEnglish ? '学习中文发音' : '英文翻译与发音学习'}</h2>
            <p className="text-muted-foreground text-sm">
              {isChineseToEnglish ? '输入中文词语或短句，找到发音相似的英文单词。' : '输入英文词语或句子，获取中文翻译并学习发音。'}
            </p>
            
            {/* 模式切换按钮 */}
            <button
              className="mt-2 px-4 py-2 bg-secondary text-primary-foreground rounded-full shadow-sm hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
              onClick={() => setIsChineseToEnglish(!isChineseToEnglish)}
            >
              <span>{isChineseToEnglish ? '切换到英文→中文' : '切换到中文→英文'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-sm border border-border">
            <label className="flex flex-col w-full">
              <p className="text-sm font-medium text-foreground pb-2">
                {isChineseToEnglish ? '中文词语或短句' : '英文词语或句子'}
              </p>
              <textarea
                className="form-input min-h-32 resize-none rounded-lg text-foreground border border-input bg-background p-3"
                placeholder={isChineseToEnglish ? "输入中文词语/短句，如'你好'" : "输入英文词语/句子，如'what is your name'"}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </label>

            <button
              className={`flex w-full h-12 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-primary/90"}`}
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? "搜索中..." : "搜索"}
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

      {/* 右侧结果区域 - 使用新封装的组件 */}
      <PronunciationResult 
        type={isChineseToEnglish ? 'cn' : 'en'} 
        value={inputText} 
        isLoading={isLoading} 
        result={result} 
      />
    </div>
  );
}
