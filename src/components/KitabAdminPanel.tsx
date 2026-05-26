import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, ChevronDown, Save, X, Book, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { kitabStore, Kitab, Bab, SubBab } from '../lib/kitabStore';

export const KitabAdminPanel: React.FC = () => {
  const [kitabList, setKitabList] = useState<Kitab[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dynamic form editor state
  const [editingType, setEditingType] = useState<'kitab' | 'bab' | 'sub_bab' | null>(null);
  const [actionType, setActionType] = useState<'add' | 'edit' | null>(null);
  
  // Selected IDs
  const [selectedKitab, setSelectedKitab] = useState<Kitab | null>(null);
  const [selectedBab, setSelectedBab] = useState<Bab | null>(null);
  const [selectedSubBab, setSelectedSubBab] = useState<SubBab | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [parentKitabId, setParentKitabId] = useState('');
  const [parentBabId, setParentBabId] = useState('');

  // UI Navigation toggles for tree view
  const [expandedKitabIds, setExpandedKitabIds] = useState<string[]>([]);
  const [expandedBabIds, setExpandedBabIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    const data = await kitabStore.getAll();
    setKitabList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpandKitab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKitabIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleExpandBab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedBabIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Trigger form setup
  const initAddKitab = () => {
    setEditingType('kitab');
    setActionType('add');
    setFormName('');
    setFormContent('');
    setSelectedKitab(null);
    setSelectedBab(null);
    setSelectedSubBab(null);
  };

  const initAddBab = (kitab: Kitab) => {
    setEditingType('bab');
    setActionType('add');
    setFormName('');
    setParentKitabId(kitab.id);
    setSelectedKitab(kitab);
    setSelectedBab(null);
    setSelectedSubBab(null);
  };

  const initAddSubBab = (kitab: Kitab, bab: Bab) => {
    setEditingType('sub_bab');
    setActionType('add');
    setFormName('');
    setFormContent('');
    setParentKitabId(kitab.id);
    setParentBabId(bab.id);
    setSelectedKitab(kitab);
    setSelectedBab(bab);
    setSelectedSubBab(null);
  };

  const initEditKitab = (kitab: Kitab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingType('kitab');
    setActionType('edit');
    setFormName(kitab.nama);
    setSelectedKitab(kitab);
    setSelectedBab(null);
    setSelectedSubBab(null);
  };

  const initEditBab = (kitab: Kitab, bab: Bab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingType('bab');
    setActionType('edit');
    setFormName(bab.nama);
    setParentKitabId(kitab.id);
    setSelectedKitab(kitab);
    setSelectedBab(bab);
    setSelectedSubBab(null);
  };

  const initEditSubBab = (kitab: Kitab, bab: Bab, subBab: SubBab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingType('sub_bab');
    setActionType('edit');
    setFormName(subBab.nama);
    setFormContent(subBab.isi_teks || '');
    setParentKitabId(kitab.id);
    setParentBabId(bab.id);
    setSelectedKitab(kitab);
    setSelectedBab(bab);
    setSelectedSubBab(subBab);
  };

  // CRUD Operations
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Nama tidak boleh kosong!");
      return;
    }

    setLoading(true);
    let success = false;

    try {
      if (editingType === 'kitab') {
        if (actionType === 'add') {
          const res = await kitabStore.addKitab(formName);
          success = !!res;
        } else if (actionType === 'edit' && selectedKitab) {
          success = await kitabStore.updateKitab(selectedKitab.id, formName);
        }
      } else if (editingType === 'bab') {
        if (actionType === 'add') {
          const res = await kitabStore.addBab(parentKitabId, formName);
          success = !!res;
        } else if (actionType === 'edit' && selectedBab) {
          success = await kitabStore.updateBab(selectedBab.id, formName);
        }
      } else if (editingType === 'sub_bab') {
        if (actionType === 'add') {
          const res = await kitabStore.addSubBab(parentBabId, formName, formContent);
          success = !!res;
        } else if (actionType === 'edit' && selectedSubBab) {
          success = await kitabStore.updateSubBab(selectedSubBab.id, formName, formContent);
        }
      }

      if (success) {
        // Reset state
        setEditingType(null);
        setActionType(null);
        setFormName('');
        setFormContent('');
        await loadData();
      } else {
        alert("Gagal menyimpan perubahan. Periksa koneksi data Supabase Anda.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
    setLoading(false);
  };

  const handleDelete = async (type: 'kitab' | 'bab' | 'sub_bab', id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${type.replace('_', ' ')} "${name}"?\nSemua data di bawahnya akan ikut terhapus.`)) {
      return;
    }

    setLoading(true);
    let success = false;

    try {
      if (type === 'kitab') {
        success = await kitabStore.deleteKitab(id);
      } else if (type === 'bab') {
        success = await kitabStore.deleteBab(id);
      } else if (type === 'sub_bab') {
        success = await kitabStore.deleteSubBab(id);
      }

      if (success) {
        // Reset form editor if deleting currently active form item
        if (
          (type === 'kitab' && selectedKitab?.id === id) ||
          (type === 'bab' && selectedBab?.id === id) ||
          (type === 'sub_bab' && selectedSubBab?.id === id)
        ) {
          setEditingType(null);
          setActionType(null);
        }
        await loadData();
      } else {
        alert("Gagal menghapus item.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan saat menghapus: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-stretch min-h-[60vh]">
      {/* LEFT COLUMN: Kitab Hierarchy Tree View */}
      <div className="flex-1 bg-white border border-theme-light-mid/30 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center pb-3 border-b border-theme-light-mid/20">
          <h4 className="font-bold text-lg text-theme-darkest flex items-center gap-2">
            <BookOpen size={18} className="text-theme-mid" />
            Daftar Struktur Kitab
          </h4>
          <div className="flex gap-2">
            <button 
              onClick={loadData} 
              className="p-1.5 hover:bg-theme-lightest text-theme-mid rounded-lg transition-colors border border-gray-100"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={initAddKitab}
              className="flex items-center gap-1 bg-theme-mid text-white px-3 py-1.5 rounded-lg hover:bg-theme-darkest transition-colors text-xs font-semibold"
            >
              <Plus size={14} /> Kitab Baru
            </button>
          </div>
        </div>

        {/* Tree Content Area */}
        <div className="flex-1 overflow-y-auto max-h-[70vh] pr-2 space-y-3 text-sm">
          {loading && kitabList.length === 0 ? (
            <div className="text-center py-10 opacity-60">Memuat data kitab...</div>
          ) : kitabList.length > 0 ? (
            kitabList.map((kitab) => {
              const isKitabExpanded = expandedKitabIds.includes(kitab.id);
              
              return (
                <div key={kitab.id} className="border border-theme-light-mid/10 rounded-xl overflow-hidden bg-theme-lightest/15">
                  {/* TREE LEVEL 1: KITAB */}
                  <div 
                    onClick={(e) => initEditKitab(kitab, e)}
                    className="flex justify-between items-center p-3 hover:bg-theme-light-mid/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 text-theme-darkest font-bold">
                      <button 
                        onClick={(e) => toggleExpandKitab(kitab.id, e)}
                        className="p-1 hover:bg-theme-light-mid/30 rounded text-theme-mid cursor-pointer"
                      >
                        {isKitabExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <BookOpen size={14} className="text-theme-mid" />
                      <span>{kitab.nama}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 opacity-65 hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); initAddBab(kitab); }}
                        className="p-1 text-theme-mid hover:bg-theme-mid hover:text-white rounded"
                        title="Tambah Bab Baru"
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={(e) => initEditKitab(kitab, e)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Kitab"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete('kitab', kitab.id, kitab.nama); }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Hapus Kitab"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* TREE LEVEL 2: BAB */}
                  {isKitabExpanded && (
                    <div className="pl-6 pr-3 pb-3 pt-1 border-t border-theme-light-mid/5 space-y-2 bg-white/40">
                      {kitab.bab.length > 0 ? (
                        kitab.bab.map((bab) => {
                          const isBabExpanded = expandedBabIds.includes(bab.id);
                          
                          return (
                            <div key={bab.id} className="border-l border-theme-light-mid/35 pl-3 py-1 space-y-1">
                              <div 
                                onClick={(e) => initEditBab(kitab, bab, e)}
                                className="flex justify-between items-center py-1.5 px-2 hover:bg-theme-light-mid/10 rounded cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-1.5 font-semibold text-theme-darkest/95">
                                  <button 
                                    onClick={(e) => toggleExpandBab(bab.id, e)}
                                    className="p-0.5 hover:bg-theme-light-mid/20 rounded text-theme-mid cursor-pointer"
                                  >
                                    {isBabExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  </button>
                                  <div className="w-1.5 h-3 bg-theme-mid/50 rounded-full"></div>
                                  <span>{bab.nama}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 opacity-65 hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); initAddSubBab(kitab, bab); }}
                                    className="p-0.5 text-theme-mid hover:bg-theme-mid hover:text-white rounded"
                                    title="Tambah Sub Bab Baru"
                                  >
                                    <Plus size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => initEditBab(kitab, bab, e)}
                                    className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Edit Bab"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete('bab', bab.id, bab.nama); }}
                                    className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Hapus Bab"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>

                              {/* TREE LEVEL 3: SUB BAB */}
                              {isBabExpanded && (
                                <div className="pl-6 py-1 space-y-1 bg-theme-lightest/5 rounded-r">
                                  {bab.sub_bab.length > 0 ? (
                                    bab.sub_bab.map((subBab) => {
                                      return (
                                        <div 
                                          key={subBab.id}
                                          onClick={(e) => initEditSubBab(kitab, bab, subBab, e)}
                                          className="flex justify-between items-center py-1.5 px-2 hover:bg-theme-light-mid/10 rounded cursor-pointer transition-colors text-xs text-theme-darkest/80"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <Book size={10} className="text-theme-mid/70" />
                                            <span className="font-medium truncate max-w-[150px]">{subBab.nama}</span>
                                            {subBab.isi_teks ? (
                                              <span className="text-[9px] bg-green-50 text-green-700 px-1 rounded flex items-center gap-0.5"><FileText size={8}/> isi</span>
                                            ) : (
                                              <span className="text-[9px] bg-yellow-50 text-yellow-700 px-1 rounded font-semibold italic">kosong</span>
                                            )}
                                          </div>

                                          {/* Actions */}
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={(e) => initEditSubBab(kitab, bab, subBab, e)}
                                              className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                              title="Edit Sub Bab & Teks"
                                            >
                                              <Edit2 size={10} />
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleDelete('sub_bab', subBab.id, subBab.nama); }}
                                              className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                              title="Hapus Sub Bab"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-[10px] text-theme-mid italic pl-2 py-1">Belum ada sub-bab</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-xs text-theme-mid italic py-2 pl-3">Belum ada bab terdaftar</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-theme-mid bg-theme-lightest/20 border border-dashed rounded-xl">
              Belum ada kitab terdaftar. Klik tombol <b>"Kitab Baru"</b> untuk mulai menambahkan data.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Form Editor (CRUD Form Actions) */}
      <div className="w-full xl:w-[480px] bg-white border border-theme-light-mid/30 rounded-2xl p-5 shadow-sm flex flex-col justify-start">
        {editingType ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-theme-light-mid/20">
              <h5 className="font-bold text-sm text-theme-darkest uppercase tracking-wider">
                {actionType === 'add' ? 'Tambah' : 'Edit'} {editingType.replace('_', ' ')}
              </h5>
              <button 
                type="button" 
                onClick={() => { setEditingType(null); setActionType(null); }}
                className="p-1 hover:bg-gray-100 rounded-full text-theme-mid hover:text-theme-darkest transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Parent Info Indicator */}
            {editingType !== 'kitab' && selectedKitab && (
              <div className="bg-theme-lightest/50 p-3 rounded-lg text-xs space-y-1 border border-theme-light-mid/10 text-theme-mid font-semibold">
                <div>Kitab Induk: <span className="text-theme-darkest font-bold">{selectedKitab.nama}</span></div>
                {editingType === 'sub_bab' && selectedBab && (
                  <div>Bab Induk: <span className="text-theme-darkest font-bold">{selectedBab.nama}</span></div>
                )}
              </div>
            )}

            {/* Input Name */}
            <div>
              <label className="block text-xs font-bold mb-1.5 opacity-70">
                Nama {editingType === 'kitab' ? 'Kitab' : editingType === 'bab' ? 'Bab' : 'Sub-Bab'}
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-theme-mid transition-colors bg-white/50 text-sm font-semibold"
                placeholder={`Masukkan Nama ${editingType.replace('_', ' ')}...`}
                required
              />
            </div>

            {/* RTL Text Editor Area for Sub-Bab Isi Teks */}
            {editingType === 'sub_bab' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold opacity-70 flex justify-between">
                  <span>Isi Teks Arab (RTL)</span>
                  <span className="text-theme-mid text-[10px] font-medium tracking-normal select-none">Mendukung Noto Naskh Arabic</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={14}
                  className="w-full border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-theme-mid bg-theme-lightest/10 text-right leading-relaxed focus:bg-white transition-colors"
                  style={{
                    direction: 'rtl',
                    textAlign: 'right',
                    fontFamily: "'Noto Naskh Arabic', serif",
                    lineHeight: 1.8,
                    fontSize: '18px',
                  }}
                  placeholder="اكتب النص العربي هنا..."
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-theme-light-mid/20 select-none">
              <button 
                type="button" 
                onClick={() => { setEditingType(null); setActionType(null); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-theme-mid hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-theme-mid hover:bg-theme-darkest text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Save size={13} />
                <span>Simpan</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="h-full flex flex-col justify-center items-center py-20 px-6 text-center border-2 border-dashed border-theme-light-mid/30 rounded-2xl bg-theme-lightest/5 text-theme-mid">
            <AlertCircle className="w-12 h-12 opacity-35 mb-3 text-theme-mid" />
            <h5 className="font-bold text-sm text-theme-darkest mb-1">Editor Siap</h5>
            <p className="text-xs leading-relaxed max-w-[280px]">
              Silakan pilih salah satu item dari bagan sebelah kiri untuk mengedit/menghapusnya, atau klik tombol <b>"+ Tambah"</b> untuk membuat item baru.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
