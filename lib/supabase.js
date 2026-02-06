// Supabase 客户端配置
// 用于 GitHub Pages 纯前端环境 - 完整迁移版本

import { createClient } from '@supabase/supabase-js'

// 从环境变量读取（构建时注入）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 固定用户 ID（方案 A：仅个人使用）
const FIXED_USER_ID = 'kevin-fixed-id'

export function getUserId() {
  return FIXED_USER_ID
}

// =============================================
// 基金操作
// =============================================
export const fundService = {
  // 获取用户的所有基金
  async getFunds() {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取基金失败:', error)
      return []
    }

    // 转换为前端格式
    return data.map(fund => ({
      code: fund.fund_code,
      name: fund.fund_name || '',
      _supabaseId: fund.id,
    }))
  },

  // 获取完整的基金数据（包括所有字段）
  async getFullFundsData() {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('funds')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取基金数据失败:', error)
      return { funds: [], favorites: new Set(), collapsedCodes: new Set(), holdings: {} }
    }

    const funds = []
    const favorites = new Set()
    const collapsedCodes = new Set()
    const holdings = {}

    for (const fund of data) {
      funds.push({
        code: fund.fund_code,
        name: fund.fund_name || '',
        _supabaseId: fund.id,
        groupId: fund.group_id,
      })

      if (fund.is_favorite) {
        favorites.add(fund.fund_code)
      }

      if (fund.is_collapsed) {
        collapsedCodes.add(fund.fund_code)
      }

      if (fund.holding_shares && parseFloat(fund.holding_shares) > 0) {
        holdings[fund.fund_code] = {
          share: parseFloat(fund.holding_shares),
          cost: parseFloat(fund.holding_cost) || 0
        }
      } else if (fund.holding_amount && parseFloat(fund.holding_amount) > 0) {
        // 向后兼容：旧数据只有 holding_amount，无法还原 share/cost
        holdings[fund.fund_code] = {
          share: 0,
          cost: 0
        }
      }
    }

    return { funds, favorites, collapsedCodes, holdings }
  },

  // 添加基金
  async addFund(fundCode, fundName = '') {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('funds')
      .upsert({
        user_id: userId,
        fund_code: fundCode,
        fund_name: fundName,
      }, { onConflict: 'user_id,fund_code' })
      .select()
      .single()

    if (error) {
      console.error('添加基金失败:', error)
      return null
    }

    return data
  },

  // 删除基金
  async deleteFund(fundCode) {
    const userId = getUserId()

    const { error } = await supabase
      .from('funds')
      .delete()
      .eq('user_id', userId)
      .eq('fund_code', fundCode)

    if (error) {
      console.error('删除基金失败:', error)
      return false
    }

    return true
  },

  // 更新基金信息
  async updateFund(fundCode, updates) {
    const userId = getUserId()

    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.fund_name = updates.name
    if (updates.isFavorite !== undefined) dbUpdates.is_favorite = updates.isFavorite
    if (updates.isCollapsed !== undefined) dbUpdates.is_collapsed = updates.isCollapsed
    if (updates.holdingAmount !== undefined) dbUpdates.holding_amount = updates.holdingAmount
    if (updates.holdingShares !== undefined) dbUpdates.holding_shares = updates.holdingShares
    if (updates.holdingCost !== undefined) dbUpdates.holding_cost = updates.holdingCost
    if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder

    const { error } = await supabase
      .from('funds')
      .update(dbUpdates)
      .eq('user_id', userId)
      .eq('fund_code', fundCode)

    if (error) {
      console.error('更新基金失败:', error)
      return false
    }

    return true
  },

  // 批量更新基金顺序
  async updateFundsOrder(fundCodes) {
    const userId = getUserId()

    const updates = fundCodes.map((code, index) => ({
      user_id: userId,
      fund_code: code,
      sort_order: index,
    }))

    for (const update of updates) {
      await supabase
        .from('funds')
        .update({ sort_order: update.sort_order })
        .eq('user_id', userId)
        .eq('fund_code', update.fund_code)
    }

    return true
  },

  // 批量同步基金（用于初始迁移）
  async syncFunds(localData) {
    const userId = getUserId()
    const { funds, favorites, collapsedCodes, holdings } = localData

    for (const fund of funds) {
      const fundCode = fund.code || fund

      await supabase
        .from('funds')
        .upsert({
          user_id: userId,
          fund_code: fundCode,
          fund_name: fund.name || '',
          is_favorite: favorites.has(fundCode),
          is_collapsed: collapsedCodes.has(fundCode),
          holding_amount: holdings[fundCode] ? (holdings[fundCode].share || 0) * (holdings[fundCode].cost || 0) : 0,
          holding_shares: holdings[fundCode]?.share || 0,
          holding_cost: holdings[fundCode]?.cost || 0,
          group_id: fund.groupId || null,
        }, { onConflict: 'user_id,fund_code' })
    }

    return true
  },
}

