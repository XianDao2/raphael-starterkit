import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createCheckoutSession } from "@/app/actions";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, productType = "subscription", creditsAmount, discountCode } = body || {};

        if (!productId) {
            return new NextResponse("Missing productId", { status: 400 });
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const checkoutUrl = await createCheckoutSession(
            productId,
            user.email,
            user.id,
            productType,
            creditsAmount,
            discountCode
        );

        return NextResponse.json({ checkoutUrl });
    } catch (error) {
        console.error("Error creating subscription checkout:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}


