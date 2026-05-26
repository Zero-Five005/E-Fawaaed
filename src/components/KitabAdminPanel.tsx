import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, ChevronDown, Save, X, Book, FileText, AlertCircle, RefreshCw, ArrowUp, ArrowDown, Link } from 'lucide-react';
import { kitabStore, Kitab, Bab, SubBab } from '../lib/kitabStore';
import { store, CardItem } from '../lib/store';

export const KitabAdminPanel: React.FC = () => {
  const [kitabList, setKitabList] = useState<Kitab[]>([]);
  const [murojaahCards, setMurojaahCards] = useState<CardItem[]>([]);
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
  const [formCardId, setFormCardId] = useState<string>(''); // For linking Muroja'ah Card
  const [parentKitabId, setParentKitabId] = useState('');
  const [parentBabId, setParentBabId] = useState('');

  // UI Navigation toggles for tree view
  const [expandedKitabIds, setExpandedKitabIds] = useState<string[]>([]);
  const [expandedBabIds, setExpandedBabIds] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    // Fetch Kitab structures from Supabase
    const data = await kitabStore.getAll();
    setKitabList(data);
    
    // Fetch Muroja'ah cards from local/Supabase store
    const appData = await store.getData();
    if (appData) {
      setMurojaahCards(appData.murojaahCards || []);
    }
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

  // Reordering: Swaps items instantly in state, then pushes to database asynchronously
  const handleMoveKitab = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= kitabList.length) return;

    const updatedList = [...kitabList];
    const temp = updatedList[index];
    updatedList[index] = updatedList[targetIndex];
    updatedList[targetIndex] = temp;

    // Reassign urutan
    updatedList.forEach((k, idx) => {
      k.urutan = idx;
    });

    setKitabList(updatedList);

    // Commit changes to Supabase in background
    await Promise.all(
      updatedList.map(k => kitabStore.updateKitabUrutan(k.id, k.urutan))
    );
  };

  const handleMoveBab = async (kitabId: string, index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const kitabIndex = kitabList.findIndex(k => k.id === kitabId);
    if (kitabIndex === -1) return;

    const babs = [...kitabList[kitabIndex].bab];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= babs.length) return;

    const temp = babs[index];
    babs[index] = babs[targetIndex];
    babs[targetIndex] = temp;

    babs.forEach((b, idx) => {
      b.urutan = idx;
    });

    const updatedList = [...kitabList];
    updatedList[kitabIndex].bab = babs;
    setKitabList(updatedList);

    await Promise.all(
      babs.map(b => kitabStore.updateBabUrutan(b.id, b.urutan))
    );
  };

  const handleMoveSubBab = async (kitabId: string, babId: string, index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const kitabIndex = kitabList.findIndex(k => k.id === kitabId);
    if (kitabIndex === -1) return;

    const babIndex = kitabList[kitabIndex].bab.findIndex(b => b.id === babId);
    if (babIndex === -1) return;

    const subBabs = [...kitabList[kitabIndex].bab[babIndex].sub_bab];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subBabs.length) return;

    const temp = subBabs[index];
    subBabs[index] = subBabs[targetIndex];
    subBabs[targetIndex] = temp;

    subBabs.forEach((sb, idx) => {
      sb.urutan = idx;
    });

    const updatedList = [...kitabList];
    updatedList[kitabIndex].bab[babIndex].sub_bab = subBabs;
    setKitabList(updatedList);

    await Promise.all(
      subBabs.map(sb => kitabStore.updateSubBabUrutan(sb.id, sb.urutan))
    );
  };

  // Trigger form setup
  const initAddKitab = () => {
    setEditingType('kitab');
    setActionType('add');
    setFormName('');
    setFormContent('');
    setFormCardId('');
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
    setFormCardId(kitab.card_id || '');
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
        const mappedCardId = formCardId === '' ? null : formCardId;
        if (actionType === 'add') {
          const res = await kitabStore.addKitab(formName, mappedCardId);
          success = !!res;
        } else if (actionType === 'edit' && selectedKitab) {
          success = await kitabStore.updateKitab(selectedKitab.id, formName, mappedCardId);
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
        setFormCardId('');
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
    <div className="flex flex-col xl:flex-row gap-6 items-stretch min-h-[60vh] select-none text-theme-darkest">
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
            kitabList.map((kitab, kIdx) => {
              const isKitabExpanded = expandedKitabIds.includes(kitab.id);
              const mappedCard = murojaahCards.find(c => c.id === kitab.card_id);
              
              return (
                <div key={kitab.id} className="border border-theme-light-mid/10 rounded-xl overflow-hidden bg-theme-lightest/15">
                  {/* TREE LEVEL 1: KITAB */}
                  <div 
                    onClick={(e) => initEditKitab(kitab, e)}
                    className="flex justify-between items-center p-3 hover:bg-theme-light-mid/10 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 text-theme-darkest font-bold flex-1 min-w-0">
                      <button 
                        onClick={(e) => toggleExpandKitab(kitab.id, e)}
                        className="p-1 hover:bg-theme-light-mid/30 rounded text-theme-mid cursor-pointer"
                      >
                        {isKitabExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <BookOpen size={14} className="text-theme-mid flex-shrink-0" />
                      <span className="truncate">{kitab.nama}</span>
                      
                      {mappedCard && (
                        <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-1 border border-blue-200">
                          <Link size={8} /> {mappedCard.title}
                        </span>
                      )}
                    </div>

                    {/* Reordering & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Sort arrows */}
                      <div className="flex items-center bg-gray-100 rounded px-0.5 border border-gray-200">
                        <button
                          disabled={kIdx === 0}
                          onClick={(e) => handleMoveKitab(kIdx, 'up', e)}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Pindahkan Ke Atas"
                        >
                          <ArrowUp size={11} />
                        </button>
                        <button
                          disabled={kIdx === kitabList.length - 1}
                          onClick={(e) => handleMoveKitab(kIdx, 'down', e)}
                          className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Pindahkan Ke Bawah"
                        >
                          <ArrowDown size={11} />
                        </button>
                      </div>

                      {/* CRUD Actions */}
                      <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
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
                  </div>

                  {/* TREE LEVEL 2: BAB */}
                  {isKitabExpanded && (
                    <div className="pl-5 pr-3 pb-3 pt-1 border-t border-theme-light-mid/5 space-y-2 bg-white/40">
                      {kitab.bab.length > 0 ? (
                        kitab.bab.map((bab, bIdx) => {
                          const isBabExpanded = expandedBabIds.includes(bab.id);
                          
                          return (
                            <div key={bab.id} className="border-l border-theme-light-mid/35 pl-3 py-1 space-y-1">
                              <div 
                                onClick={(e) => initEditBab(kitab, bab, e)}
                                className="flex justify-between items-center py-1.5 px-2 hover:bg-theme-light-mid/10 rounded cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-1.5 font-semibold text-theme-darkest/95 flex-1 min-w-0">
                                  <button 
                                    onClick={(e) => toggleExpandBab(bab.id, e)}
                                    className="p-0.5 hover:bg-theme-light-mid/20 rounded text-theme-mid cursor-pointer"
                                  >
                                    {isBabExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                  </button>
                                  <div className="w-1.5 h-3 bg-theme-mid/50 rounded-full shrink-0"></div>
                                  <span className="truncate">{bab.nama}</span>
                                </div>

                                {/* Reordering & Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center bg-gray-50 rounded border border-gray-150">
                                    <button
                                      disabled={bIdx === 0}
                                      onClick={(e) => handleMoveBab(kitab.id, bIdx, 'up', e)}
                                      className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                      <ArrowUp size={9} />
                                    </button>
                                    <button
                                      disabled={bIdx === kitab.bab.length - 1}
                                      onClick={(e) => handleMoveBab(kitab.id, bIdx, 'down', e)}
                                      className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                      <ArrowDown size={9} />
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); initAddSubBab(kitab, bab); }}
                                      className="p-0.5 text-theme-mid hover:bg-theme-mid hover:text-white rounded"
                                      title="Tambah Sub Bab"
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
                              </div>

                              {/* TREE LEVEL 3: SUB BAB */}
                              {isBabExpanded && (
                                <div className="pl-6 py-1 space-y-1 bg-theme-lightest/5 rounded-r">
                                  {bab.sub_bab.length > 0 ? (
                                    bab.sub_bab.map((subBab, sbIdx) => {
                                      return (
                                        <div 
                                          key={subBab.id}
                                          onClick={(e) => initEditSubBab(kitab, bab, subBab, e)}
                                          className="flex justify-between items-center py-1.5 px-2 hover:bg-theme-light-mid/10 rounded cursor-pointer transition-colors text-xs text-theme-darkest/80"
                                        >
                                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <Book size={10} className="text-theme-mid/70 flex-shrink-0" />
                                            <span className="font-medium truncate max-w-[120px]">{subBab.nama}</span>
                                            {subBab.isi_teks ? (
                                              <span className="text-[8px] bg-green-50 text-green-700 px-1 rounded flex items-center gap-0.5 shrink-0 border border-green-200"><FileText size={7}/> isi</span>
                                            ) : (
                                              <span className="text-[8px] bg-yellow-50 text-yellow-700 px-1 rounded font-semibold italic shrink-0 border border-yellow-200">kosong</span>
                                            )}
                                          </div>

                                          {/* Reordering & Actions */}
                                          <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center bg-gray-50/50 rounded">
                                              <button
                                                disabled={sbIdx === 0}
                                                onClick={(e) => handleMoveSubBab(kitab.id, bab.id, sbIdx, 'up', e)}
                                                className="p-0.5 hover:bg-gray-250 rounded disabled:opacity-30"
                                              >
                                                <ArrowUp size={8} />
                                              </button>
                                              <button
                                                disabled={sbIdx === bab.sub_bab.length - 1}
                                                onClick={(e) => handleMoveSubBab(kitab.id, bab.id, sbIdx, 'down', e)}
                                                className="p-0.5 hover:bg-gray-250 rounded disabled:opacity-30"
                                              >
                                                <ArrowDown size={8} />
                                              </button>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={(e) => initEditSubBab(kitab, bab, subBab, e)}
                                                className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                              >
                                                <Edit2 size={10} />
                                              </button>
                                              <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete('sub_bab', subBab.id, subBab.nama); }}
                                                className="p-0.5 text-red-500 hover:bg-red-50 rounded"
                                              >
                                                <Trash2 size={10} />
                                              </button>
                                            </div>
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-theme-mid transition-colors bg-white/50 text-sm font-semibold animate-pulse-once"
                placeholder={`Masukkan Nama ${editingType.replace('_', ' ')}...`}
                required
              />
            </div>

            {/* Muroja'ah Card Linkage Dropdown (Only for Kitab level) */}
            {editingType === 'kitab' && (
              <div>
                <label className="block text-xs font-bold mb-1.5 opacity-70">
                  Hubungkan dengan Modul Muroja'ah (Penting!)
                </label>
                <select
                  value={formCardId}
                  onChange={e => setFormCardId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-theme-mid transition-colors bg-white/50 text-sm font-semibold"
                >
                  <option value="">-- Jangan hubungkan dengan kartu apapun (Mandiri) --</option>
                  {murojaahCards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.title} {card.subtitle ? `(${card.subtitle})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-theme-mid mt-1 font-medium leading-relaxed">
                  Menghubungkan Kitab dengan Modul Muroja'ah akan otomatis mengganti kolom "Versi Teks" modul tersebut dengan tampilan accordion kitab berstruktur tingkat yang kita edit disini.
                </p>
              </div>
            )}

            {/* RTL Text Editor Area for Sub-Bab Isi Teks */}
            {editingType === 'sub_bab' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold opacity-70 flex justify-between">
                  <span>Isi Teks Arab (RTL)</span>
                  <span className="text-theme-mid text-[10px] font-medium tracking-normal">Noto Naskh Arabic</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={12}
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
