-- Real-time Fund Database Schema v2
-- 完整迁移版本：支持所有原有功能
-- 在 Supabase SQL Editor 中执行此脚本

-- =============================================
-- 1. 基金列表表
-- =============================================
DROP TABLE IF EXISTS funds CASCADE;
CREATE TABLE funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  fund_code TEXT NOT NULL,
  fund_name TEXT DEFAULT '',
  holding_amount DECIMAL(20, 2) DEFAULT 0,  -- 持有金额
  is_favorite BOOLEAN DEFAULT false,         -- 是否自选
  is_collapsed BOOLEAN DEFAULT false,        -- 是否折叠重仓股
  group_id TEXT DEFAULT NULL,                -- 所属分组 ID
  sort_order INTEGER DEFAULT 0,              -- 排序顺序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fund_code)
);

-- 创建索引
CREATE INDEX idx_funds_user_id ON funds(user_id);
CREATE INDEX idx_funds_fund_code ON funds(fund_code);
CREATE INDEX idx_funds_group_id ON funds(group_id);

-- =============================================
-- 2. 分组表
-- =============================================
DROP TABLE IF EXISTS groups CASCADE;
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  group_id TEXT NOT NULL,        -- 前端使用的分组 ID
  group_name TEXT NOT NULL,      -- 分组名称
  sort_order INTEGER DEFAULT 0,  -- 排序顺序
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- 创建索引
CREATE INDEX idx_groups_user_id ON groups(user_id);

-- =============================================
-- 3. 用户设置表
-- =============================================
DROP TABLE IF EXISTS user_settings CASCADE;
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  refresh_ms INTEGER DEFAULT 30000,      -- 刷新间隔（毫秒）
  view_mode TEXT DEFAULT 'card',         -- 视图模式：card | list
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- 4. 更新时间触发器
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建触发器
DROP TRIGGER IF EXISTS update_funds_updated_at ON funds;
CREATE TRIGGER update_funds_updated_at
  BEFORE UPDATE ON funds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_groups_updated_at ON groups;
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. 启用 Realtime（实时同步）
-- =============================================
-- 在 Supabase Dashboard > Database > Replication 中启用以下表：
-- - funds
-- - groups
-- - user_settings

-- 或者通过 SQL：
ALTER PUBLICATION supabase_realtime ADD TABLE funds;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- =============================================
-- 6. 行级安全策略（RLS）- 可选
-- =============================================
-- 由于使用固定 user_id，这里不启用 RLS
-- 如果将来需要多用户支持，取消下面的注释：

-- ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "用户只能访问自己的基金" ON funds
--   FOR ALL USING (user_id = current_setting('app.user_id', true));

-- CREATE POLICY "用户只能访问自己的分组" ON groups
--   FOR ALL USING (user_id = current_setting('app.user_id', true));

-- CREATE POLICY "用户只能访问自己的设置" ON user_settings
--   FOR ALL USING (user_id = current_setting('app.user_id', true));
