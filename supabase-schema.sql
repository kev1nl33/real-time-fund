-- Real-time Fund Database Schema
-- 在 Supabase SQL Editor 中执行此脚本

-- 1. 基金列表表
CREATE TABLE IF NOT EXISTS funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  fund_code TEXT NOT NULL,
  fund_name TEXT NOT NULL,
  shares DECIMAL(20, 4) DEFAULT 0,
  cost DECIMAL(20, 2) DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  group_name TEXT DEFAULT '全部',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fund_code)
);

-- 2. 用户设置表
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  refresh_interval INTEGER DEFAULT 30,
  view_mode TEXT DEFAULT 'card',
  sort_by TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_funds_user_id ON funds(user_id);
CREATE INDEX IF NOT EXISTS idx_funds_fund_code ON funds(fund_code);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_funds_updated_at
  BEFORE UPDATE ON funds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
