import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, BookOpen, Search, Copy, Check, Sun, Moon, Type, RefreshCw, Book } from 'lucide-react';
import { kitabStore, Kitab, Bab, SubBab } from '../lib/kitabStore';

// Dynamic height animator for smooth nested accordions
const SmoothCollapse: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, children, className = "" }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string | number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, children]);

  useEffect(() => {
    if (!isOpen) return;
    const resizeObserver = new ResizeObserver(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
      }
    });
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [isOpen]);

  return (
    <div
      style={{ 
        height, 
        transition: 'height 350ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-in-out',
        opacity: isOpen ? 1 : 0
      }}
      className={`overflow-hidden ${className}`}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export const KitabReader: React.FC = () => {
  const [kitabList, setKitabList] = useState<Kitab[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Accordion state (allows multiple open for comparison)
  const [openKitabIds, setOpenKitabIds] = useState<string[]>([]);
  const [openBabIds, setOpenBabIds] = useState<string[]>([]);
  const [openSubBabIds, setOpenSubBabIds] = useState<string[]>([]);

  // Text reading settings
  const [textMode, setTextMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('efawaaed_text_reader_theme') as 'light' | 'dark') || 'light';
  });
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('efawaaed_kitab_font_size');
    return saved ? parseInt(saved, 10) : 22; // default 22px
  });
  
  // Copy state tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await kitabStore.getAll();
    setKitabList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('efawaaed_text_reader_theme', textMode);
  }, [textMode]);

  useEffect(() => {
    localStorage.setItem('efawaaed_kitab_font_size', fontSize.toString());
  }, [fontSize]);

  const toggleKitab = (id: string) => {
    setOpenKitabIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleBab = (id: string) => {
    setOpenBabIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSubBab = (id: string) => {
    setOpenSubBabIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Expand all matched levels during search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const kitabsToOpen: string[] = [];
      const babsToOpen: string[] = [];
      const subBabsToOpen: string[] = [];

      kitabList.forEach(kitab => {
        let kitabMatch = kitab.nama.toLowerCase().includes(searchQuery.toLowerCase());
        let kitabHasBabMatch = false;

        kitab.bab.forEach(bab => {
          let babMatch = bab.nama.toLowerCase().includes(searchQuery.toLowerCase());
          let babHasSubMatch = false;

          bab.sub_bab.forEach(sb => {
            let sbMatch = sb.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sb.isi_teks.toLowerCase().includes(searchQuery.toLowerCase());
            if (sbMatch) {
              subBabsToOpen.push(sb.id);
              babHasSubMatch = true;
            }
          });

          if (babMatch || babHasSubMatch) {
            babsToOpen.push(bab.id);
            kitabHasBabMatch = true;
          }
        });

        if (kitabMatch || kitabHasBabMatch) {
          kitabsToOpen.push(kitab.id);
        }
      });

      setOpenKitabIds(kitabsToOpen);
      setOpenBabIds(babsToOpen);
      if (subBabsToOpen.length > 0) {
        setOpenSubBabIds(subBabsToOpen);
      }
    }
  }, [searchQuery, kitabList]);

  // Deep search/filtering
  const filteredKitabs = kitabList.map(kitab => {
    if (!searchQuery.trim()) return kitab;

    const matchingBabs = kitab.bab.map(bab => {
      const matchingSubBabs = bab.sub_bab.filter(sb => 
        sb.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sb.isi_teks.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const babMatches = bab.nama.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (babMatches || matchingSubBabs.length > 0) {
        return {
          ...bab,
          sub_bab: babMatches ? bab.sub_bab : matchingSubBabs
        };
      }
      return null;
    }).filter(Boolean) as Bab[];

    const kitabMatches = kitab.nama.toLowerCase().includes(searchQuery.toLowerCase());

    if (kitabMatches || matchingBabs.length > 0) {
      return {
        ...kitab,
        bab: kitabMatches ? kitab.bab : matchingBabs
      };
    }
    return null;
  }).filter(Boolean) as Kitab[];

  return (
    <div className="space-y-6">
      {/* Reader Controls Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-theme-light-mid/30 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-mid w-4 h-4" />
          <input
            type="text"
            placeholder="Cari nama kitab, bab, sub-bab, atau isi teks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-white border border-theme-light-mid/30 rounded-xl focus:outline-none focus:border-theme-mid transition-all text-sm text-theme-darkest placeholder-theme-mid/60 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-mid hover:text-theme-darkest text-xs font-bold bg-theme-light-mid/20 hover:bg-theme-light-mid/40 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Font & Theme Customizer */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Refresh Data */}
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-theme-light-mid/30 rounded-xl text-theme-mid hover:text-theme-darkest hover:bg-theme-lightest/50 transition-colors shadow-sm"
            title="Muat Ulang Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Font Sizer */}
          <div className="flex items-center bg-white border border-theme-light-mid/30 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setFontSize(s => Math.max(14, s - 2))} 
              className="px-2.5 py-1 text-xs font-bold text-theme-mid hover:text-theme-darkest rounded hover:bg-theme-lightest/50 transition-colors"
              title="Perkecil Ukuran Huruf"
            >
              A-
            </button>
            <span className="px-2 text-xs font-bold text-theme-darkest flex items-center gap-1 min-w-[50px] justify-center">
              <Type size={12} className="opacity-60" /> {fontSize}px
            </span>
            <button 
              onClick={() => setFontSize(s => Math.min(36, s + 2))} 
              className="px-2.5 py-1 text-xs font-bold text-theme-mid hover:text-theme-darkest rounded hover:bg-theme-lightest/50 transition-colors"
              title="Perbesar Ukuran Huruf"
            >
              A+
            </button>
          </div>

          {/* Specialized Theme Switcher */}
          <button
            onClick={() => setTextMode(m => m === 'light' ? 'dark' : 'light')}
            className="p-2.5 rounded-xl transition-all border flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            style={{
              backgroundColor: textMode === 'light' ? '#F5F0E8' : '#1C1C1C',
              borderColor: textMode === 'light' ? '#E0DACF' : '#333333',
              color: textMode === 'light' ? '#876445' : '#EEC373',
            }}
            title={textMode === 'light' ? 'Mode Gelap Teks' : 'Mode Terang Teks'}
          >
            {textMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </div>

      {/* Main Accordion Kitab Tree */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-theme-mid">
          <RefreshCw className="animate-spin w-8 h-8 text-theme-mid" />
          <p className="text-sm font-semibold tracking-wider">Memuat Pustaka Kitab...</p>
        </div>
      ) : filteredKitabs.length > 0 ? (
        <div className="space-y-4">
          {filteredKitabs.map((kitab) => {
            const isKitabOpen = openKitabIds.includes(kitab.id);
            
            return (
              <div 
                key={kitab.id} 
                className="bg-white rounded-2xl shadow-md border border-theme-light-mid/20 overflow-hidden hover:border-theme-light-mid/40 transition-colors"
              >
                {/* LEVEL 1: NAMA KITAB (Book Name) */}
                <button
                  onClick={() => toggleKitab(kitab.id)}
                  className={`w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer transition-colors ${isKitabOpen ? 'bg-theme-darkest text-theme-lightest' : 'bg-white hover:bg-theme-lightest/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isKitabOpen ? 'bg-theme-lightest/15 text-theme-lightest' : 'bg-theme-lightest text-theme-darkest'}`}>
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base md:text-lg tracking-wide">{kitab.nama}</h3>
                      <p className={`text-xs ${isKitabOpen ? 'text-theme-light-mid/80' : 'text-theme-mid'}`}>{kitab.bab.length} Bab Terdaftar</p>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`transition-transform duration-300 ${isKitabOpen ? 'rotate-180 text-theme-lightest' : 'text-theme-mid'}`} 
                    size={20}
                  />
                </button>

                {/* Kitab Collapse Body: Level 2 */}
                <SmoothCollapse isOpen={isKitabOpen}>
                  <div className="p-4 md:p-6 bg-theme-lightest/20 border-t border-theme-light-mid/10 space-y-3">
                    {kitab.bab.length > 0 ? (
                      kitab.bab.map((bab) => {
                        const isBabOpen = openBabIds.includes(bab.id);
                        
                        return (
                          <div 
                            key={bab.id} 
                            className="bg-white/80 backdrop-blur-sm rounded-xl border border-theme-light-mid/20 overflow-hidden shadow-sm hover:shadow transition-shadow"
                          >
                            {/* LEVEL 2: NAMA BAB (Chapter Name) */}
                            <button
                              onClick={() => toggleBab(bab.id)}
                              className={`w-full flex items-center justify-between p-4 text-left cursor-pointer transition-all ${isBabOpen ? 'bg-theme-mid/10 border-b border-theme-light-mid/20' : 'hover:bg-theme-lightest/45'}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-theme-mid rounded-full"></div>
                                <div>
                                  <h4 className="font-bold text-sm md:text-base text-theme-darkest">{bab.nama}</h4>
                                  <p className="text-[11px] text-theme-mid">{bab.sub_bab.length} Sub Bab</p>
                                </div>
                              </div>
                              <ChevronDown 
                                className={`text-theme-mid transition-transform duration-300 ${isBabOpen ? 'rotate-180' : ''}`} 
                                size={16}
                              />
                            </button>

                            {/* Bab Collapse Body: Level 3 */}
                            <SmoothCollapse isOpen={isBabOpen}>
                              <div className="p-3 bg-theme-lightest/10 space-y-2">
                                {bab.sub_bab.length > 0 ? (
                                  bab.sub_bab.map((subBab) => {
                                    const isSubBabOpen = openSubBabIds.includes(subBab.id);
                                    
                                    return (
                                      <div 
                                        key={subBab.id} 
                                        className="bg-white rounded-lg border border-theme-light-mid/15 overflow-hidden shadow-xs"
                                      >
                                        {/* LEVEL 3: NAMA SUB BAB (Sub Chapter) */}
                                        <button
                                          onClick={() => toggleSubBab(subBab.id)}
                                          className={`w-full flex items-center justify-between p-3.5 text-left cursor-pointer transition-all ${isSubBabOpen ? 'bg-theme-light-mid/10 border-b border-theme-light-mid/10' : 'hover:bg-theme-lightest/30'}`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Book size={14} className="text-theme-mid flex-shrink-0" />
                                            <h5 className="font-semibold text-xs md:text-sm text-theme-darkest leading-snug">{subBab.nama}</h5>
                                          </div>
                                          <ChevronDown 
                                            className={`text-theme-mid transition-transform duration-300 ${isSubBabOpen ? 'rotate-180' : ''}`} 
                                            size={14}
                                          />
                                        </button>

                                        {/* LEVEL 4: ISI TEKS ARAB (Arabic Text Content) */}
                                        <SmoothCollapse isOpen={isSubBabOpen}>
                                          <div 
                                            className="transition-colors duration-300 flex flex-col p-4 md:p-6"
                                            style={{ 
                                              backgroundColor: textMode === 'light' ? '#F5F0E8' : '#1C1C1C'
                                            }}
                                          >
                                            {/* Action bar for Copy & Feedback */}
                                            <div 
                                              className="flex justify-between items-center pb-3 mb-4 border-b text-xs select-none"
                                              style={{ 
                                                borderColor: textMode === 'light' ? 'rgba(135,100,69,0.15)' : 'rgba(255,255,255,0.08)',
                                                color: textMode === 'light' ? '#876445' : '#EEC373'
                                              }}
                                            >
                                              <span className="font-semibold tracking-wider opacity-60">Teks Arab (RTL)</span>
                                              <button
                                                onClick={() => handleCopyText(subBab.id, subBab.isi_teks)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-md font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95"
                                              >
                                                {copiedId === subBab.id ? (
                                                  <>
                                                    <Check size={12} className="text-green-500" />
                                                    <span className="text-green-500">Tersalin</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy size={12} />
                                                    <span>Salin</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>

                                            {/* Arabic Text Display */}
                                            <div 
                                              className="w-full max-w-[800px] mx-auto select-text focus:outline-none transition-colors"
                                              style={{ 
                                                direction: 'rtl',
                                                textAlign: 'right',
                                                fontFamily: "'Noto Naskh Arabic', serif",
                                                lineHeight: 2.0,
                                                fontSize: `${fontSize}px`,
                                                color: textMode === 'light' ? '#2C1810' : '#F5F0E8',
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap'
                                              }}
                                            >
                                              {subBab.isi_teks ? subBab.isi_teks : (
                                                <span className="italic opacity-40 text-sm font-sans tracking-normal">Belum ada isi teks Arab. Silahkan edit di Admin Panel.</span>
                                              )}
                                            </div>
                                          </div>
                                        </SmoothCollapse>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="text-center py-4 text-xs opacity-50 font-medium">Belum ada sub bab.</div>
                                )}
                              </div>
                            </SmoothCollapse>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-sm opacity-50 font-medium">Belum ada bab untuk kitab ini.</div>
                    )}
                  </div>
                </SmoothCollapse>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/50 border border-dashed border-theme-light-mid/30 rounded-2xl py-12 text-center text-theme-mid shadow-inner">
          <BookOpen className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <p className="font-semibold text-sm">Tidak ada hasil pencarian yang cocok.</p>
          <p className="text-xs opacity-75 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      )}
    </div>
  );
};
