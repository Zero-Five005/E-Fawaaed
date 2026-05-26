import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, FileText, ChevronLeft, ChevronRight, Search, Sun, Moon } from 'lucide-react';
import { CardItem } from '../lib/store';
import { KitabReader } from './KitabReader';
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

interface LazyPDFPageProps {
  pageNumber: number;
  width: number;
  renderTextLayer: boolean;
  renderAnnotationLayer: boolean;
}

const LazyPDFPage: React.FC<LazyPDFPageProps> = ({
  pageNumber,
  width,
  renderTextLayer,
  renderAnnotationLayer,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(1.414); // Default A4 aspect ratio

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: '800px 0px 800px 0px', // Pre-render 800px before/after viewport
        threshold: 0,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handlePageLoadSuccess = (page: any) => {
    if (page && page.width && page.height) {
      setAspectRatio(page.height / page.width);
    }
  };

  const calculatedHeight = width * aspectRatio;

  return (
    <div 
      ref={containerRef} 
      className="shadow-2xl ring-1 ring-gray-900/5 bg-white mb-8 transition-opacity duration-300 relative shrink-0"
      style={{ 
        width: `${width}px`, 
        height: `${calculatedHeight}px`,
      }}
    >
      {isVisible ? (
        <Page 
          pageNumber={pageNumber} 
          width={width}
          renderTextLayer={renderTextLayer}
          renderAnnotationLayer={renderAnnotationLayer}
          onLoadSuccess={handlePageLoadSuccess}
          loading={
            <div 
              className="flex items-center justify-center bg-gray-50 text-gray-400 text-xs font-semibold animate-pulse absolute inset-0"
              style={{ height: `${calculatedHeight}px` }}
            >
              Memuat Halaman {pageNumber}...
            </div>
          }
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-gray-50 text-gray-400 text-xs font-semibold absolute inset-0"
          style={{ height: `${calculatedHeight}px` }}
        >
          Halaman {pageNumber}
        </div>
      )}
    </div>
  );
};

export const ReaderOverlay: React.FC<ReaderOverlayProps> = ({ card, onClose, pdfOnly = false }) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'txt'>(pdfOnly ? 'pdf' : (card.pdfFile ? 'pdf' : 'txt'));
  
  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfMode, setPdfMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [pdfScale, setPdfScale] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<number>(1.414); // For book mode containing
  
  // TXT State
  const [searchQuery, setSearchQuery] = useState('');
  const [textMode, setTextMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('efawaaed_text_reader_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('efawaaed_text_reader_theme', textMode);
  }, [textMode]);

  // Container dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set initial dimensions
    setContainerWidth(containerRef.current.clientWidth);
    setContainerHeight(containerRef.current.clientHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeTab, pdfMode]); // Re-measure when tab or mode changes

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

  // TXT Paragraph rendering with high-quality styling
  const renderFormattedText = () => {
    if (!card.txtContent) return null;
    
    const paragraphs = card.txtContent.split(/\r?\n/);
    
    return paragraphs.map((para, pIndex) => {
      if (!para.trim()) {
        return <div key={pIndex} className="h-4" />;
      }

      let content: React.ReactNode = para;
      if (searchQuery) {
        const parts = para.split(new RegExp(`(${searchQuery})`, 'gi'));
        content = parts.map((part, index) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? 
            <mark key={index} className="bg-yellow-300 text-black px-1 rounded">{part}</mark> : part
        );
      }

      return (
        <p 
          key={pIndex} 
          className="mb-4 text-[18px] md:text-[22px] text-right font-arabic"
          style={{ 
            fontFamily: "'Noto Naskh Arabic', serif", 
            direction: 'rtl',
            lineHeight: 1.8
          }}
        >
          {content}
        </p>
      );
    });
  };

  // Calculate dynamic responsive page width
  const padding = containerWidth >= 768 ? 64 : 32;
  const maxAvailableWidth = containerWidth ? Math.max(280, containerWidth - padding) : 320;
  const maxAvailableHeight = containerHeight ? Math.max(300, containerHeight - padding) : 400;

  // In vertical mode, fit to width. In horizontal mode, fit to both (contain)
  const pageWidth = pdfMode === 'vertical'
    ? maxAvailableWidth
    : Math.min(maxAvailableWidth, maxAvailableHeight / aspectRatio);

  const handleBookPageLoadSuccess = (page: any) => {
    if (page && page.width && page.height) {
      setAspectRatio(page.height / page.width);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex justify-end">
      <div 
        className="w-full md:w-[85%] lg:w-[75%] h-full bg-theme-lightest shadow-2xl flex flex-col transform transition-transform duration-500 overflow-hidden"
        style={{ animation: 'slideInRight 0.4s ease-out forwards' }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
          
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
                      {pdfScale !== 1 && (
                        <button 
                          onClick={() => setPdfScale(1)} 
                          className="px-2 py-1 text-xs bg-theme-lightest hover:bg-gray-200 text-theme-darkest border border-gray-300 rounded font-bold transition-all shadow-sm shrink-0"
                        >
                          Fit Layar
                        </button>
                      )}
                      <button onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold w-8 h-8 flex items-center justify-center shrink-0">-</button>
                      <span className="text-xs font-bold text-gray-600 w-12 text-center">{Math.round(pdfScale * 100)}%</span>
                      <button onClick={() => setPdfScale(s => Math.min(3, s + 0.2))} className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold w-8 h-8 flex items-center justify-center shrink-0">+</button>
                    </div>
                  </div>

                  {/* PDF Reader Container */}
                  <div 
                    ref={containerRef}
                    className={`flex-1 overflow-auto p-4 md:p-8 flex ${pdfMode === 'vertical' ? 'flex-col items-center' : 'justify-center items-center'} gap-6`}
                    style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
                  >
                    <Document
                      file={card.pdfFile}
                      onLoadSuccess={handleDocumentLoadSuccess}
                      className="flex flex-col items-center gap-6"
                      loading={<div className="p-10 animate-pulse text-gray-500 font-medium">Memuat dokumen PDF...</div>}
                    >
                      {pdfMode === 'vertical' ? (
                        Array.from(new Array(numPages), (el, index) => (
                          <LazyPDFPage 
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            width={pageWidth * pdfScale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                          />
                        ))
                      ) : (
                        <div className="relative shadow-2xl ring-1 ring-gray-900/5 bg-white transition-all overflow-hidden shrink-0">
                           <Page 
                            pageNumber={pageNumber} 
                            width={pageWidth * pdfScale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                            onLoadSuccess={handleBookPageLoadSuccess}
                          />
                        </div>
                      )}
                    </Document>
                  </div>

                  {/* Horizontal Pagination Controls (RTL Kitab Arab Style) */}
                  {pdfMode === 'horizontal' && numPages > 0 && (
                    <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center z-20 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      {/* Sisi Kiri: Tombol Selanjutnya (Halaman bertambah, melangkah ke kiri) */}
                      <button 
                        onClick={() => changePage(1)} 
                        disabled={pageNumber >= numPages}
                        className="flex items-center gap-2 bg-theme-darkest text-white px-5 py-2.5 rounded-xl disabled:opacity-50 hover:bg-theme-mid transition-all shadow-md font-medium"
                      >
                        <ChevronLeft size={20} /> Selanjutnya
                      </button>

                      {/* Tengah: Indikator Halaman */}
                      <span className="font-bold text-gray-700 bg-gray-100 px-4 py-2 rounded-lg text-sm border border-gray-200">
                        Halaman {pageNumber} dari {numPages}
                      </span>

                      {/* Sisi Kanan: Tombol Sebelumnya (Halaman berkurang, mundur ke kanan) */}
                      <button 
                        onClick={() => changePage(-1)} 
                        disabled={pageNumber <= 1}
                        className="flex items-center gap-2 bg-theme-darkest text-white px-5 py-2.5 rounded-xl disabled:opacity-50 hover:bg-theme-mid transition-all shadow-md font-medium"
                      >
                        Sebelumnya <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TXT VIEW */}
          {activeTab === 'txt' && (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <KitabReader cardId={card.id} fallbackText={card.txtContent} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
