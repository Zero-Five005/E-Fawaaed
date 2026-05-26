import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Plus, Trash2, Edit2, FileText, Image as ImageIcon } from 'lucide-react';
import { store, AppData, CardItem } from '../lib/store';

interface AdminPanelProps {
  onClose: () => void;
  onDataUpdate: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onDataUpdate }) => {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'hero' | 'murojaah' | 'mutholaah' | 'produktif'>('murojaah');
  
  // Edit state
  const [editingCard, setEditingCard] = useState<CardItem | null>(null);

  useEffect(() => {
    store.getData().then(setData);
  }, []);

  const handleSaveData = async (newData: AppData) => {
    setData(newData);
    await store.saveData(newData);
    onDataUpdate();
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && data) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Gambar terlalu besar (Maks 5MB).");
        return;
      }
      try {
        const { uploadFile, supabase } = await import('../lib/supabase');
        // Pastikan login/auth ada
        const filename = `hero_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const publicUrl = await uploadFile(file, `images/${filename}`);
        handleSaveData({ ...data, heroImage: publicUrl });
      } catch (error: any) {
        alert("Gagal mengunggah gambar: " + error.message);
      }
    }
  };

  const handleDeleteCard = (listKey: keyof AppData, id: string) => {
    if (!data) return;
    if (confirm('Yakin ingin menghapus item ini?')) {
      const list = data[listKey] as CardItem[];
      handleSaveData({
        ...data,
        [listKey]: list.filter(item => item.id !== id)
      });
    }
  };

  const handleSaveCard = (listKey: keyof AppData, card: CardItem) => {
    if (!data) return;
    const list = data[listKey] as CardItem[];
    const isNew = !list.find(c => c.id === card.id);
    
    handleSaveData({
      ...data,
      [listKey]: isNew ? [...list, card] : list.map(c => c.id === card.id ? card : c)
    });
    setEditingCard(null);
  };

  if (!data) return <div className="fixed inset-0 bg-white z-[200] flex justify-center items-center">Loading...</div>;

  return (
    <div className="fixed inset-0 bg-theme-lightest z-[200] flex flex-col md:flex-row overflow-hidden text-theme-darkest">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-theme-darkest text-theme-lightest p-6 flex flex-col gap-4 shadow-xl z-10 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold tracking-widest uppercase">Admin Panel</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full md:hidden">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-col gap-2">
          {[
            { id: 'hero', label: 'Tampilan Beranda (Gambar)' },
            { id: 'murojaah', label: "Muroja'ah (PDF & TXT)" },
            { id: 'mutholaah', label: "Muthola'ah (Area PDF)" },
            { id: 'produktif', label: "Produktif (Area TXT)" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-left p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-theme-lightest text-theme-darkest font-bold' : 'hover:bg-white/10'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-auto flex items-center justify-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-medium">
          Keluar Admin
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative">
        <div className="max-w-4xl mx-auto">
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold pb-2 border-b border-theme-light-mid/20">Gambar Kartu Beranda (Di Atas Headline)</h3>
              <p className="text-sm opacity-80 mb-4">Mendukung format JPEG atau PNG. Direkomendasikan rasio 4:3.</p>
              
              {data.heroImage && (
                <div className="relative w-64 aspect-[4/3] rounded-xl overflow-hidden border-2 border-theme-light-mid mb-4">
                  <img src={data.heroImage} alt="Hero" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => handleSaveData({...data, heroImage: null})}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div>
                <input type="file" accept="image/jpeg, background-image/png, image/png" id="hero-upload" className="hidden" onChange={handleHeroUpload} />
                <label htmlFor="hero-upload" className="inline-flex items-center gap-2 bg-theme-mid text-white px-6 py-3 rounded-xl cursor-pointer hover:bg-theme-darkest transition-colors font-medium">
                  <Upload size={18} /> Unggah Gambar Baru
                </label>
              </div>
            </div>
          )}

          {(activeTab === 'murojaah' || activeTab === 'mutholaah' || activeTab === 'produktif') && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-theme-light-mid/20">
                <h3 className="text-2xl font-bold">
                  {activeTab === 'murojaah' ? 'Kartu Modul Muroja\'ah' : 
                   activeTab === 'mutholaah' ? 'Kartu Kitab Muthola\'ah' : 
                   'Materi Produktif'}
                </h3>
                {!editingCard && (
                  <button 
                    onClick={() => setEditingCard({ id: Date.now().toString(), title: '', description: '' })}
                    className="flex items-center gap-2 bg-theme-mid text-white px-4 py-2 rounded-lg hover:bg-theme-darkest transition-colors text-sm font-medium"
                  >
                    <Plus size={16} /> Tambah Baru
                  </button>
                )}
              </div>

              {editingCard ? (
                <CardEditor 
                  card={editingCard} 
                  type={activeTab} 
                  onSave={(c) => handleSaveCard(activeTab + 'Cards' as keyof AppData, c)} 
                  onCancel={() => setEditingCard(null)} 
                  toBase64={toBase64}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(data[activeTab + 'Cards' as keyof AppData] as CardItem[]).map(card => (
                    <div key={card.id} className="bg-white border border-theme-light-mid/30 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                      <div>
                        {card.category && <span className="text-[10px] bg-theme-light-mid/30 text-theme-darkest px-2 py-1 rounded mb-2 inline-block font-bold">{card.category}</span>}
                        <h4 className="font-bold text-lg leading-tight">{card.title}</h4>
                        {card.subtitle && <h5 className="text-xs text-theme-mid font-medium mt-1">{card.subtitle}</h5>}
                      </div>
                      <p className="text-sm opacity-80 line-clamp-2">{card.description}</p>
                      
                      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-theme-light-mid/10 text-xs">
                        {card.pdfFile && <span className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded"><FileText size={12}/> PDF</span>}
                        {card.txtContent && <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded"><FileText size={12}/> TXT</span>}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setEditingCard(card)} className="flex-1 flex items-center justify-center gap-1 bg-theme-light-mid/20 hover:bg-theme-light-mid/40 py-2 rounded-lg transition-colors text-sm font-medium">
                          <Edit2 size={14}/> Edit
                        </button>
                        <button onClick={() => handleDeleteCard(activeTab + 'Cards' as keyof AppData, card.id)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </div>
                  ))}
                  {(data[activeTab + 'Cards' as keyof AppData] as CardItem[]).length === 0 && (
                     <div className="col-span-2 text-center py-10 opacity-50">Belum ada data. Silahkan tambah baru.</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CardEditor = ({ card, type, onSave, onCancel, toBase64 }: { card: CardItem, type: string, onSave: (c: CardItem) => void, onCancel: () => void, toBase64: any }) => {
  const [form, setForm] = useState(card);
  const [loading, setLoading] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLoading(true);
      try {
        const { uploadFile } = await import('../lib/supabase');
        const filename = `pdf_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const publicUrl = await uploadFile(file, `pdfs/${filename}`);
        setForm({ ...form, pdfFile: publicUrl });
      } catch (err: any) {
        alert("Gagal mengunggah file: " + err.message);
      }
      setLoading(false);
    }
  };

  const handleTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const text = await file.text();
      setForm({ ...form, txtContent: text });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-theme-light-mid/30 space-y-4">
      <div>
        <label className="block text-xs font-bold mb-1 opacity-70">Judul</label>
        <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-theme-mid transition-colors bg-white/50" placeholder="Masukkan Judul..." />
      </div>
      <div>
        <label className="block text-xs font-bold mb-1 opacity-70">Subjudul (Opsional)</label>
        <input value={form.subtitle || ''} onChange={e => setForm({...form, subtitle: e.target.value})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-theme-mid transition-colors bg-white/50" placeholder="Kategori atau subjudul kecil..." />
      </div>

      {type === 'mutholaah' && (
        <div>
           <label className="block text-xs font-bold mb-1 opacity-70">Kategori Kitab</label>
           <select value={form.category || 'Aqidah'} onChange={e => setForm({...form, category: e.target.value as any})} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-theme-mid transition-colors bg-white/50">
             {['Aqidah', 'Fikih', 'Adab', 'Hadits', 'Nahwu'].map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold mb-1 opacity-70">Deskripsi Singkat</label>
        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-theme-mid transition-colors bg-white/50" placeholder="Deskripsi materi..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-theme-light-mid/20">
        {(type === 'murojaah' || type === 'mutholaah') && (
           <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
             <h6 className="font-bold text-sm mb-2 text-red-800 flex items-center gap-2"><FileText size={16}/> File PDF</h6>
             {form.pdfFile ? (
               <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm">
                 <span className="text-xs font-medium truncate">File terunggah (Base64)</span>
                 <button onClick={() => setForm({...form, pdfFile: undefined})} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
               </div>
             ) : (
               <div>
                  <input type="file" accept="application/pdf" id="pdf-upload" className="hidden" onChange={handlePdfUpload} />
                  <label htmlFor="pdf-upload" className={`inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 text-sm rounded-lg cursor-pointer hover:bg-red-700 transition-colors ${loading ? 'opacity-50' : ''}`}>
                    <Upload size={14} /> {loading ? 'Mengunggah...' : 'Unggah PDF (Maks 5MB)'}
                  </label>
               </div>
             )}
           </div>
        )}

        {(type === 'murojaah' || type === 'produktif') && (
           <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <h6 className="font-bold text-sm mb-2 text-blue-800 flex items-center gap-2"><FileText size={16}/> Teks / TXT</h6>
             <div className="space-y-3">
               <div>
                  <input type="file" accept=".txt" id="txt-upload" className="hidden" onChange={handleTxtUpload} />
                  <label htmlFor="txt-upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 text-sm rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload size={14} /> Unggah File .TXT
                  </label>
               </div>
               <div className="text-xs text-center opacity-50 font-bold">- Atau ketik langsung -</div>
               <textarea 
                  value={form.txtContent || ''} 
                  onChange={e => setForm({...form, txtContent: e.target.value})} 
                  rows={8} 
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" 
                  style={{ 
                    direction: 'rtl', 
                    textAlign: 'right', 
                    fontFamily: "'Noto Naskh Arabic', serif",
                    lineHeight: 1.6
                  }}
                  placeholder="Isi teks materi disini..."/>
             </div>
           </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-theme-light-mid/20">
        <button onClick={onCancel} className="px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">Batal</button>
        <button onClick={() => onSave(form)} disabled={!form.title} className="px-5 py-2 bg-theme-mid text-white rounded-lg font-medium hover:bg-theme-darkest transition-colors disabled:opacity-50">Simpan Perubahan</button>
      </div>
    </div>
  );
};
