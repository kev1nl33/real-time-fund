// Supabase 客户端配置
// 用于 GitHub Pages 纯前端环境

import { createClient } from '@supabase/supabase-js'

// 从环境变量读取（构建时注入）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 获取或创建用户ID（基于设备指纹）
export function getUserId() {
  if (typeof window === 'undefined') return null
  
  let userId = localStorage.getItem('fund_user_id')
  if (!userId) {
    // 生成唯一ID
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('fund_user_id', userId)
  }
  return userId
}

// 基金数据操作
export const fundService = {
  // 获取用户的所有基金
  async getFunds() {
    const userId = getUserId()
    if (!userId) return { data: [], error: null }

    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return { data: data || [], error }
  },

  // 添加基金
  async addFund({ fundCode, fundName, shares = 0, cost = 0, groupName = '全部' }) {
    const userId = getUserId()
    if (!userId) return { data: null, error: new Error('无法获取用户ID') }

    const { data, error } = await supabase
      .from('funds')
      .insert([{
        user_id: userId,
        fund_code: fundCode,
        fund_name: fundName,
        shares,
        cost,
        group_name: groupName,
        is_favorite: false
      }])
      .select()
      .single()

    return { data, error }
  },

  // 更新基金
  async updateFund(id, updates) {
    const userId = getUserId()
    if (!userId) return { data: null, error: new Error('无法获取用户ID') }

    const { data, error } = await supabase
      .from('funds')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  },

  // 删除基金
  async deleteFund(id) {
    const userId = getUserId()
    if (!userId) return { error: new Error('无法获取用户ID') }

    const { error } = await supabase
      .from('funds')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    return { error }
  },

  // 切换自选状态
  async toggleFavorite(id, isFavorite) {
    return this.updateFund(id, { is_favorite: isFavorite })
  }
}

// 用户设置操作
export const settingsService = {
  // 获取用户设置
  async getSettings() {
    const userId = getUserId()
    if (!userId) return { data: null, error: null }

    let { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 如果不存在，创建默认设置
    if (error && error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert([{
          user_id: userId,
          refresh_interval: 30,
          view_mode: 'card',
          sort_by: 'default'
        }])
        .select()
        .single()

      return { data: newData, error: insertError }
    }

    return { data, error }
  },

  // 更新用户设置
  async updateSettings(updates) {
    const userId = getUserId()
    if (!userId) return { data: null, error: new Error('无法获取用户ID') }

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    return { data, error }
  }
}
