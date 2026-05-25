import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xgguwofpjiufdcustvvg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LeGwkdBQU0kkMGJh-8htVg_ElmI784u';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(path, file, { upsert: true });
    
  if (error) {
    throw error;
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(path);
    
  return publicUrlData.publicUrl;
};
