import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, FileText, ChevronLeft, ChevronRight, Search, Settings, Maximize2 } from 'lucide-react';
import { CardItem } from '../lib/store';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ReaderOverlayProps {
  card: CardItem;
  onClose: () => void;
  // If true, shows only PDF option (for Muthola'ah). If false, shows both (for Muroja'ah)
  pdfOnly?: boolean; 
}

export const ReaderOverlay: React.FC<ReaderOverlayProps> = ({ card, onClose, pdfOnly = false }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'txt'>(pdfOnly ? 'pdf' : (card.pdfFile ? 'pdf' : 'txt'));
  
  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfMode, setPdfMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [pdfScale, setPdfScale] = useState(1);
  
  // TXT State
  const [searchQuery, setSearchQuery] = useState('');

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPage = prevPageNumber + offset;
      if (newPage < 1) return 1;
      if (newPage > numPages) return numPages;
      return newPage;
    });
  };

  // TXT Highlighting logic
  const renderHighlightedText = () => {
    if (!card.txtContent) return null;
    if (!searchQuery) return card.txtContent;

    const parts = card.txtContent.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? 
        <mark key={index} className="bg-yellow-300 text-black px-1 rounded">{part}</mark> : part
    );
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex justify-end">
      <div 
        className="w-full md:w-[85%] lg:w-[75%] h-full bg-theme-lightest shadow-2xl flex flex-col transform transition-transform duration-500 overflow-hidden"
        style={{ animation: 'slideInRight 0.4s ease-out forwards' }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        
        {/* Header */}
        <div className="bg-theme-darkest text-theme-lightest p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-md z-20">
          <div>
            <div className="flex items-center gap-2 mb-1 opacity-70 text-xs font-bold uppercase tracking-widest">
              {card.category || 'Materi'}
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-tight line-clamp-1">{card.title}</h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {!pdfOnly && (
              <div className="flex bg-white/10 rounded-lg p-1 shrink-0">
                <button 
                  onClick={() => setActiveTab('pdf')} 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'pdf' ? 'bg-theme-lightest text-theme-darkest shadow-sm' : 'hover:bg-white/10'}`}
                >
                  <BookOpen size={16}/> Versi PDF
                </button>
                <button 
                  onClick={() => setActiveTab('txt')} 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'txt' ? 'bg-theme-lightest text-theme-darkest shadow-sm' : 'hover:bg-white/10'}`}
                >
                  <FileText size={16}/> Versi Teks
                </button>
              </div>
            )}
            
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500 hover:text-white rounded-lg transition-colors shrink-0 ml-auto sm:ml-0">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-100">
          
          {/* PDF VIEW */}
          {activeTab === 'pdf' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {!card.pdfFile ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-6">
                    <BookOpen size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Belum Tersedia</h3>
                  <p className="text-gray-500 max-w-md">Afwan, file PDF untuk materi ini masih dalam pengerjaan. {pdfOnly ? 'Silahkan cek kembali nanti.' : 'Silahkan gunakan versi Teks jika tersedia.'}</p>
                </div>
              ) : (
                <>
                  {/* PDF Toolbar */}
                  <div className="bg-white border-b border-gray-200 p-3 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setPdfMode('vertical')} 
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${pdfMode === 'vertical' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                        Scroll Vertikal
                      </button>
                      <button 
                        onClick={() => setPdfMode('horizontal')} 
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${pdfMode === 'horizontal' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                        Mode Buku (Balik Halaman)
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">-</button>
                      <span className="text-xs font-bold text-gray-600 w-12 text-center">{Math.round(pdfScale * 100)}%</span>
                      <button onClick={() => setPdfScale(s => Math.min(3, s + 0.2))} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold">+</button>
                    </div>
                  </div>

                  {/* PDF Reader Container */}
                  <div className={`flex-1 overflow-auto p-4 md:p-8 flex ${pdfMode === 'vertical' ? 'flex-col items-center' : 'justify-center items-center'} gap-6`}>
                    <Document
                      file={card.pdfFile}
                      onLoadSuccess={handleDocumentLoadSuccess}
                      className="flex flex-col items-center gap-6"
                      loading={<div className="p-10 animate-pulse text-gray-500 font-medium">Memuat dokumen PDF...</div>}
                    >
                      {pdfMode === 'vertical' ? (
                        Array.from(new Array(numPages), (el, index) => (
                          <div key={`page_${index + 1}`} className="shadow-2xl ring-1 ring-gray-900/5 bg-white mb-8">
                            <Page 
                              pageNumber={index + 1} 
                              scale={pdfScale}
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              className="max-w-full"
                            />
                          </div>
                        ))
                      ) : (
                        <div className="relative shadow-2xl ring-1 ring-gray-900/5 bg-white transition-all overflow-hidden">
                           <Page 
                            pageNumber={pageNumber} 
                            scale={pdfScale * 1.2} // Slightly larger for book mode
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                          />
                        </div>
                      )}
                    </Document>
                  </div>

                  {/* Horizontal Pagination Controls */}
                  {pdfMode === 'horizontal' && numPages > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4 flex justify-between items-center absolute bottom-0 left-0 right-0 z-20">
                      <button 
                        onClick={() => changePage(-1)} 
                        disabled={pageNumber <= 1}
                        className="flex items-center gap-2 bg-theme-darkest text-white px-5 py-2.5 rounded-xl disabled:opacity-50 hover:bg-theme-mid transition-all shadow-lg"
                      >
                        <ChevronLeft size={20} /> Sebelumnya
                      </button>
                      <span className="font-bold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">
                        Halaman {pageNumber} dari {numPages}
                      </span>
                      <button 
                        onClick={() => changePage(1)} 
                        disabled={pageNumber >= numPages}
                        className="flex items-center gap-2 bg-theme-darkest text-white px-5 py-2.5 rounded-xl disabled:opacity-50 hover:bg-theme-mid transition-all shadow-lg"
                      >
                        Selanjutnya <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TXT VIEW */}
          {activeTab === 'txt' && (
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[#FAF9F6]">
               {!card.txtContent ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-6">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">Belum Tersedia</h3>
                  <p className="text-gray-500 max-w-md">Afwan, file teks untuk materi ini belum ditambahkan oleh Admin.</p>
                </div>
               ) : (
                 <>
                  {/* Search Bar */}
                  <div className="bg-white border-b border-gray-200 p-3 md:p-4 shrink-0 shadow-sm flex items-center justify-between gap-4 z-10 sticky top-0">
                    <h3 className="font-bold text-gray-700 hidden md:block">Mode Membaca Teks</h3>
                    <div className="relative flex-1 max-w-md">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Cari kata di dalam teks..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-theme-mid focus:bg-white transition-all outline-none"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Text Content Container */}
                  <div className="flex-1 overflow-y-auto w-full flex justify-center p-4 md:p-10">
                    <div className="w-full max-w-3xl bg-white shadow-xl ring-1 ring-gray-900/5 rounded-2xl p-6 md:p-12 mb-20 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-serif">
                       {renderHighlightedText()}
                    </div>
                  </div>
                 </>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
