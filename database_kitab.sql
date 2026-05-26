-- SQL Structure for Kitab, Bab, and Sub-Bab --

-- 1. Create tables with UUID primary keys and urutan column for custom sorting
CREATE TABLE kitab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(255) NOT NULL,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitab_id UUID REFERENCES kitab(id) ON DELETE CASCADE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  urutan INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sub_bab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bab_id UUID REFERENCES bab(id) ON DELETE CASCADE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  isi_teks TEXT DEFAULT '',
  urutan INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security (RLS)
-- Anyone can view the kitab, bab, and sub_bab data
-- Only authenticated users (Admin) can insert, update, or delete data

ALTER TABLE kitab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read kitab" ON kitab FOR SELECT USING (true);
CREATE POLICY "Allow auth all kitab" ON kitab FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE bab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read bab" ON bab FOR SELECT USING (true);
CREATE POLICY "Allow auth all bab" ON bab FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE sub_bab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read sub_bab" ON sub_bab FOR SELECT USING (true);
CREATE POLICY "Allow auth all sub_bab" ON sub_bab FOR ALL USING (auth.role() = 'authenticated');