// =============================================
// 分组操作
// =============================================
export const groupService = {
  // 获取所有分组
  async getGroups() {
    const userId = getUserId()

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('获取分组失败:', error)
      return []
    }

    // 转换为前端格式
    return data.map(group => ({
      id: group.group_id,
      name: group.group_name,
    }))
  },

  // 保存分组（全量覆盖）
  async saveGroups(groups) {
    const userId = getUserId()

    // 先删除所有现有分组
    await supabase
      .from('groups')
      .delete()
      .eq('user_id', userId)

    // 插入新分组
    if (groups.length > 0) {
      const rows = groups.map((group, index) => ({
        user_id: userId,
        group_id: group.id,
        group_name: group.name,
        sort_order: index,
      }))

      const { error } = await supabase
        .from('groups')
        .insert(rows)

      if (error) {
        console.error('保存分组失败:', error)
        return false
      }
    }

    return true
  },

  // 添加分组
  async addGroup(groupId, groupName) {
    const userId = getUserId()

    // 获取当前最大排序
    const { data: existing } = await supabase
      .from('groups')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const maxOrder = existing?.[0]?.sort_order ?? -1

    const { error } = await supabase
      .from('groups')
      .insert({
        user_id: userId,
        group_id: groupId,
        group_name: groupName,
        sort_order: maxOrder + 1,
      })

    if (error) {
      console.error('添加分组失败:', error)
      return false
    }

    return true
  },

  // 删除分组
  async deleteGroup(groupId) {
    const userId = getUserId()

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('user_id', userId)
      .eq('group_id', groupId)

    if (error) {
      console.error('删除分组失败:', error)
      return false
    }

    return true
  },

  // 更新分组名称
  async updateGroup(groupId, groupName) {
    const userId = getUserId()

    const { error } = await supabase
      .from('groups')
      .update({ group_name: groupName })
      .eq('user_id', userId)
      .eq('group_id', groupId)

    if (error) {
      console.error('更新分组失败:', error)
      return false
    }

    return true
  },
}

// =============================================
// 用户设置操作
// =============================================
export const settingsService = {
  // 获取用户设置
  async getSettings() {
    const userId = getUserId()

    let { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 如果不存在，创建默认设置
    if (error && error.code === 'PGRST116') {
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          refresh_ms: 30000,
          view_mode: 'card',
        })
        .select()
        .single()

      if (insertError) {
        console.error('创建用户设置失败:', insertError)
        return { refreshMs: 30000, viewMode: 'card' }
      }

      data = newData
    } else if (error) {
      console.error('获取用户设置失败:', error)
      return { refreshMs: 30000, viewMode: 'card' }
    }

    return {
      refreshMs: data.refresh_ms,
      viewMode: data.view_mode,
    }
  },

  // 更新用户设置
  async updateSettings(updates) {
    const userId = getUserId()

    const dbUpdates = {}
    if (updates.refreshMs !== undefined) dbUpdates.refresh_ms = updates.refreshMs
    if (updates.viewMode !== undefined) dbUpdates.view_mode = updates.viewMode

    const { error } = await supabase
      .from('user_settings')
      .update(dbUpdates)
      .eq('user_id', userId)

    if (error) {
      console.error('更新用户设置失败:', error)
      return false
    }

    return true
  },
}

// =============================================
// 实时订阅
// =============================================
export const realtimeService = {
  // 订阅基金变化
  subscribeFunds(callback) {
    const userId = getUserId()

    const channel = supabase
      .channel('funds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'funds',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('基金数据变化:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // 订阅分组变化
  subscribeGroups(callback) {
    const userId = getUserId()

    const channel = supabase
      .channel('groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('分组数据变化:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  // 订阅设置变化
  subscribeSettings(callback) {
    const userId = getUserId()

    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('设置变化:', payload)
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}

// =============================================
// 数据迁移（从 localStorage 到 Supabase）
// =============================================
export const migrationService = {
  // 检查是否需要迁移
  async checkMigrationNeeded() {
    if (typeof window === 'undefined') return false

    // 检查是否已迁移
    const migrated = localStorage.getItem('supabase_migrated')
    if (migrated === 'true') return false

    // 检查是否有本地数据
    const localFunds = localStorage.getItem('funds')
    return !!localFunds && localFunds !== '[]'
  },

  // 执行迁移
  async migrate() {
    if (typeof window === 'undefined') return false

    try {
      // 读取本地数据
      const funds = JSON.parse(localStorage.getItem('funds') || '[]')
      const favorites = new Set(JSON.parse(localStorage.getItem('favorites') || '[]'))
      const collapsedCodes = new Set(JSON.parse(localStorage.getItem('collapsedCodes') || '[]'))
      const holdings = JSON.parse(localStorage.getItem('holdings') || '{}')
      const groups = JSON.parse(localStorage.getItem('groups') || '[]')
      const refreshMs = parseInt(localStorage.getItem('refreshMs') || '30000', 10)
      const viewMode = localStorage.getItem('viewMode') || 'card'

      // 同步基金数据
      if (funds.length > 0) {
        await fundService.syncFunds({ funds, favorites, collapsedCodes, holdings })
      }

      // 同步分组
      if (groups.length > 0) {
        await groupService.saveGroups(groups)
      }

      // 同步设置
      await settingsService.updateSettings({ refreshMs, viewMode })

      // 标记已迁移
      localStorage.setItem('supabase_migrated', 'true')

      console.log('数据迁移完成!')
      return true
    } catch (error) {
      console.error('数据迁移失败:', error)
      return false
    }
  },

  // 重置迁移标记（用于测试）
  resetMigration() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('supabase_migrated')
  },
}
