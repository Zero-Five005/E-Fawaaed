import localforage from 'localforage';

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

const STORE_KEY = 'efawaaed_data_store';

export const store = {
  async getData(): Promise<AppData> {
    const data = await localforage.getItem<AppData>(STORE_KEY);
    if (!data) {
      // Initialize with default
      await localforage.setItem(STORE_KEY, defaultData);
      return defaultData;
    }
    return data;
  },
  
  async saveData(data: AppData): Promise<void> {
    await localforage.setItem(STORE_KEY, data);
  },

  async clearData(): Promise<void> {
    await localforage.removeItem(STORE_KEY);
  }
};
