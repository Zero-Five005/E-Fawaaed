import { supabase } from './supabase';

export interface SubBab {
  id: string;
  bab_id: string;
  nama: string;
  isi_teks: string;
  urutan: number;
}

export interface Bab {
  id: string;
  kitab_id: string;
  nama: string;
  urutan: number;
  sub_bab: SubBab[];
}

export interface Kitab {
  id: string;
  card_id?: string | null;
  nama: string;
  urutan: number;
  bab: Bab[];
}

export const kitabStore = {
  async getAll(): Promise<Kitab[]> {
    try {
      const { data: kitabData } = await supabase
        .from('kitab').select('*').order('urutan');
      const { data: babData } = await supabase
        .from('bab').select('*').order('urutan');
      const { data: subBabData } = await supabase
        .from('sub_bab').select('*').order('urutan');

      if (!kitabData) return [];
      const babs = babData || [];
      const subBabs = subBabData || [];

      return kitabData.map(k => ({
        id: k.id,
        card_id: k.card_id,
        nama: k.nama,
        urutan: k.urutan ?? 0,
        bab: babs.filter(b => b.kitab_id === k.id).map(b => ({
          id: b.id,
          kitab_id: b.kitab_id,
          nama: b.nama,
          urutan: b.urutan ?? 0,
          sub_bab: subBabs.filter(sb => sb.bab_id === b.id).map(sb => ({
            id: sb.id,
            bab_id: sb.bab_id,
            nama: sb.nama,
            isi_teks: sb.isi_teks || '',
            urutan: sb.urutan ?? 0,
          })),
        })),
      }));
    } catch (e) {
      console.error('Error fetching kitab data:', e);
      return [];
    }
  },

  async getByCardId(cardId: string): Promise<Kitab | null> {
    try {
      const { data: kitabData } = await supabase
        .from('kitab').select('*').eq('card_id', cardId).maybeSingle();
      
      if (!kitabData) return null;

      const { data: babData } = await supabase
        .from('bab').select('*').eq('kitab_id', kitabData.id).order('urutan');
      
      const babIds = babData ? babData.map(b => b.id) : [];
      let subBabData: any[] = [];
      
      if (babIds.length > 0) {
        const { data } = await supabase
          .from('sub_bab').select('*').in('bab_id', babIds).order('urutan');
        subBabData = data || [];
      }

      const babs = babData || [];

      return {
        id: kitabData.id,
        card_id: kitabData.card_id,
        nama: kitabData.nama,
        urutan: kitabData.urutan ?? 0,
        bab: babs.map(b => ({
          id: b.id,
          kitab_id: b.kitab_id,
          nama: b.nama,
          urutan: b.urutan ?? 0,
          sub_bab: subBabData.filter(sb => sb.bab_id === b.id).map(sb => ({
            id: sb.id,
            bab_id: sb.bab_id,
            nama: sb.nama,
            isi_teks: sb.isi_teks || '',
            urutan: sb.urutan ?? 0,
          })),
        })),
      };
    } catch (e) {
      console.error('Error fetching kitab by cardId:', e);
      return null;
    }
  },

  // Kitab CRUD
  async addKitab(nama: string, card_id?: string | null): Promise<Kitab | null> {
    const { data, error } = await supabase.from('kitab').insert({ nama, card_id: card_id || null }).select().single();
    if (error || !data) return null;
    return { id: data.id, card_id: data.card_id, nama: data.nama, urutan: data.urutan ?? 0, bab: [] };
  },
  async updateKitab(id: string, nama: string, card_id?: string | null) {
    const { error } = await supabase.from('kitab').update({ nama, card_id: card_id || null }).eq('id', id);
    return !error;
  },
  async deleteKitab(id: string) {
    const { error } = await supabase.from('kitab').delete().eq('id', id);
    return !error;
  },
  async updateKitabUrutan(id: string, urutan: number) {
    const { error } = await supabase.from('kitab').update({ urutan }).eq('id', id);
    return !error;
  },

  // Bab CRUD
  async addBab(kitab_id: string, nama: string): Promise<Bab | null> {
    const { data, error } = await supabase.from('bab').insert({ kitab_id, nama }).select().single();
    if (error || !data) return null;
    return { id: data.id, kitab_id: data.kitab_id, nama: data.nama, urutan: data.urutan ?? 0, sub_bab: [] };
  },
  async updateBab(id: string, nama: string) {
    const { error } = await supabase.from('bab').update({ nama }).eq('id', id);
    return !error;
  },
  async deleteBab(id: string) {
    const { error } = await supabase.from('bab').delete().eq('id', id);
    return !error;
  },
  async updateBabUrutan(id: string, urutan: number) {
    const { error } = await supabase.from('bab').update({ urutan }).eq('id', id);
    return !error;
  },

  // SubBab CRUD
  async addSubBab(bab_id: string, nama: string, isi_teks: string): Promise<SubBab | null> {
    const { data, error } = await supabase.from('sub_bab').insert({ bab_id, nama, isi_teks }).select().single();
    if (error || !data) return null;
    return { id: data.id, bab_id: data.bab_id, nama: data.nama, isi_teks: data.isi_teks || '', urutan: data.urutan ?? 0 };
  },
  async updateSubBab(id: string, nama: string, isi_teks: string) {
    const { error } = await supabase.from('sub_bab').update({ nama, isi_teks }).eq('id', id);
    return !error;
  },
  async deleteSubBab(id: string) {
    const { error } = await supabase.from('sub_bab').delete().eq('id', id);
    return !error;
  },
  async updateSubBabUrutan(id: string, urutan: number) {
    const { error } = await supabase.from('sub_bab').update({ urutan }).eq('id', id);
    return !error;
  },
};
