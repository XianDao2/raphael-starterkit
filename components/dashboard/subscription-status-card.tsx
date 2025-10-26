"use client";

import {
  CreditCard,
  Package2,
  AlertCircle,
  Clock,
  Ban,
  PauseCircle,
  LucideIcon,
} from "lucide-react";
import { SubscriptionPortalDialog } from "./subscription-portal-dialog";
import { SubscriptionState } from "@/types/subscriptions";
import { SUBSCRIPTION_TIERS } from "@/config/subscriptions";

type StatusConfig = {
  color: string;
  icon: LucideIcon;
  message: string;
  iconColor: string;
};

type StatusConfigs = {
  [key in SubscriptionState]: StatusConfig;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}

function isFutureDate(date: string) {
  return new Date(date) > new Date();
}

function getStatusConfig(
  status: string,
  current_period_end: string
): StatusConfig {
  const inGracePeriod = isFutureDate(current_period_end);

  const configs: StatusConfigs = {
    active: {
      color: "text-green-500",
      icon: Package2,
      message: `Renews on ${formatDate(current_period_end)}`,
      iconColor: "text-green-500",
    },
    trialing: {
      color: "text-primary",
      icon: Clock,
      message: `Trial ends on ${formatDate(current_period_end)}`,
      iconColor: "text-primary",
    },
    canceled: {
      color: inGracePeriod ? "text-yellow-500" : "text-destructive",
      icon: Ban,
      message: inGracePeriod
        ? `Access until ${formatDate(current_period_end)}`
        : `Ended on ${formatDate(current_period_end)}`,
      iconColor: inGracePeriod ? "text-yellow-500" : "text-destructive",
    },
    past_due: {
      color: "text-yellow-500",
      icon: AlertCircle,
      message: `Payment due - Access until ${formatDate(current_period_end)}`,
      iconColor: "text-yellow-500",
    },
    unpaid: {
      color: "text-destructive",
      icon: AlertCircle,
      message: "Payment required",
      iconColor: "text-destructive",
    },
    paused: {
      color: "text-yellow-500",
      icon: PauseCircle,
      message: `Paused until ${formatDate(current_period_end)}`,
      iconColor: "text-yellow-500",
    },
    incomplete: {
      color: "text-yellow-500",
      icon: AlertCircle,
      message: "Setup incomplete",
      iconColor: "text-yellow-500",
    },
    expired: {
      color: "text-destructive",
      icon: Ban,
      message: `Expired on ${formatDate(current_period_end)}`,
      iconColor: "text-destructive",
    },
  };

  return (
    configs[status as SubscriptionState] || {
      color: "text-muted-foreground",
      icon: AlertCircle,
      message: "No active plan",
      iconColor: "text-muted-foreground",
    }
  );
}

type SubscriptionStatusCardProps = {
  subscription?: {
    status: string;
    current_period_end: string;
    creem_product_id: string;
  } | null;
};

export function SubscriptionStatusCard({
  subscription,
}: SubscriptionStatusCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <CreditCard className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Subscription Status</p>
          {subscription && (
            <h3
              className={`text-2xl font-bold capitalize mt-1 ${getStatusConfig(
                subscription.status,
                subscription.current_period_end
              ).color
                }`}
            >
              {(() => {
                const tier = SUBSCRIPTION_TIERS.find(
                  (t) => t.productId === subscription.creem_product_id
                );
                return tier ? tier.name : subscription.status;
              })()}
            </h3>
          )}
          {!subscription && (
            <h3 className="text-2xl font-bold mt-1 text-muted-foreground">
              No Active Plan
            </h3>
          )}
        </div>
      </div>
      {subscription && (
        <div className="mt-4 flex items-center text-sm gap-2">
          {(() => {
            const config = getStatusConfig(
              subscription.status,
              subscription.current_period_end
            );
            const Icon = config.icon;
            return (
              <>
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
                <span className="text-muted-foreground">{config.message}</span>
              </>
            );
          })()}
        </div>
      )}
      <div className="mt-4">
        <SubscriptionPortalDialog />
      </div>
    </div>
  );
}
