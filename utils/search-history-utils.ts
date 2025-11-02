import { createClient } from './supabase/client';

// 定义搜索历史的类型
export interface SearchHistoryRecord {
  id?: string;
  user_id: string;
  customer_id: string;
  search_type: 'famous_person_search' | 'pronunciation_search' | 'other';
  search_query: string;
  search_results: any;
  metadata?: Record<string, any>;
}

/**
 * 记录搜索历史到数据库
 * @param searchData 搜索数据对象，包含搜索类型、查询内容和结果
 * @returns 创建的搜索历史记录
 */
export async function recordSearchHistory(
  searchData: Omit<SearchHistoryRecord, 'id' | 'user_id' | 'customer_id'>
): Promise<SearchHistoryRecord | null> {
  try {
    const supabase = createClient();
    
    // 获取当前认证用户信息
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('用户未登录');
    }
    
    // 获取用户对应的customer记录
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (customerError || !customer) {
      throw new Error('获取用户信息失败');
    }
    
    // 创建完整的搜索历史记录
    const searchHistoryRecord: SearchHistoryRecord = {
      user_id: user.id,
      customer_id: customer.id,
      ...searchData,
      metadata: searchData.metadata || {}
    };
    
    // 插入搜索历史记录
    const { data, error } = await supabase
      .from('search_history')
      .insert(searchHistoryRecord)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('记录搜索历史失败:', error);
    return null;
  }
}

/**
 * 获取用户的搜索历史记录
 * @param limit 限制返回的记录数量
 * @param offset 跳过的记录数量
 * @param searchType 可选的搜索类型过滤
 * @returns 用户的搜索历史记录列表
 */
export async function getUserSearchHistory(
  limit: number = 20,
  offset: number = 0,
  searchType?: 'famous_person_search' | 'pronunciation_search' | 'other'
): Promise<SearchHistoryRecord[]> {
  try {
    const supabase = createClient();
    
    // 获取当前认证用户信息
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }
    
    // 构建查询
    let query = supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('search_date', { ascending: false })
      .limit(limit);
    
    // 使用 range 方法替代 offset，兼容新版本的 Supabase 客户端
    if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }
    
    // 如果指定了搜索类型，添加过滤器
    if (searchType) {
      query = query.eq('search_type', searchType);
    }
    
    // 执行查询
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

/**
 * 删除用户的特定搜索历史记录
 * @param historyId 要删除的搜索历史记录ID
 * @returns 删除是否成功
 */
export async function deleteSearchHistory(historyId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 获取当前认证用户信息
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    
    // 执行删除操作（确保只能删除自己的记录）
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', historyId)
      .eq('user_id', user.id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('删除搜索历史失败:', error);
    return false;
  }
}

/**
 * 清空用户的所有搜索历史记录
 * @param searchType 可选的搜索类型过滤
 * @returns 清空是否成功
 */
export async function clearUserSearchHistory(
  searchType?: 'famous_person_search' | 'pronunciation_search' | 'other'
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // 获取当前认证用户信息
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    
    // 构建查询
    let query = supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id);
    
    // 如果指定了搜索类型，添加过滤器
    if (searchType) {
      query = query.eq('search_type', searchType);
    }
    
    // 执行删除操作
    const { error } = await query;
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('清空搜索历史失败:', error);
    return false;
  }
}