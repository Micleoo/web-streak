-- Run this script in your Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE users (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                   TEXT UNIQUE NOT NULL,
  username                TEXT UNIQUE CHECK (username ~ '^[a-zA-Z][a-zA-Z0-9_]{2,19}$'),
  avatar_url              TEXT,
  created_at              TIMESTAMPTZ DEFAULT now(),

  -- Streak System
  current_streak          INT DEFAULT 0 CHECK (current_streak >= 0),
  max_streak              INT DEFAULT 0 CHECK (max_streak >= 0),
  streak_at_risk          BOOLEAN DEFAULT false,
  grace_period_until      TIMESTAMPTZ,
  last_quest_completed_at TIMESTAMPTZ,

  total_xp                INT DEFAULT 0 CHECK (total_xp >= 0),
  favorite_categories     TEXT[] DEFAULT '{}'
);

-- 2. Create Quest Templates (reusable)
CREATE TABLE quests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'productivity',
  estimated_minutes INT DEFAULT 30,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Quest Completion Log (one row per completion)
CREATE TABLE quest_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id        UUID REFERENCES quests(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at    TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Achievements
CREATE TABLE achievements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- 5. Create Friends (mutual: every 2-way relation is stored as 2 rows)
CREATE TABLE friends (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- 6. Indices for Performance
CREATE INDEX idx_users_streak ON users(current_streak DESC, total_xp DESC);
CREATE INDEX idx_quest_completions_user ON quest_completions(user_id, completed_at DESC);
CREATE INDEX idx_friends_lookup ON friends(user_id, status);

-- 7. Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- User Policies
CREATE POLICY "user read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user update own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "public profile read" ON users FOR SELECT USING (username IS NOT NULL);

-- Quest Policies
CREATE POLICY "user read own quests" ON quests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user insert own quests" ON quests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user update own quests" ON quests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user delete own quests" ON quests FOR DELETE USING (auth.uid() = user_id);

-- Quest Completions Policies
CREATE POLICY "user read own completions" ON quest_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user insert own completions" ON quest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Trigger to automatically create a user profile when a user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
