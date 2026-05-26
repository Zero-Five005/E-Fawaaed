import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Copy, Check, Sun, Moon, Type, RefreshCw, Book, FileText, AlertCircle } from 'lucide-react';
import { kitabStore, Kitab, Bab, SubBab } from '../lib/kitabStore';

// Props to handle card-level nested accordion or fallback text rendering
interface KitabReaderProps {
  cardId?: string;
  fallbackText?: string;
}

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

export const KitabReader: React.FC<KitabReaderProps> = ({ cardId, fallbackText }) => {
  const [kitab, setKitab] = useState<Kitab | null>(null);
  const [kitabList, setKitabList] = useState<Kitab[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Accordion state
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
    if (cardId) {
      // Fetch specific Kitab mapped to this Muroja'ah Card
      const data = await kitabStore.getByCardId(cardId);
      setKitab(data);
    } else {
      // General viewer (if opened standalone)
      const data = await kitabStore.getAll();
      setKitabList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [cardId]);

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
      const babsToOpen: string[] = [];
      const subBabsToOpen: string[] = [];

      if (kitab) {
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
          }
        });
      } else {
        const kitabsToOpen: string[] = [];
        kitabList.forEach(k => {
          let kMatch = k.nama.toLowerCase().includes(searchQuery.toLowerCase());
          let kHasBabMatch = false;

          k.bab.forEach(bab => {
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
              kHasBabMatch = true;
            }
          });

          if (kMatch || kHasBabMatch) {
            kitabsToOpen.push(k.id);
          }
        });
        setOpenKitabIds(kitabsToOpen);
      }

      setOpenBabIds(babsToOpen);
      if (subBabsToOpen.length > 0) {
        setOpenSubBabIds(subBabsToOpen);
      }
    }
  }, [searchQuery, kitab, kitabList]);

  // Deep search/filtering for general list
  const filteredKitabs = kitabList.map(k => {
    if (!searchQuery.trim()) return k;

    const matchingBabs = k.bab.map(bab => {
      const matchingSubBabs = bab.sub_bab.filter(sb => 
        sb.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sb.isi_teks.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const babMatches = bab.nama.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (babMatches || matchingSubBabs.length > 0) {
        return { ...bab, sub_bab: babMatches ? bab.sub_bab : matchingSubBabs };
      }
      return null;
    }).filter(Boolean) as Bab[];

    const kMatches = k.nama.toLowerCase().includes(searchQuery.toLowerCase());
    if (kMatches || matchingBabs.length > 0) {
      return { ...k, bab: kMatches ? k.bab : matchingBabs };
    }
    return null;
  }).filter(Boolean) as Kitab[];

  // Filtering for specific single kitab
  const filteredBab = kitab ? kitab.bab.map(bab => {
    if (!searchQuery.trim()) return bab;
    
    const matchingSubBabs = bab.sub_bab.filter(sb => 
      sb.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sb.isi_teks.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const babMatches = bab.nama.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (babMatches || matchingSubBabs.length > 0) {
      return { ...bab, sub_bab: babMatches ? bab.sub_bab : matchingSubBabs };
    }
    return null;
  }).filter(Boolean) as Bab[] : [];

  // Flat text highlighter (for fallback mode)
  const renderFormattedFallbackText = (text: string) => {
    if (!text) return null;
    const paragraphs = text.split('\n');

    return paragraphs.map((p, index) => {
      if (!p.trim()) return <div key={index} className="h-4" />;
      
      // If there is a search query, highlight it
      if (searchQuery.trim().length > 1) {
        const regex = new RegExp(`(${searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        const parts = p.split(regex);
        return (
          <p 
            key={index} 
            className="mb-4"
            style={{ wordBreak: 'break-word' }}
          >
            {parts.map((part, i) => 
              regex.test(part) ? (
                <mark key={i} className="bg-yellow-200 text-black px-1 rounded font-semibold">{part}</mark>
              ) : part
            )}
          </p>
        );
      }

      return (
        <p 
          key={index} 
          className="mb-4"
          style={{ wordBreak: 'break-word' }}
        >
          {p}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* 1. Header Toolbar (Always displayed) */}
      <div 
        className="border-b transition-colors duration-300 p-3 md:p-4 shrink-0 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 z-10"
        style={{ 
          backgroundColor: textMode === 'light' ? '#EFEBE2' : '#252525', 
          borderColor: textMode === 'light' ? '#E0DACF' : '#333333' 
        }}
      >
        <h3 
          className="font-bold text-xs md:text-sm tracking-wide select-none"
          style={{ color: textMode === 'light' ? '#876445' : '#EEC373' }}
        >
          {kitab ? `Kitab: ${kitab.nama}` : 'Panel Baca Teks Arab'}
        </h3>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-xs md:max-w-md">
            <Search 
              size={14} 
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" 
              style={{ color: textMode === 'light' ? '#2C1810' : '#F5F0E8' }}
            />
            <input 
              type="text" 
              placeholder="Cari dalam teks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full py-1.5 pl-9 pr-8 text-xs outline-none border shadow-inner"
              style={{ 
                backgroundColor: textMode === 'light' ? '#FAF8F5' : '#1C1C1C', 
                color: textMode === 'light' ? '#2C1810' : '#F5F0E8',
                borderColor: textMode === 'light' ? '#E0DACF' : '#333333'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80 text-[10px] font-bold"
                style={{ color: textMode === 'light' ? '#2C1810' : '#F5F0E8' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Font controls */}
          <div 
            className="flex items-center border rounded-xl p-0.5"
            style={{ 
              borderColor: textMode === 'light' ? '#E0DACF' : '#333333',
              backgroundColor: textMode === 'light' ? '#FAF8F5' : '#1C1C1C' 
            }}
          >
            <button 
              onClick={() => setFontSize(s => Math.max(14, s - 2))} 
              className="px-2 py-0.5 text-[10px] font-bold cursor-pointer hover:opacity-80"
              style={{ color: textMode === 'light' ? '#2C1810' : '#F5F0E8' }}
              title="Perkecil Font"
            >
              A-
            </button>
            <span className="px-1.5 text-[10px] font-bold opacity-75 min-w-[32px] text-center" style={{ color: textMode === 'light' ? '#2C1810' : '#F5F0E8' }}>
              {fontSize}px
            </span>
            <button 
              onClick={() => setFontSize(s => Math.min(36, s + 2))} 
              className="px-2 py-0.5 text-[10px] font-bold cursor-pointer hover:opacity-80"
              style={{ color: textMode === 'light' ? '#2C1810' : '#F5F0E8' }}
              title="Perbesar Font"
            >
              A+
            </button>
          </div>

          {/* Theme switch button */}
          <button
            onClick={() => setTextMode(m => m === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
            style={{
              backgroundColor: textMode === 'light' ? '#FAF8F5' : '#1C1C1C',
              borderColor: textMode === 'light' ? '#E0DACF' : '#333333',
              color: textMode === 'light' ? '#876445' : '#EEC373',
            }}
            title={textMode === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
          >
            {textMode === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Content Display Workspace */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 transition-colors duration-300 w-full"
        style={{ 
          backgroundColor: textMode === 'light' ? '#F5F0E8' : '#1C1C1C'
        }}
      >
        <div className="max-w-[800px] mx-auto mb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin w-8 h-8 text-theme-mid" />
              <p className="text-xs font-semibold tracking-wider text-theme-mid">Menghubungkan Database...</p>
            </div>
          ) : (
            // A. SCENARIO 1: Structured Accordion Mapped to CardId
            kitab ? (
              filteredBab.length > 0 ? (
                <div className="space-y-3">
                  {filteredBab.map((bab) => {
                    const isBabOpen = openBabIds.includes(bab.id);
                    
                    return (
                      <div 
                        key={bab.id} 
                        className="rounded-xl border overflow-hidden shadow-xs transition-colors duration-300"
                        style={{
                          backgroundColor: textMode === 'light' ? '#FAF8F5' : '#222222',
                          borderColor: textMode === 'light' ? '#E3DCDE' : '#333333'
                        }}
                      >
                        {/* LEVEL 2: NAMA BAB (Rendered directly as Accordion Header) */}
                        <button
                          onClick={() => toggleBab(bab.id)}
                          className="w-full flex items-center justify-between p-4 text-left cursor-pointer transition-colors duration-300"
                          style={{
                            color: textMode === 'light' ? '#2C1810' : '#F5F0E8'
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-theme-mid rounded-full"></div>
                            <div>
                              <h4 className="font-bold text-sm md:text-base leading-snug">{bab.nama}</h4>
                              <p className="text-[10px] opacity-60 mt-0.5">{bab.sub_bab.length} Sub-bab terstruktur</p>
                            </div>
                          </div>
                          <ChevronDown 
                            className={`transition-transform duration-300 ${isBabOpen ? 'rotate-180' : ''}`} 
                            size={16}
                          />
                        </button>

                        {/* LEVEL 3 COLLAPSE: Sub Bab List */}
                        <SmoothCollapse isOpen={isBabOpen}>
                          <div className="p-3 space-y-2 bg-black/5 dark:bg-white/5 border-t border-theme-light-mid/10">
                            {bab.sub_bab.length > 0 ? (
                              bab.sub_bab.map((subBab) => {
                                const isSubBabOpen = openSubBabIds.includes(subBab.id);
                                
                                return (
                                  <div 
                                    key={subBab.id} 
                                    className="rounded-lg border overflow-hidden transition-colors"
                                    style={{
                                      backgroundColor: textMode === 'light' ? '#FAF8F5' : '#262626',
                                      borderColor: textMode === 'light' ? 'rgba(135,100,69,0.1)' : '#3C3C3C'
                                    }}
                                  >
                                    {/* LEVEL 3: NAMA SUB BAB */}
                                    <button
                                      onClick={() => toggleSubBab(subBab.id)}
                                      className="w-full flex items-center justify-between p-3 text-left cursor-pointer"
                                      style={{
                                        color: textMode === 'light' ? '#2C1810' : '#F5F0E8'
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Book size={13} className="opacity-60 flex-shrink-0" />
                                        <h5 className="font-bold text-xs md:text-sm leading-snug">{subBab.nama}</h5>
                                      </div>
                                      <ChevronDown 
                                        className={`transition-transform duration-300 ${isSubBabOpen ? 'rotate-180' : ''}`} 
                                        size={14}
                                      />
                                    </button>

                                    {/* LEVEL 4 COLLAPSE: Arabic Text display */}
                                    <SmoothCollapse isOpen={isSubBabOpen}>
                                      <div 
                                        className="p-4 md:p-5 border-t flex flex-col"
                                        style={{ 
                                          backgroundColor: textMode === 'light' ? '#F5F0E8' : '#1C1C1C',
                                          borderColor: textMode === 'light' ? 'rgba(135,100,69,0.15)' : '#333333'
                                        }}
                                      >
                                        {/* Copy Text & Actions */}
                                        <div 
                                          className="flex justify-between items-center pb-2.5 mb-3 border-b text-[10px]"
                                          style={{ 
                                            borderColor: textMode === 'light' ? 'rgba(135,100,69,0.15)' : 'rgba(255,255,255,0.06)',
                                            color: textMode === 'light' ? '#876445' : '#EEC373'
                                          }}
                                        >
                                          <span className="font-semibold tracking-wider opacity-60">Teks Arab (RTL)</span>
                                          <button
                                            onClick={() => handleCopyText(subBab.id, subBab.isi_teks)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-md font-bold transition-all shadow-xs cursor-pointer select-none active:scale-95 border border-transparent hover:border-theme-light-mid/20"
                                          >
                                            {copiedId === subBab.id ? (
                                              <>
                                                <Check size={11} className="text-green-500" />
                                                <span className="text-green-500">Tersalin</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy size={11} />
                                                <span>Salin Teks</span>
                                              </>
                                            )}
                                          </button>
                                        </div>

                                        {/* Content displaying with Noto Naskh Arabic */}
                                        <div 
                                          className="w-full select-text focus:outline-none transition-colors"
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
                                            <span className="italic opacity-35 text-xs font-sans tracking-normal">Belum ada isi teks Arab.</span>
                                          )}
                                        </div>
                                      </div>
                                    </SmoothCollapse>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center py-3 text-xs opacity-50 font-medium">Belum ada sub-bab.</div>
                            )}
                          </div>
                        </SmoothCollapse>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 opacity-50">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs">Hasil pencarian tidak ditemukan di kitab ini.</p>
                </div>
              )
            ) : 
            
            // B. SCENARIO 2: Fallback Flat Text (.txt) reader
            fallbackText ? (
              <div 
                className="w-full select-text transition-colors duration-300"
                style={{ 
                  direction: 'rtl',
                  textAlign: 'right',
                  fontFamily: "'Noto Naskh Arabic', serif",
                  lineHeight: 2.0,
                  fontSize: `${fontSize}px`,
                  color: textMode === 'light' ? '#2C1810' : '#F5F0E8'
                }}
              >
                {renderFormattedFallbackText(fallbackText)}
              </div>
            ) : (
              
              // C. SCENARIO 3: Empty State (No Kitab Structure and No Fallback Text)
              <div 
                className="text-center py-16 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 select-none"
                style={{
                  borderColor: textMode === 'light' ? 'rgba(135,100,69,0.2)' : '#333333',
                  color: textMode === 'light' ? '#876445' : '#888888'
                }}
              >
                <FileText className="w-12 h-12 opacity-40" />
                <h4 className="font-bold text-sm" style={{ color: textMode === 'light' ? '#2C1810' : '#F5F0E8' }}>Belum Ada Materi Teks</h4>
                <p className="text-xs max-w-xs leading-relaxed opacity-75">
                  Afwan, modul pembelajaran ini belum dilengkapi versi teks Arab ataupun struktur Kitab Kuning. Admin dapat menambahkannya via Admin Panel.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
