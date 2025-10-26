"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/config/subscriptions";

interface TierCardProps {
    title: string;
    price: string;
    features: string[];
    cta: string;
    highlight?: boolean;
    onClick?: () => void;
}

function TierCard({ title, price, features, cta, highlight, onClick }: TierCardProps) {
    return (
        <Card className={`h-full ${highlight ? "border-2 border-primary/30 bg-primary/5" : ""}`}>
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                    {title}
                    {highlight && (
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    )}
                </CardTitle>
                <div className="text-5xl font-bold text-foreground">{price}</div>
                <div className="text-muted-foreground">/ month</div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 p-1 rounded-full bg-muted">
                                <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-muted-foreground text-sm leading-relaxed">{f}</span>
                        </div>
                    ))}
                </div>
                <Button className="w-full h-12 text-lg" onClick={onClick}>{cta}</Button>
            </CardContent>
        </Card>
    );
}

export default function PricingPage() {
    const router = useRouter();
    const { user } = useUser();
    const { toast } = useToast();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    const premium = SUBSCRIPTION_TIERS.find(t => t.id === "tier-premium");
    const ultimate = SUBSCRIPTION_TIERS.find(t => t.id === "tier-ultimate");

    async function startCheckout(productId: string, tierId: string) {
        if (!user) {
            toast({ title: "需要登录", description: "请先登录以继续结账", variant: "destructive" });
            router.push("/sign-in");
            return;
        }
        setLoadingTier(tierId);
        try {
            const res = await fetch("/api/creem/create-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, productType: "subscription" }),
            });
            if (!res.ok) throw new Error("Failed to create checkout session");
            const { checkoutUrl } = await res.json();
            if (!checkoutUrl) throw new Error("No checkout URL");
            window.location.href = checkoutUrl;
        } catch (e) {
            console.error(e);
            toast({ title: "支付失败", description: "请稍后重试。", variant: "destructive" });
        } finally {
            setLoadingTier(null);
        }
    }

    return (
        <section className="w-full py-20 bg-gradient-to-b from-background to-muted/20">
            <div className="container px-4 md:px-6">
                <div className="mx-auto max-w-6xl space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center space-y-4"
                    >
                        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">Pricing</h2>
                        <p className="mx-auto max-w-2xl text-muted-foreground text-lg">选择适合你的方案</p>
                    </motion.div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Free */}
                        <TierCard
                            title="Free"
                            price="$0"
                            features={[
                                "10 credits per day",
                                "Slow generation speed",
                                "Basic features",
                                "Community support",
                                "Images include watermark",
                            ]}
                            cta="Get Started"
                            onClick={() => router.push("/#pricing")}
                        />

                        {/* Premium */}
                        <TierCard
                            title="Premium"
                            price={premium?.priceMonthly ?? "$10"}
                            features={premium?.features ?? []}
                            cta={loadingTier === "tier-premium" ? "Processing..." : "Upgrade to Premium"}
                            onClick={() => premium && startCheckout(premium.productId, "tier-premium")}
                        />

                        {/* Ultimate */}
                        <TierCard
                            title="Ultimate"
                            price={ultimate?.priceMonthly ?? "$20"}
                            features={ultimate?.features ?? []}
                            cta={loadingTier === "tier-ultimate" ? "Processing..." : "Upgrade to Ultimate"}
                            highlight
                            onClick={() => ultimate && startCheckout(ultimate.productId, "tier-ultimate")}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
