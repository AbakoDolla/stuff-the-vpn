/*
# Fix RLS Policies - Add Admin Access + Default Configs

1. Security Changes
- Fix text=uuid cast errors by adding ::text to auth.uid() comparisons
- Add admin-only policies for write operations on all tables
- Enable RLS on tables that were missing it
- Add role-based admin policies (SUPER_ADMIN/ADMIN can manage, RESELLER can view own)

2. Default Configs
- Insert default quotas, durations, device limits, security settings into configs table
- Insert default platform settings into system_config table
*/

-- ===== configs - restrict write to admin only =====
DROP POLICY IF EXISTS "configs_delete_admin" ON configs;
DROP POLICY IF EXISTS "configs_insert_admin" ON configs;
DROP POLICY IF EXISTS "configs_update_admin" ON configs;

CREATE POLICY "configs_insert_admin" ON configs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "configs_update_admin" ON configs FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "configs_delete_admin" ON configs FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ===== users - admin can see all, update/delete =====
DROP POLICY IF EXISTS "users_select_all_admin" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

CREATE POLICY "users_select_all_admin" ON users FOR SELECT
  TO authenticated USING (
    id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "users_update_admin" ON users FOR UPDATE
  TO authenticated USING (
    id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    id = auth.uid()::text OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "users_delete_admin" ON users FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'SUPER_ADMIN')
  );

-- ===== resellers - add RLS =====
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resellers_select_all" ON resellers;
DROP POLICY IF EXISTS "resellers_insert_admin" ON resellers;
DROP POLICY IF EXISTS "resellers_update_admin" ON resellers;
DROP POLICY IF EXISTS "resellers_delete_admin" ON resellers;

CREATE POLICY "resellers_select_all" ON resellers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "resellers_insert_admin" ON resellers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "resellers_update_admin" ON resellers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "resellers_delete_admin" ON resellers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'SUPER_ADMIN')
  );

-- ===== servers - add RLS =====
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servers_select_all" ON servers;
DROP POLICY IF EXISTS "servers_insert_admin" ON servers;
DROP POLICY IF EXISTS "servers_update_admin" ON servers;
DROP POLICY IF EXISTS "servers_delete_admin" ON servers;

CREATE POLICY "servers_select_all" ON servers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "servers_insert_admin" ON servers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "servers_update_admin" ON servers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "servers_delete_admin" ON servers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ===== vouchers - full RLS =====
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vouchers_select_all" ON vouchers;
DROP POLICY IF EXISTS "vouchers_insert_admin" ON vouchers;
DROP POLICY IF EXISTS "vouchers_update_admin" ON vouchers;
DROP POLICY IF EXISTS "vouchers_delete_admin" ON vouchers;

CREATE POLICY "vouchers_select_all" ON vouchers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "vouchers_insert_admin" ON vouchers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "vouchers_update_admin" ON vouchers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "vouchers_delete_admin" ON vouchers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ===== plans - full RLS =====
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_select_all" ON plans;
DROP POLICY IF EXISTS "plans_insert_admin" ON plans;
DROP POLICY IF EXISTS "plans_update_admin" ON plans;
DROP POLICY IF EXISTS "plans_delete_admin" ON plans;

CREATE POLICY "plans_select_all" ON plans FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "plans_insert_admin" ON plans FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "plans_update_admin" ON plans FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "plans_delete_admin" ON plans FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ===== inbounds - full RLS =====
ALTER TABLE inbounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inbounds_select_all" ON inbounds;
DROP POLICY IF EXISTS "inbounds_insert_admin" ON inbounds;
DROP POLICY IF EXISTS "inbounds_update_admin" ON inbounds;
DROP POLICY IF EXISTS "inbounds_delete_admin" ON inbounds;

CREATE POLICY "inbounds_select_all" ON inbounds FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "inbounds_insert_admin" ON inbounds FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "inbounds_update_admin" ON inbounds FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "inbounds_delete_admin" ON inbounds FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- ===== system_config - full RLS =====
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_config_select_all" ON system_config;
DROP POLICY IF EXISTS "system_config_insert_admin" ON system_config;
DROP POLICY IF EXISTS "system_config_update_admin" ON system_config;
DROP POLICY IF EXISTS "system_config_delete_admin" ON system_config;

CREATE POLICY "system_config_select_all" ON system_config FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "system_config_insert_admin" ON system_config FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "system_config_update_admin" ON system_config FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "system_config_delete_admin" ON system_config FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'SUPER_ADMIN')
  );

-- ===== INSERT DEFAULT CONFIGS INTO configs TABLE =====
INSERT INTO configs (key, value, description, category, createdat) VALUES
  ('default_quota', '30', 'Quota par defaut en GB pour les nouveaux utilisateurs', 'user', NOW()),
  ('default_duration', '30', 'Duree par defaut en jours pour les nouveaux vouchers', 'voucher', NOW()),
  ('default_device_limit', '3', 'Nombre d appareils maximum par defaut', 'user', NOW()),
  ('default_max_login_attempts', '5', 'Tentatives de connexion avant blocage', 'security', NOW()),
  ('default_session_duration', '24', 'Duree de session en heures', 'security', NOW()),
  ('voucher_prefix', 'SXB', 'Prefixe des codes voucher', 'voucher', NOW()),
  ('voucher_length', '16', 'Longueur totale des codes voucher', 'voucher', NOW()),
  ('platform_name', 'SxB VPN', 'Nom de la plateforme', 'general', NOW()),
  ('admin_email', 'admin@sxbvpn.com', 'Email de contact admin', 'general', NOW()),
  ('timezone', 'Europe/Paris', 'Fuseau horaire par defaut', 'general', NOW()),
  ('alert_server_offline', 'true', 'Notifier quand un serveur est offline', 'notifications', NOW()),
  ('alert_quota_90', 'true', 'Notifier quand un utilisateur atteint 90% de quota', 'notifications', NOW()),
  ('alert_new_user', 'false', 'Notifier pour chaque nouvelle inscription', 'notifications', NOW()),
  ('two_factor_admin', 'true', '2FA obligatoire pour les admin', 'security', NOW())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  createdat = NOW();

-- ===== INSERT DEFAULT CONFIGS INTO system_config TABLE =====
INSERT INTO system_config (
  id, app_name, logo_url, primary_color, accent_color, background_color,
  max_devices_per_user, default_quota_gb, default_duration_days, maintenance_mode, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'SxB VPN',
  'https://sxbvpn.com/logo.png',
  '#2563EB',
  '#06B6D4',
  '#0B0F1A',
  3,
  30,
  30,
  false,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  app_name = EXCLUDED.app_name,
  logo_url = EXCLUDED.logo_url,
  primary_color = EXCLUDED.primary_color,
  accent_color = EXCLUDED.accent_color,
  background_color = EXCLUDED.background_color,
  max_devices_per_user = EXCLUDED.max_devices_per_user,
  default_quota_gb = EXCLUDED.default_quota_gb,
  default_duration_days = EXCLUDED.default_duration_days,
  maintenance_mode = EXCLUDED.maintenance_mode,
  updated_at = NOW();
