-- ═══════════════════════════════════════════════════════════════════════════
-- SxB VPN — Script d'installation Supabase
-- Exécuter dans Supabase > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('USER','RESELLER','ADMIN','SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('ACTIVE','SUSPENDED','BANNED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE voucher_status AS ENUM ('ACTIVE','USED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE license_status AS ENUM ('ACTIVE','EXPIRED','REVOKED','SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE inbound_protocol AS ENUM ('SSH','VLESS','VMESS','TROJAN','SHADOWSOCKS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password TEXT,
  role user_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  device_limit INT NOT NULL DEFAULT 1,
  quota_used_gb FLOAT NOT NULL DEFAULT 0,
  quota_remaining_gb FLOAT NOT NULL DEFAULT 0,
  expire_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resellers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  balance FLOAT NOT NULL DEFAULT 0,
  commission FLOAT NOT NULL DEFAULT 0,
  user_id TEXT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  price FLOAT NOT NULL,
  quota_gb FLOAT NOT NULL,
  duration_day INT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inbounds (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  protocol inbound_protocol NOT NULL,
  host TEXT NOT NULL,
  port INT NOT NULL,
  path TEXT,
  sni TEXT,
  remark TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  quota_gb FLOAT NOT NULL,
  duration_day INT NOT NULL,
  status voucher_status NOT NULL DEFAULT 'ACTIVE',
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token TEXT UNIQUE NOT NULL,
  status license_status NOT NULL DEFAULT 'ACTIVE',
  phone TEXT,
  device_id TEXT,
  device_name TEXT,
  device_limit INT NOT NULL DEFAULT 1,
  data_limit_gb FLOAT NOT NULL DEFAULT 30,
  data_used_gb FLOAT NOT NULL DEFAULT 0,
  expire_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reseller_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INT NOT NULL DEFAULT 443,
  country TEXT,
  city TEXT,
  flag TEXT,
  type TEXT DEFAULT 'VLESS',
  ping INT DEFAULT 0,
  load INT DEFAULT 0,
  is_recommended BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configs (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  category TEXT,
  createdat TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  app_name TEXT DEFAULT 'SxB VPN',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563EB',
  accent_color TEXT DEFAULT '#06B6D4',
  background_color TEXT DEFAULT '#0B0F1A',
  max_devices_per_user INT DEFAULT 3,
  default_quota_gb FLOAT DEFAULT 30,
  default_duration_days INT DEFAULT 30,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

INSERT INTO system_config (id) VALUES ('00000000-0000-0000-0000-000000000001') ON CONFLICT DO NOTHING;

INSERT INTO configs (key, value, description, category) VALUES
  ('platform_name', 'SxB VPN', 'Nom de la plateforme', 'general'),
  ('admin_email', 'admin@sxbvpn.com', 'Email admin', 'general'),
  ('default_quota', '30', 'Quota par default en GB', 'user'),
  ('default_duration', '30', 'Duree par defaut en jours', 'voucher'),
  ('voucher_prefix', 'SXB', 'Prefixe des codes', 'voucher')
ON CONFLICT (key) DO NOTHING;

INSERT INTO plans (name, price, quota_gb, duration_day, description) VALUES
  ('Starter', 5.00, 30, 30, '30 GB / 30 jours'),
  ('Pro', 9.00, 100, 30, '100 GB / 30 jours'),
  ('Ultimate', 15.00, 250, 30, '250 GB / 30 jours')
ON CONFLICT DO NOTHING;

SELECT 'Installation SxB VPN terminee !' as message;
