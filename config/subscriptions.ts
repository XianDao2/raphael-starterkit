import { ProductTier } from "@/types/subscriptions";

export const SUBSCRIPTION_TIERS: ProductTier[] = [
  {
    name: "Premium",
    id: "tier-premium",
    productId: "prod_5Kqq7BxbLyxmO1sM0Pc5LY", // $10 monthly subscription
    priceMonthly: "$10",
    description: "适合个人用户的优质订阅方案。",
    features: [
      "完整的功能访问",
      "每月固定额度",
      "优先处理",
      "基本客户支持",
      "多设备同步",
      "数据安全保障",
    ],
    featured: false,
    discountCode: "", // 可选折扣码
  },
  {
    name: "Ultimate",
    id: "tier-ultimate",
    productId: "prod_6gRB7gyIkL0pvN7wG6iAjp", // $10 monthly subscription
    priceMonthly: "$10",
    description: "适合专业用户的顶级订阅方案。",
    features: [
      "全部Premium功能",
      "更多使用额度",
      "优先客户支持",
      "高级分析工具",
      "定制化选项",
      "专属服务",
    ],
    featured: true,
    discountCode: "", // 可选折扣码
  },
];

export const CREDITS_TIERS: ProductTier[] = [
  {
    name: "Basic Package",
    id: "tier-3-credits",
    productId: "prod_5Kqq7BxbLyxmO1sM0Pc5LY", // $9 one-time purchase
    priceMonthly: "$9",
    description: "3 credits for testing and small-scale projects.",
    creditAmount: 3,
    features: [
      "3 credits for use across all features",
      "No expiration date",
      "Access to standard features",
      "Community support"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
  {
    name: "Standard Package",
    id: "tier-6-credits",
    productId: "prod_5Kqq7BxbLyxmO1sM0Pc5LY", // $13 one-time purchase
    priceMonthly: "$13",
    description: "6 credits for medium-sized applications.",
    creditAmount: 6,
    features: [
      "6 credits for use across all features",
      "No expiration date",
      "Priority processing",
      "Basic email support"
    ],
    featured: true,
    discountCode: "", // Optional discount code
  },
  {
    name: "Premium Package",
    id: "tier-9-credits",
    productId: "prod_5Kqq7BxbLyxmO1sM0Pc5LY", // $29 one-time purchase
    priceMonthly: "$29",
    description: "9 credits for larger applications and production use.",
    creditAmount: 9,
    features: [
      "9 credits for use across all features",
      "No expiration date",
      "Premium support",
      "Advanced analytics access"
    ],
    featured: false,
    discountCode: "", // Optional discount code
  },
];
