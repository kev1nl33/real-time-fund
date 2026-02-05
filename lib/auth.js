// Supabase Auth 服务
import { supabase } from './supabase'

export const authService = {
  // 注册
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // 登录
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // 登出
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  // 监听认证状态变化
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}
