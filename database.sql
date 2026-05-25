-- SQL Structure for Supabase --

-- 1. Create a bucket for files
-- Silahkan buat bucket dengan nama 'uploads' di menu Storage Supabase
-- Pastikan bucket diset menjadi "Public" agar file bisa dibaca.

-- 2. Setup Schema & Tables
CREATE TABLE app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  hero_image TEXT
);
INSERT INTO app_settings (id, hero_image) VALUES (1, null);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(50) NOT NULL, -- 'murojaah', 'mutholaah', 'produktif'
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  category VARCHAR(100), -- 'Aqidah', 'Fikih', 'Adab', 'Hadits', 'Nahwu'
  file_url TEXT, -- URL file PDF/Image dari Storage
  txt_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE daily_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  date DATE NOT NULL,
  UNIQUE(device_id, date)
);

-- 3. Row Level Security (RLS)
-- Kita akan buat aturan sederhana:
-- * Semua orang bisa baca data dan upload file (untuk streak).
-- * Admin (Authenticated) bisa tambah/edit data.

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow auth all app_settings" ON app_settings FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read cards" ON cards FOR SELECT USING (true);
CREATE POLICY "Allow auth all cards" ON cards FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert daily_streaks" ON daily_streaks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read daily_streaks" ON daily_streaks FOR SELECT USING (true);

-- Dan untuk storage (Jalankan di SQL editor secara manual untuk bucket object Policy):
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Update/Delete" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
