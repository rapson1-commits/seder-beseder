-- ============================================================
-- סדר בסדר — SQL Schema
-- הדבק הכל ב-Supabase SQL Editor ולחץ RUN
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── FAMILIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS families (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name  TEXT NOT NULL,
  created_by   UUID,
  invite_code  TEXT UNIQUE DEFAULT UPPER(substr(md5(random()::text), 1, 8)),
  family_photo TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER PROFILES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,                         -- added: stored in settings
  avatar_url  TEXT,                         -- added: future photo support
  family_id   UUID REFERENCES families(id),
  is_admin    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── FAMILY MEMBERS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id      UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  first_name     TEXT NOT NULL,
  last_name      TEXT,
  nickname       TEXT,
  phone          TEXT,
  email          TEXT,
  side_of_family TEXT CHECK (side_of_family IN ('אמא','אבא','בן/בת זוג','אחר')),
  notes          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  event_type       TEXT NOT NULL,
  holiday_name     TEXT,
  custom_name      TEXT,
  hebrew_date      TEXT,
  gregorian_date   DATE,
  year             INTEGER,
  host_member_id   UUID REFERENCES family_members(id),
  host_name_manual TEXT,
  location_name    TEXT,
  address          TEXT,
  notes            TEXT,
  actual_happened  BOOLEAN DEFAULT FALSE,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENT PARTICIPANTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_participants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id         UUID NOT NULL REFERENCES family_members(id),
  attendance_status TEXT DEFAULT 'invited'
    CHECK (attendance_status IN ('invited','confirmed','declined','attended','absent')),
  what_they_bring   TEXT,
  bring_confirmed   BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- ── FAMILY INVITATIONS ───────────────────────────────────────
-- Tracks invite links that haven't been used yet.
-- Useful for: expiring codes, single-use invites, audit log.
CREATE TABLE IF NOT EXISTS family_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  created_by  UUID REFERENCES auth.users(id),
  used_by     UUID REFERENCES auth.users(id),  -- NULL = still available
  expires_at  TIMESTAMPTZ,                      -- NULL = never expires
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE families          ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Users can only see their own family's data
CREATE POLICY "family_access" ON families
  FOR ALL USING (
    id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "own_profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

CREATE POLICY "family_members_access" ON family_members
  FOR ALL USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "events_access" ON events
  FOR ALL USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

CREATE POLICY "participants_access" ON event_participants
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE
      family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- ── PERFORMANCE INDEXES ──────────────────────────────────────
-- These prevent full table scans on the most common WHERE clauses.
CREATE INDEX IF NOT EXISTS idx_family_members_family_id   ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_active      ON family_members(family_id, is_active);
CREATE INDEX IF NOT EXISTS idx_events_family_id           ON events(family_id);
CREATE INDEX IF NOT EXISTS idx_events_family_year         ON events(family_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_events_family_type         ON events(family_id, event_type);
CREATE INDEX IF NOT EXISTS idx_participants_event_id      ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_member_id     ON event_participants(member_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_id    ON user_profiles(family_id);
CREATE INDEX IF NOT EXISTS idx_invitations_code           ON family_invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_family         ON family_invitations(family_id);

-- ── UPDATED_AT AUTO-TRIGGER ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['families','user_profiles','family_members','events','event_participants']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I;
       CREATE TRIGGER trg_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;

-- ── RLS FOR INVITATIONS ───────────────────────────────────────
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_access" ON family_invitations
  FOR ALL USING (
    family_id IN (SELECT family_id FROM user_profiles WHERE id = auth.uid())
  );

-- ── TRIGGER: auto-create profile on signup ────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── SEED DATA (משפחת לוי לדמו) ────────────────────────────────
-- מחק את הבלוק הזה אחרי שיש לך משתמשים אמיתיים

INSERT INTO families (id, family_name, invite_code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'משפחת לוי', 'LEVI2025')
ON CONFLICT DO NOTHING;

INSERT INTO family_members (family_id, first_name, last_name, side_of_family, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'אבי',   'לוי',      'אבא',        '052-1111111'),
  ('00000000-0000-0000-0000-000000000001', 'יעל',   'לוי',      'אמא',        '052-2222222'),
  ('00000000-0000-0000-0000-000000000001', 'נועה',  'לוי-כהן',  'אבא',        '052-3333333'),
  ('00000000-0000-0000-0000-000000000001', 'רוני',  'לוי',      'אבא',        '052-4444444'),
  ('00000000-0000-0000-0000-000000000001', 'לאה',   'לוי',      'אמא',        '052-5555555'),
  ('00000000-0000-0000-0000-000000000001', 'יוסי',  'לוי',      'אמא',        '052-6666666'),
  ('00000000-0000-0000-0000-000000000001', 'דוד',   'לוי',      'אמא',        '052-7777777'),
  ('00000000-0000-0000-0000-000000000001', 'מיכל',  'לוי',      'אמא',        '052-8888888')
ON CONFLICT DO NOTHING;
