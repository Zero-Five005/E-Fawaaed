import { supabase } from './supabase';

export interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category?: 'Aqidah' | 'Fikih' | 'Adab' | 'Hadits' | 'Nahwu';
  pdfFile?: string; // base64 or Data URL
  txtContent?: string;
}

export interface AppData {
  heroImage: string | null;
  murojaahCards: CardItem[];
  mutholaahCards: CardItem[];
  produktifCards: CardItem[];
}

const defaultData: AppData = {
  heroImage: null,
  murojaahCards: [
    {
      id: 'm1',
      title: 'Modul Dasar Islam',
      description: 'Pelajaran fundamental tentang rukun iman dan islam.',
      txtContent: 'Ini adalah teks contoh untuk modul dasar. Silahkan admin mengunggah file TXT atau PDF.',
    }
  ],
  mutholaahCards: [
    {
      id: 'mt1',
      title: 'Kitab Tauhid',
      category: 'Aqidah',
      description: 'Membahas tentang keesaan Allah.',
    },
    {
      id: 'mt2',
      title: 'Safinatun Naja',
      category: 'Fikih',
      description: 'Fikih dasar mazhab Syafii.',
    }
  ],
  produktifCards: [],
};

const mapCardRowToCardItem = (row: any): CardItem => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  description: row.description,
  category: row.category as any,
  pdfFile: row.file_url,
  txtContent: row.txt_content,
});

export const store = {
  async getData(): Promise<AppData> {
    try {
      // Fetch settings
      const { data: settingsData } = await supabase.from('app_settings').select('*').eq('id', 1).single();
      
      // Fetch cards
      const { data: cardsData } = await supabase.from('cards').select('*').order('created_at', { ascending: true });
      
      if (!settingsData && !cardsData?.length) {
        return defaultData;
      }
      
      const heroImage = settingsData?.hero_image || null;
      const cards = cardsData || [];
      
      return {
        heroImage,
        murojaahCards: cards.filter(c => c.section === 'murojaah').map(mapCardRowToCardItem),
        mutholaahCards: cards.filter(c => c.section === 'mutholaah').map(mapCardRowToCardItem),
        produktifCards: cards.filter(c => c.section === 'produktif').map(mapCardRowToCardItem),
      };
    } catch (e) {
      console.error('Error fetching data from Supabase:', e);
      return defaultData;
    }
  },
  
  async saveData(data: AppData): Promise<void> {
    try {
      // Update settings
      await supabase.from('app_settings').upsert({ id: 1, hero_image: data.heroImage });

      // In a real robust system, we would carefully sync.
      // Here, to mirror localforage behavior simply: delete all existing and re-insert.
      const { error: delError } = await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
      
      const insertRows = [
        ...data.murojaahCards.map(c => ({
          // if id isn't UUID, let DB generate new UUID by omitting id
          section: 'murojaah',
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          category: c.category || null,
          file_url: c.pdfFile,
          txt_content: c.txtContent,
        })),
        ...data.mutholaahCards.map(c => ({
          section: 'mutholaah',
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          category: c.category || null,
          file_url: c.pdfFile,
          txt_content: c.txtContent,
        })),
        ...data.produktifCards.map(c => ({
          section: 'produktif',
          title: c.title,
          subtitle: c.subtitle,
          description: c.description,
          category: c.category || null,
          file_url: c.pdfFile,
          txt_content: c.txtContent,
        }))
      ];

      if (insertRows.length > 0) {
        await supabase.from('cards').insert(insertRows);
      }
    } catch (e) {
      console.error('Error saving data to Supabase:', e);
    }
  },

  async clearData(): Promise<void> {
    try {
      await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('app_settings').update({ hero_image: null }).eq('id', 1);
    } catch (e) {
      console.error('Error clearing data:', e);
    }
  }
};
