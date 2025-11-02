"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Volume2, 
  FileText,
  Sparkles,
  BookOpen,
  Heart,
  Star
} from "lucide-react";

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

export default function NameDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  
  const [nameData, setNameData] = useState<NameData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // 从 URL 参数中获取名字数据
    const encodedData = searchParams.get('data');
    if (encodedData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(encodedData));
        setNameData(decodedData);
      } catch (error) {
        console.error('Failed to decode name data:', error);
        toast({
          title: "Data Error",
          description: "Unable to load name details. Please try again.",
          variant: "destructive",
        });
        router.push('/');
      }
    } else {
      toast({
        title: "No Data",
        description: "No name data provided. Returning to homepage.",
        variant: "destructive",
      });
      router.push('/');
    }
  }, [searchParams, router, toast]);

  const handlePlayAudio = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use voice playback.",
        variant: "destructive",
      });
      return;
    }

    if (!nameData?.chinese) {
      toast({
        title: "No text to play",
        description: "Unable to play audio for this name.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      toast({
        title: "Audio playing",
        description: "Please wait for current audio to finish.",
      });
      return;
    }

    setIsPlaying(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: nameData.chinese
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 503) {
          throw new Error(errorData.message || 'Voice playback service is temporarily unavailable');
        }
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const result = await response.json();
      
      if (result.success && result.audioData) {
        const audioBlob = new Blob(
          [Uint8Array.from(atob(result.audioData), c => c.charCodeAt(0))], 
          { type: 'audio/mpeg' }
        );
        
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
          toast({
            title: "Playback failed",
            description: "Unable to play the audio.",
            variant: "destructive",
          });
        };
        
        await audio.play();
        
        toast({
          title: "Playing audio",
          description: `Playing pronunciation of ${nameData.chinese}`,
        });
      } else {
        throw new Error('Invalid audio data received');
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      toast({
        title: "Playback failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to generate PDF certificate.",
        variant: "destructive",
      });
      return;
    }

    if (!nameData) {
      toast({
        title: "No data",
        description: "Unable to generate PDF without name data.",
        variant: "destructive",
      });
      return;
    }

    if (isGeneratingPDF) {
      return;
    }

    setIsGeneratingPDF(true);

    try {
      const userData = {
        englishName: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        gender: user.user_metadata?.gender || 'other'
      };

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nameData: nameData,
          userData: userData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          toast({
            title: "Insufficient credits",
            description: errorData.error || "You need 1 credit to generate PDF certificate.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${nameData.chinese}_certificate.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF generated successfully!",
        description: `Certificate for ${nameData.chinese} has been downloaded.`,
      });

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: "PDF generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!nameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/results')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>
            
            {user && (
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="gap-2"
              >
                {isGeneratingPDF ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Generate PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="space-y-4">
              <h1 className="font-serif text-6xl md:text-8xl text-primary font-bold tracking-wider">
                {nameData.chinese}
              </h1>
              <div className="flex items-center justify-center gap-4">
                <p className="text-2xl text-muted-foreground">{nameData.pinyin}</p>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePlayAudio}
                    disabled={isPlaying}
                    className="gap-2"
                  >
                    {isPlaying ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                    {isPlaying ? 'Playing...' : 'Listen'}
                  </Button>
                )}
              </div>
              <Badge variant="secondary" className="text-sm">
                {nameData.style}
              </Badge>
            </div>
          </motion.div>

          {/* Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name Meaning Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Name Meaning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {nameData.meaning}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Personality Match Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Why It Suits You
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {nameData.personalityMatch}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Character Analysis Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Character Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nameData.characters.map((char, index) => (
                    <motion.div
                      key={char.character}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="font-serif text-3xl text-primary w-12 h-12 flex items-center justify-center bg-background rounded-lg border border-border flex-shrink-0 shadow-sm">
                        {char.character}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="text-sm text-muted-foreground">{char.pinyin}</div>
                        <div className="font-medium text-foreground">{char.meaning}</div>
                        {char.explanation && (
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            {char.explanation}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cultural Context Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Cultural Context
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {nameData.culturalNotes}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}