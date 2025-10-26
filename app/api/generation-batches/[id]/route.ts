import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Get specific batch with pagination by generation rounds
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: batchId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const round = parseInt(searchParams.get('round') || '1');

    console.log('Fetching batch details:', { batchId, round, userId: user.id });

    // First let's test if we can find ANY names for this batch (ignoring generation_round)
    const { data: allNames, error: allNamesError } = await supabase
      .from('generated_names')
      .select('*')
      .eq('batch_id', batchId)
      .limit(10);

    console.log('Debug - All names for batch (ignoring round):', {
      count: allNames?.length || 0,
      error: allNamesError?.message,
      sample: allNames?.[0]
    });

    // Parallel queries for better performance
    const [batchResult, namesResult, roundsResult] = await Promise.all([
      // Get batch info and verify ownership
      supabase
        .from('generation_batches')
        .select('*')
        .eq('id', batchId)
        .eq('user_id', user.id)
        .single(),

      // Get names - start with simple query, add generation_round if it works
      supabase
        .from('generated_names')
        .select('*')
        .eq('batch_id', batchId)
        .order('position_in_batch', { ascending: true }),

      // Get total number of rounds in this batch
      supabase
        .from('generated_names')
        .select('generation_round')
        .eq('batch_id', batchId)
        .order('generation_round', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    const { data: batch, error: batchError } = batchResult;
    const { data: names, error: namesError } = namesResult;
    const { data: roundsData, error: roundsError } = roundsResult;

    console.log('API Debug - Raw query results:', {
      batchId,
      round,
      batchFound: !!batch,
      batchError: batchError?.message,
      namesCount: names?.length || 0,
      namesError: namesError?.message,
      roundsData: roundsData?.generation_round,
      roundsError: roundsError?.message
    });

    if (batchError || !batch) {
      console.error('Batch not found:', batchError);
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (namesError) {
      console.error('Failed to fetch names:', namesError);
      return NextResponse.json({ error: 'Failed to fetch names' }, { status: 500 });
    }

    // Ensure totalRounds is always a valid positive integer
    const totalRounds = Math.max(1, roundsData?.generation_round || 1);

    // Validate round parameter
    const validRound = Math.max(1, Math.min(round, totalRounds));

    // If the requested round is invalid, redirect to valid round
    if (round !== validRound) {
      console.log(`Invalid round ${round}, redirecting to ${validRound}`);
    }

    // Transform data to match frontend expectations with validation
    console.log('API Debug - Raw names data sample:', names?.slice(0, 2));

    const transformedNames = (names || []).map((name, index) => {
      const transformed = {
        chinese: name.chinese_name || '',
        pinyin: name.pinyin || '',
        characters: name.characters || [],
        meaning: name.meaning || '',
        culturalNotes: name.cultural_notes || '',
        personalityMatch: name.personality_match || '',
        style: name.style || 'Standard'
      };

      if (index === 0) {
        console.log('API Debug - First name transformation:', {
          original: name,
          transformed
        });
      }

      return transformed;
    }).filter(name => name.chinese); // Filter out invalid names

    console.log('API Debug - Final transformed names count:', transformedNames.length);

    const batchInfo = {
      id: batch.id,
      englishName: batch.english_name,
      gender: batch.gender,
      birthYear: batch.birth_year,
      personalityTraits: batch.personality_traits,
      namePreferences: batch.name_preferences,
      planType: batch.plan_type,
      creditsUsed: batch.credits_used,
      totalNamesGenerated: batch.names_count,
      createdAt: batch.created_at,
      updatedAt: batch.updated_at
    };

    // Final validation before returning
    const safeResponse = {
      batch: batchInfo,
      names: transformedNames,
      pagination: {
        currentRound: validRound,
        totalRounds: Math.max(1, totalRounds),
        totalPages: Math.max(1, totalRounds),
        hasNextRound: validRound < totalRounds,
        hasPrevRound: validRound > 1
      }
    };

    // Add performance logging
    console.log(`API Response: batch=${batchId}, round=${validRound}/${totalRounds}, names=${transformedNames.length}`);

    return NextResponse.json(safeResponse);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}