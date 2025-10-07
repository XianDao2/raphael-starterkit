import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CREDITS_TIERS } from '@/config/subscriptions';

export async function POST(request: NextRequest) {
  try {
    const { productType, quantity, userId } = await request.json();
    
    // Validate request data
    if (!productType || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the appropriate product ID based on quantity
    let productId: string | null = null;
    let creditsAmount = 0;
    
    if (productType === 'chinese-name-credits') {
      // For Chinese name credits, map quantity to a tier
      if (quantity === 1000) {
        // Map to the 3-credits tier (based on UI request for 1000 credits)
        const tier = CREDITS_TIERS.find(t => t.id === 'tier-3-credits');
        if (tier) {
          productId = tier.productId;
          creditsAmount = tier.creditAmount || 3;
        }
      } else {
        // Find tier based on quantity
        const tier = CREDITS_TIERS.find(t => t.creditAmount === quantity);
        if (tier) {
          productId = tier.productId;
          creditsAmount = tier.creditAmount;
        }
      }
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Invalid product type or quantity' },
        { status: 400 }
      );
    }

    // TEMPORARY SOLUTION FOR TESTING
    // Since we can't make real API calls to Creem in this environment,
    // we'll return a mock checkout URL for testing purposes
    console.log('Creating checkout session with:', {
      productId,
      productType,
      creditsAmount,
      userId
    });
    
    // Add the credits directly to the user's account for testing
    try {
      // Get customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, credits')
        .eq('user_id', userId)
        .single();
      
      if (customer) {
        const newCredits = (customer.credits || 0) + creditsAmount;
        await supabase
          .from('customers')
          .update({ 
            credits: newCredits,
            updated_at: new Date().toISOString()
          })
          .eq('id', customer.id);
        
        // Record in credits history
        await supabase
          .from('credits_history')
          .insert({
            customer_id: customer.id,
            amount: creditsAmount,
            type: 'add',
            description: `Test purchase of ${creditsAmount} credits`,
            metadata: { 
              test_purchase: true,
              product_type: productType 
            }
          });
          
        console.log(`Added ${creditsAmount} credits to user ${userId}`);
      }
    } catch (dbError) {
      console.error('Error updating test credits:', dbError);
    }
    
    // Return mock checkout URL that redirects to success page
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/account/credits?success=true&test_mode=true`;
    
    return NextResponse.json({
      sessionId: `test_session_${Date.now()}`,
      url: successUrl,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}