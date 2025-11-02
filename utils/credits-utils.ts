"use client";

/**
 * 公共方法：消费积分
 * @param amount 消费积分数量
 * @param operation 操作类型描述
 * @returns Promise<boolean> 操作是否成功
 */
export const consumeCredits = async (amount: number = 1, operation: string = 'famous_person_search'): Promise<boolean> => {
  try {
    const response = await fetch('/api/credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount, operation }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to consume credits:', data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error consuming credits:', error);
    return false;
  }
};

/**
 * 检查用户是否有足够积分
 * @param requiredAmount 需要的积分数量
 * @returns Promise<{ hasEnough: boolean; remainingCredits?: number }>
 */
export const checkCredits = async (requiredAmount: number = 1): Promise<{ hasEnough: boolean; remainingCredits?: number }> => {
  try {
    const response = await fetch('/api/credits');
    
    if (!response.ok) {
      // 未认证用户或其他错误
      return { hasEnough: false };
    }
    
    const data = await response.json();
    const remainingCredits = data.credits?.remaining_credits || 0;
    
    return {
      hasEnough: remainingCredits >= requiredAmount,
      remainingCredits
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    return { hasEnough: false };
  }
};