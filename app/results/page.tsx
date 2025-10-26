"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

import NamesGrid from "@/components/product/results/names-grid";

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

interface SessionData {
  names: NameData[];
  formData: FormData | null;
  batch: any;
  generationRound: number;
  totalGenerationRounds: number;
  isHistoryMode: boolean;
}

export default function ResultsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { toast } = useToast();

  const [generatedNames, setGeneratedNames] = useState<NameData[]>([]);

  // Current batch state
  const [currentBatch, setCurrentBatch] = useState<any | null>(null);
  const [currentGenerationRound, setCurrentGenerationRound] = useState(1);
  const [totalGenerationRounds, setTotalGenerationRounds] = useState(1);

  // History browsing state (for different batches)
  const [isInHistoryMode, setIsInHistoryMode] = useState(false);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFormData, setCurrentFormData] = useState<FormData | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load data from sessionStorage on mount
  useEffect(() => {
    const loadSessionData = () => {
      try {
        const sessionDataStr = sessionStorage.getItem('nameGenerationResults');
        if (!sessionDataStr) {
          // No data found, redirect to home
          toast({
            title: "No data found",
            description: "Please generate names from the homepage first.",
            variant: "destructive",
          });
          router.replace('/');
          return;
        }

        const sessionData: SessionData = JSON.parse(sessionDataStr);

        // Restore state from sessionStorage
        setGeneratedNames(sessionData.names || []);
        setCurrentFormData(sessionData.formData || null);
        setCurrentBatch(sessionData.batch || null);
        setCurrentGenerationRound(sessionData.generationRound || 1);
        setTotalGenerationRounds(sessionData.totalGenerationRounds || 1);
        setIsInHistoryMode(sessionData.isHistoryMode || false);

        setIsDataLoaded(true);
      } catch (error) {
        console.error('Failed to load session data:', error);
        toast({
          title: "Data loading failed",
          description: "Unable to load generation results. Redirecting to homepage.",
          variant: "destructive",
        });
        router.replace('/');
      }
    };

    loadSessionData();
  }, [router, toast]);

  // Save current state to sessionStorage when data changes
  useEffect(() => {
    if (isDataLoaded && generatedNames.length > 0) {
      const sessionData: SessionData = {
        names: generatedNames,
        formData: currentFormData,
        batch: currentBatch,
        generationRound: currentGenerationRound,
        totalGenerationRounds,
        isHistoryMode: isInHistoryMode,
      };

      sessionStorage.setItem('nameGenerationResults', JSON.stringify(sessionData));
    }
  }, [generatedNames, currentFormData, currentBatch, currentGenerationRound, totalGenerationRounds, isInHistoryMode, isDataLoaded]);

  const handleRegenerate = async () => {
    if (!currentFormData) return;
    // Always force new batch when regenerating from button
    await handleGenerate(currentFormData, true);
  };

  const handleContinueGeneration = async () => {
    if (!currentFormData || !currentBatch) return;
    // Continue in same batch - parameters haven't changed
    await handleGenerate(currentFormData, false);
  };

  const handleGenerate = async (formData: FormData, forceNewBatch = false) => {
    setIsGenerating(true);

    // Determine if we need a new batch
    const needsNewBatch = forceNewBatch ||
      isInHistoryMode ||
      !currentBatch ||
      compareFormParameters(formData, currentFormData);

    // If creating new batch, update form data and exit history mode
    if (needsNewBatch) {
      setCurrentFormData(formData);
      setIsInHistoryMode(false);
    }

    try {
      const requestBody = {
        ...formData,
        continueBatch: !needsNewBatch,
        batchId: !needsNewBatch ? currentBatch?.id : undefined
      };

      const response = await fetch('/api/chinese-names/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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

      // Set current generated names
      setGeneratedNames(data.names);

      // Update batch and round information
      if (data.batch) {
        setCurrentBatch(data.batch);
        setCurrentGenerationRound(data.generationRound);

        // Calculate total rounds based on total names / 6 (names per round)
        const estimatedTotalRounds = data.isContinuation
          ? Math.ceil(data.batch.totalNamesGenerated / 6)
          : data.generationRound;

        setTotalGenerationRounds(estimatedTotalRounds);
      }

      toast({
        title: data.message || "Names generated successfully!",
        description: `Generated ${data.names.length} unique Chinese names${data.creditsUsed ? ` using ${data.creditsUsed} credits` : ' for free'}`,
      });
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

  const handleBackToForm = () => {
    // Clear session data when going back to form
    sessionStorage.removeItem('nameGenerationResults');
    router.push('/#name-generator-form');
  };

  // Compare form parameters to determine if new batch is needed
  const compareFormParameters = (newForm: FormData, oldForm: FormData | null): boolean => {
    if (!oldForm) return true; // First generation always creates new batch

    return (
      newForm.englishName !== oldForm.englishName ||
      newForm.gender !== oldForm.gender ||
      newForm.birthYear !== oldForm.birthYear ||
      newForm.personalityTraits !== oldForm.personalityTraits ||
      newForm.namePreferences !== oldForm.namePreferences ||
      newForm.planType !== oldForm.planType
    );
  };

  // Handle batch-internal round navigation (within same batch)
  const handleRoundChange = async (roundIndex: number) => {
    if (!user || !currentBatch || roundIndex < 1 || roundIndex > totalGenerationRounds) return;

    setIsLoadingHistory(true);

    try {
      const response = await fetch(`/api/generation-batches/${currentBatch.id}?round=${roundIndex}`);
      if (response.ok) {
        const data = await response.json();
        setGeneratedNames(data.names);
        setCurrentGenerationRound(roundIndex);
      }
    } catch (error) {
      console.error('Failed to load round:', error);
      toast({
        title: "Loading failed",
        description: "Failed to load historical round. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Show loading while data is being loaded
  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your generated names...</p>
        </div>
      </div>
    );
  }

  // Show error if no names (shouldn't happen due to redirect, but just in case)
  if (generatedNames.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-foreground">No Names Found</h1>
          <p className="text-muted-foreground">
            It looks like there are no generated names to display. Please return to the homepage to generate new names.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center h-12 px-6 font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your Generated Chinese Names
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {isInHistoryMode && currentBatch ? (
                  <>
                    Historical generation for "{currentBatch.englishName}" -
                    Created on {new Date(currentBatch.createdAt).toLocaleDateString()}
                  </>
                ) : (
                  <>
                    Choose your favorite name from the results below. Each name has been carefully crafted based on your preferences.
                  </>
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-8 bg-background">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-6xl">
            <NamesGrid
              names={generatedNames}
              onRegenerate={handleRegenerate}
              onBackToForm={handleBackToForm}
              isGenerating={isGenerating}
              // Batch-internal pagination props (for same batch, different rounds)
              currentPage={currentGenerationRound - 1} // Convert to 0-based index
              totalPages={totalGenerationRounds}
              onPageChange={(page) => handleRoundChange(page + 1)} // Convert back to 1-based
              isAuthenticated={!!user}
              isLoadingHistory={isLoadingHistory}
              // History browsing props  
              isHistoryView={isInHistoryMode}
              currentBatchInfo={currentBatch ? {
                englishName: currentBatch.englishName,
                gender: currentBatch.gender,
                planType: currentBatch.planType,
                createdAt: currentBatch.createdAt
              } : undefined}
              // New props for continue generation
              showContinueGeneration={!isInHistoryMode && !!currentBatch}
              onContinueGeneration={handleContinueGeneration}
            />
          </div>
        </div>
      </section>
    </div>
  );
}