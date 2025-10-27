import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ACTIVE_STATUSES } from "@/types/subscriptions";
import { SUBSCRIPTION_TIERS } from "@/config/subscriptions";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get customer data including subscription
  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select(
      `
      *, 
      subscriptions (
        status,
        current_period_end,
        creem_product_id
      )
    `
    )
    .eq("user_id", user.id)
    .single();

  if (customerError || !customerData) {
    return NextResponse.json({ error: "Customer data not found" }, { status: 404 });
  }

  const subscription = customerData.subscriptions?.[0];
  
  // Check if user has Premium subscription
  const isActiveSubscription = subscription && ACTIVE_STATUSES.includes(subscription.status as any);
  const isPremium = isActiveSubscription && 
    (subscription.creem_product_id === "prod_5Kqq7BxbLyxmO1sM0Pc5LY" || 
     SUBSCRIPTION_TIERS.find(tier => tier.productId === subscription.creem_product_id)?.name === "Premium");

  if (!isPremium) {
    return NextResponse.json({ error: "Premium subscription required" }, { status: 403 });
  }

  // Parse request body
  const { style, description, ...otherParams } = await req.json();

  if (!style || !description) {
    return NextResponse.json({ error: "Style and description are required" }, { status: 400 });
  }

  try {
    // TODO: Implement actual avatar generation logic here
    // This is a placeholder - in a real implementation, you would call an AI image generation API
    
    // For now, we'll just return a placeholder URL
    const generatedAvatarUrl = "https://placehold.co/400x400/e2e8f0/475569?text=Generated+Avatar";

    // Save generation record to database
    const { data: savedGeneration, error: saveError } = await supabase
      .from("avatar_generations")
      .insert({
        user_id: user.id,
        customer_id: customerData.id,
        avatar_url: generatedAvatarUrl,
        generation_params: { style, description, ...otherParams },
        status: "completed"
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save generation record: ${saveError.message}`);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: generatedAvatarUrl,
      generationId: savedGeneration.id
    });
  } catch (error) {
    console.error("Error generating avatar:", error);
    return NextResponse.json({ error: "Failed to generate avatar" }, { status: 500 });
  }
}

// GET endpoint to retrieve user's avatar generation history
export async function GET(req: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: generations, error } = await supabase
      .from("avatar_generations")
      .select()
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to retrieve generations: ${error.message}`);
    }

    return NextResponse.json({ success: true, generations });
  } catch (error) {
    console.error("Error retrieving avatar generations:", error);
    return NextResponse.json({ error: "Failed to retrieve avatar generations" }, { status: 500 });
  }
}