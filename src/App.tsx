/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Play, ChevronLeft, ChevronRight, BookOpen, Library, LayoutList, FileText, Mic, Book, Lock, Flame, Sunrise, Sun, Sunset, Moon, Leaf, Coffee, Waves, ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { store, AppData, CardItem } from './lib/store';
import { AdminPanel } from './components/AdminPanel';
import { ReaderOverlay } from './components/ReaderOverlay';

gsap.registerPlugin(TextPlugin, ScrollTrigger);

const getGreetingInfo = () => {
  const hour = new Date().getHours();
  if (hour >= 3 && hour < 12) return { text: 'Selamat Pagi', type: 'pagi' };
  if (hour >= 12 && hour < 15) return { text: 'Selamat Siang', type: 'siang' };
  if (hour >= 15 && hour < 18) return { text: 'Selamat Sore', type: 'sore' };
  return { text: 'Selamat Malam', type: 'malam' };
};

const GreetingIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'pagi': return <Sunrise className={`${className} text-[#E67E22]`} />;
    case 'siang': return <Sun className={`${className} text-[#F1C40F]`} />;
    case 'sore': return <Sunset className={`${className} text-[#D35400]`} />;
    case 'malam': return <Moon className={`${className} text-[#2C3E50]`} />;
    default: return <Sun className={`${className} text-[#F1C40F]`} />;
  }
};

const formatMasehi = (date: Date) => {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const ThemeToggle = ({ currentTheme, onThemeChange, className = "" }: { currentTheme: string, onThemeChange: (theme: 'default' | 'blue' | 'brown') => void, className?: string }) => {
  return (
    <div className={`flex items-center gap-1.5 p-1 bg-white/40 backdrop-blur-sm border border-theme-light-mid/20 rounded-full shadow-sm ${className}`}>
      <button 
        onClick={() => onThemeChange('default')}
        className={`p-2 rounded-full transition-all ${currentTheme === 'default' ? 'bg-theme-darkest text-theme-lightest shadow-md' : 'text-theme-darkest hover:bg-white/60'}`}
        title="Sage Green Theme"
      >
        <Leaf size={16} />
      </button>
      <button 
        onClick={() => onThemeChange('blue')}
        className={`p-2 rounded-full transition-all ${currentTheme === 'blue' ? 'bg-[#1B262C] text-[#BBE1FA] shadow-md' : 'text-theme-darkest hover:bg-white/60'}`}
        title="Ocean Blue Theme"
      >
        <Waves size={16} />
      </button>
      <button 
        onClick={() => onThemeChange('brown')}
        className={`p-2 rounded-full transition-all ${currentTheme === 'brown' ? 'bg-[#876445] text-[#F4DFBA] shadow-md' : 'text-theme-darkest hover:bg-white/60'}`}
        title="Brown Theme"
      >
        <Coffee size={16} />
      </button>
    </div>
  );
};

const hijriMonthsID = [
  'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir',
  'Rajab', 'Syaban', 'Ramadhan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah'
];

const formatHijriahLocal = (date: Date) => {
  return new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const CalendarPopup = ({ currentDate, setCurrentDate }: { currentDate: Date, setCurrentDate: (d: Date) => void }) => {
  const [hijriMapping, setHijriMapping] = useState<Record<number, string>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchMonth = async () => {
      try {
        const m = (currentDate.getMonth() + 1).toString();
        const y = currentDate.getFullYear();
        // Provides the full gregorian month calendar
        const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${m}/${y}`);
        const data = await res.json();
        
        if (data.code === 200 && isMounted) {
          const mapping: Record<number, string> = {};
          if (Array.isArray(data.data)) {
            data.data.forEach((dayData: any) => {
               const gDay = parseInt(dayData.gregorian.day, 10);
               mapping[gDay] = dayData.hijri.day;
            });
          }
          setHijriMapping(mapping);
        }
      } catch (e) {
         console.error(e);
      }
    }
    fetchMonth();
    return () => { isMounted = false; };
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };
  
  const { days, firstDay } = getDaysInMonth(currentDate);
  const blanks = Array(firstDay).fill(null);
  const monthDays = Array.from({length: days}, (_, i) => i + 1);
  
  return (
    <div className="absolute top-full right-0 md:-right-2 mt-2 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-theme-light-mid/30 w-72 md:w-80 z-50 cursor-default" onClick={(e) => e.stopPropagation()}>
       <div className="flex justify-between items-center mb-4 text-theme-darkest">
         <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); }} className="p-1 hover:bg-theme-lightest rounded-full transition-colors cursor-pointer text-theme-darkest">
           <ChevronLeft size={18} />
         </button>
         <div className="font-bold text-sm">
           {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentDate)}
         </div>
         <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); }} className="p-1 hover:bg-theme-lightest rounded-full transition-colors cursor-pointer text-theme-darkest">
           <ChevronRight size={18} />
         </button>
       </div>
       <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-2 text-theme-mid font-bold uppercase tracking-wider">
         {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <div key={d}>{d}</div>)}
       </div>
       <div className="grid grid-cols-7 gap-1">
         {blanks.map((_, i) => <div key={`blank-${i}`} className="p-1.5 md:p-2" />)}
         {monthDays.map(day => {
           const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
           const isToday = new Date().toDateString() === date.toDateString();
           // Use Aladhan mapping or fallback to Intl
           const hijriDay = hijriMapping[day] || new Intl.DateTimeFormat('id-ID-u-ca-islamic', { day: 'numeric' }).format(date);
           return (
             <div 
               key={day} 
               className={`p-1 md:p-1.5 rounded-xl flex flex-col items-center justify-center transition-colors ${
                 isToday 
                   ? 'bg-theme-darkest text-theme-lightest shadow-md shadow-theme-darkest/20' 
                   : 'hover:bg-theme-lightest text-theme-darkest'
               }`}
             >
               <span className="text-xs md:text-sm font-bold">{day}</span>
               <span className={`text-[8px] mt-[1px] font-medium leading-none ${isToday ? 'text-theme-light-mid' : 'text-theme-mid'}`}>{hijriDay}</span>
             </div>
           );
         })}
       </div>
       <div className="mt-3 pt-3 border-t border-theme-light-mid/20 text-[9px] md:text-[10px] text-center text-theme-mid font-medium flex justify-center items-center gap-2">
         <span className="w-2 h-2 rounded-full bg-theme-darkest inline-block"></span>
         Masehi (Besar) / Hijriah (Kecil)
       </div>
    </div>
  );
};

type MenuCardProps = { item: { id: string, title: string, desc: string }, idx: number, onClick: () => void };

const MenuCard: React.FC<MenuCardProps> = ({ item, idx, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cardRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2);
    const y = (e.clientY - top - height / 2) / (height / 2);
    
    gsap.to(cardRef.current, {
      rotateX: -y * 10,
      rotateY: x * 10,
      duration: 0.3,
      ease: "power2.out",
      transformPerspective: 1000,
      transformOrigin: "center"
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out"
    });
  };

  return (
    <div 
      style={{ perspective: 1000 }}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="cursor-pointer group menu-card-item opacity-0 translate-y-12"
    >
      <div 
        ref={cardRef}
        className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-theme-light-mid/30 group-hover:border-theme-mid/50 group-hover:shadow-lg transition-colors cursor-pointer flex flex-col items-start h-full"
      >
        <div className="w-12 h-12 bg-theme-lightest rounded-xl flex items-center justify-center mb-4 text-theme-darkest group-hover:scale-110 transition-transform">
          {idx === 0 && <BookOpen size={24} />}
          {idx === 1 && <Library size={24} />}
          {idx === 2 && <LayoutList size={24} />}
        </div>
        <h3 className="text-lg font-bold text-theme-darkest mb-2">{item.title}</h3>
        <p className="text-sm text-theme-mid/80 leading-relaxed">
          {item.desc}
        </p>
      </div>
    </div>
  );
};

const MutholaahAccordion = ({ data, onCardClick }: { data: CardItem[], onCardClick: (card: CardItem) => void }) => {
  const categories = ['Aqidah', 'Fikih', 'Adab', 'Hadits', 'Nahwu'];
  const [openIndex, setOpenIndex] = useState<number>(0);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    contentRefs.current.forEach((el, i) => {
      if (el) {
        if (i === openIndex) {
          gsap.to(el, { height: 'auto', opacity: 1, duration: 0.4, ease: "power2.out" });
        } else {
          gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: "power2.inOut" });
        }
      }
    });
  }, [openIndex]);

  return (
    <div className="flex flex-col gap-4">
      {categories.map((category, index) => {
        const categoryCards = data.filter(c => c.category === category);
        const isOpen = index === openIndex;
        
        return (
          <div key={category} className="bg-white rounded-2xl shadow-sm border border-theme-light-mid/20 overflow-hidden">
            <button 
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="w-full flex items-center justify-between p-5 md:p-6 bg-white hover:bg-theme-lightest/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isOpen ? 'bg-theme-darkest text-theme-lightest' : 'bg-theme-lightest text-theme-darkest'}`}>
                  <BookOpen size={20} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg text-theme-darkest">{category}</h3>
                  <p className="text-xs text-theme-mid">{categoryCards.length} Kitab</p>
                </div>
              </div>
              <ChevronDown 
                className={`text-theme-mid transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <div 
              ref={el => contentRefs.current[index] = el} 
              className="h-0 opacity-0 overflow-hidden"
            >
              <div className="p-5 md:p-6 pt-0 border-t border-theme-light-mid/20">
                {categoryCards.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {categoryCards.map(card => (
                      <div 
                        key={card.id} 
                        onClick={() => onCardClick(card)}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100/80 hover:border-theme-darkest/20 overflow-hidden group cursor-pointer flex flex-col"
                      >
                         <div className="h-28 md:h-36 bg-gradient-to-br from-theme-mid/10 to-theme-darkest/5 flex items-center justify-center p-4 relative">
                            <Book className="w-10 h-10 md:w-12 md:h-12 text-theme-darkest/40 group-hover:scale-110 transition-transform" />
                            {card.pdfFile && <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded">PDF</div>}
                         </div>
                         <div className="p-3 md:p-4 flex-1 flex flex-col">
                           <h3 className="font-bold text-theme-darkest text-xs md:text-sm line-clamp-2 mb-1">{card.title}</h3>
                           <p className="text-[10px] text-theme-mid line-clamp-2">{card.description}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-theme-mid text-sm relative mt-4">
                    Belum ada kitab di kategori ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('beranda');
  const [greetingInfo, setGreetingInfo] = useState({ text: '', type: 'pagi' });
  const [masehiDate, setMasehiDate] = useState('');
  const [hijriahDate, setHijriahDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [activePopup, setActivePopup] = useState<'none' | 'murojaah' | 'mutholaah' | 'produktif'>('none');
  const [showAdminPopup, setShowAdminPopup] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [theme, setTheme] = useState<'default' | 'blue' | 'brown'>(() => {
    return (localStorage.getItem('efawaaedTheme') as any) || 'default';
  });

  const [appData, setAppData] = useState<AppData | null>(null);
  const [activeReaderCard, setActiveReaderCard] = useState<{card: CardItem, category: 'murojaah' | 'mutholaah' | 'produktif'} | null>(null);

  const fetchAppData = async () => {
    const data = await store.getData();
    setAppData(data);
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  useEffect(() => {
    localStorage.setItem('efawaaedTheme', theme);
    document.documentElement.classList.remove('theme-blue', 'theme-brown');
    if (theme === 'blue') document.documentElement.classList.add('theme-blue');
    if (theme === 'brown') document.documentElement.classList.add('theme-brown');
  }, [theme]);

  useEffect(() => {
    let deviceId = localStorage.getItem('efawaaedDeviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('efawaaedDeviceId', deviceId);
    }

    const fetchStreak = async () => {
      import('./lib/supabase').then(async ({ supabase }) => {
        const { data } = await supabase.from('daily_streaks').select('*').eq('device_id', deviceId);
        if (data) {
          setStreakCount(data.length);
        }
      });
    };
    fetchStreak();
  }, []);

  const recordStreak = () => {
    const deviceId = localStorage.getItem('efawaaedDeviceId');
    if (!deviceId) return;

    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const today = d.toISOString().split('T')[0];

    import('./lib/supabase').then(async ({ supabase }) => {
      const { error } = await supabase.from('daily_streaks').insert({ device_id: deviceId, date: today });
      if (!error) {
        setStreakCount(prev => prev + 1);
      } else {
        const { data } = await supabase.from('daily_streaks').select('*').eq('device_id', deviceId);
        if (data) setStreakCount(data.length);
      }
    });
  };

  const handleRippleClick = (e: React.MouseEvent<HTMLButtonElement>, callback: () => void) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const wave = document.createElement('span');
    wave.style.position = 'absolute';
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
    wave.style.borderRadius = '50%';
    wave.style.pointerEvents = 'none';
    wave.style.transform = 'scale(0)';
    
    button.appendChild(wave);
    
    gsap.to(wave, {
      scale: 4,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => {
        wave.remove();
      }
    });

    setTimeout(callback, 200);
  };

  const handleCardClick = (id: string) => {
    setActivePopup(id as any);
    recordStreak();
  };

  const calendarRef = useRef<HTMLDivElement>(null);
  const mobileCalendarRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const imageCardRef = useRef<HTMLDivElement>(null);
  const menuCardsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headlineRef.current) {
        gsap.to(headlineRef.current, {
          duration: 3,
          text: "Menjadi lebih produktif\ndengan E-Fawaaed",
          ease: "none",
          delay: 0.5,
          onComplete: () => {
            if (imageCardRef.current) {
              gsap.to(imageCardRef.current, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 1.5,
                ease: "power3.out"
              });
            }
          }
        });
      }

      if (menuCardsContainerRef.current) {
        gsap.to(".menu-card-item", {
          scrollTrigger: {
            trigger: menuCardsContainerRef.current,
            start: "top 80%", // starts when the top of the container hits 80% of the viewport height
            toggleActions: "play none none reverse", // Play animation when scrolling down, reverse when scrolling up
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2, // Time between each card animation
          ease: "power3.out"
        });
      }

      gsap.fromTo('#tentang .bg-white\\/40',
        { y: 50, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: {
            trigger: '#tentang',
            start: "top 70%",
          }
        }
      );
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    setGreetingInfo(getGreetingInfo());
    const now = new Date();
    setMasehiDate(formatMasehi(now));

    // Calculate Hijri date: changes after Maghrib (approx 18:00)
    const hijriCalcDate = new Date(now);
    if (now.getHours() >= 18) {
      hijriCalcDate.setDate(hijriCalcDate.getDate() + 1);
    }
    
    setHijriahDate(formatHijriahLocal(hijriCalcDate)); // Fallback
    
    // Fetch precise Hijri date from Aladhan API
    const fetchHijri = async () => {
      try {
        const d = hijriCalcDate.getDate().toString().padStart(2, '0');
        const m = (hijriCalcDate.getMonth() + 1).toString().padStart(2, '0');
        const y = hijriCalcDate.getFullYear();
        const res = await fetch(`https://api.aladhan.com/v1/gToH?date=${d}-${m}-${y}`);
        const data = await res.json();
        
        if (data.code === 200) {
           const hijri = data.data.hijri;
           const monthName = hijriMonthsID[hijri.month.number - 1];
           
           setHijriahDate(`${hijri.day} ${monthName} ${hijri.year}`);
        }
      } catch (e) {
        console.error("Failed to fetch Hijri date", e);
      }
    };
    
    fetchHijri();
    
    const interval = setInterval(() => {
        setGreetingInfo(getGreetingInfo());
        const d = new Date();
        setMasehiDate(formatMasehi(d));
        
        // Also update Hijri date fallback in case time passes 18:00 while using app
        const hCalc = new Date(d);
        if (d.getHours() >= 18) {
          hCalc.setDate(hCalc.getDate() + 1);
        }
        setHijriahDate(formatHijriahLocal(hCalc));
        
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleCheck = (e: MouseEvent) => {
       const isDesktopClick = calendarRef.current?.contains(e.target as Node);
       const isMobileClick = mobileCalendarRef.current?.contains(e.target as Node);
       if (!isDesktopClick && !isMobileClick) {
          setShowCalendar(false);
       }
    };
    document.addEventListener('mousedown', handleCheck);
    return () => document.removeEventListener('mousedown', handleCheck);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['beranda', 'menu-utama', 'tentang'];
      const scrollPosition = window.scrollY + 200; // Offset for the fixed nav

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop,
        behavior: 'smooth'
      });
    }
    setMenuOpen(false);
  };

  const navItems = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'menu-utama', label: 'Menu Utama' },
    { id: 'tentang', label: 'Tentang' }
  ];

  return (
    <div className="min-h-screen bg-theme-lightest relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Grid Overlay */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-40"></div>

      {/* Fixed Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-12 py-4 md:py-8 bg-theme-lightest/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('beranda')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 640 640">
              <path fill="theme-darkest" d="M254.073990,463.882385 
              C247.115021,470.993530 242.438248,479.838684 235.959320,488.489014 
              C235.959320,479.520508 235.959320,471.571381 235.959320,466.044556 
              C238.243500,474.650879 229.803909,475.315063 222.721497,477.508636 
              C197.656509,485.271820 172.030273,490.029724 145.895432,492.131683 
              C143.740311,492.304993 141.567734,492.291565 139.403107,492.297119 
              C138.777100,492.298737 138.150497,492.063599 137.379288,491.329620 
              C171.890594,485.306091 204.801514,474.625641 236.473953,458.250000 
              C236.226425,458.699005 236.548599,458.394135 236.518631,458.128998 
              C234.671310,441.779663 244.647217,429.005463 249.610794,414.717865 
              C251.289383,409.886078 254.179504,405.492706 255.075226,400.165375 
              C253.363068,399.216736 251.709412,398.457458 250.235336,397.438446 
              C248.835876,396.471008 247.661316,395.172668 248.430618,393.234894 
              C249.117310,391.505157 250.512222,390.702301 252.351715,390.684540 
              C253.015839,390.678131 253.789291,390.536285 254.328629,390.814026 
              C260.564545,394.025330 262.207275,390.030396 264.622498,385.276459 
              C267.501526,379.609619 267.519897,374.651947 265.737701,368.654358 
              C256.447479,337.390076 258.962250,306.826538 272.401184,277.152130 
              C273.103119,275.602142 273.261719,273.535248 276.155365,272.488647 
              C273.468964,289.240326 275.048859,305.196198 280.737946,320.666809 
              C269.508270,257.521271 308.182495,222.008301 339.109528,204.788208 
              C334.428741,217.818130 331.594238,230.491226 332.190643,243.729599 
              C333.627136,236.947479 335.323425,230.248932 337.391846,223.639252 
              C339.539673,216.775604 342.584656,210.303894 345.629974,203.823502 
              C347.350739,200.161713 349.470886,196.934982 353.081757,194.702911 
              C367.563171,185.751038 382.593323,177.887161 398.331909,171.392563 
              C399.791565,170.790237 401.369446,170.474396 404.318665,169.605194 
              C398.392487,180.118134 393.123322,189.448105 392.007660,200.396332 
              C394.613922,195.620346 397.281372,190.876526 399.812836,186.061218 
              C404.140808,177.828720 410.867004,171.513321 416.937134,164.694763 
              C418.150146,163.332214 420.371521,162.697098 422.249054,162.122177 
              C446.723145,154.628204 471.558472,149.429947 497.365234,150.786835 
              C499.390442,150.893326 501.727264,150.103088 503.711731,152.499359 
              C498.399689,155.161407 492.883484,156.928223 487.909302,159.853119 
              C467.676697,171.750229 455.321838,189.621048 449.457336,211.889603 
              C447.377869,219.785782 443.362701,225.176849 436.788239,229.396500 
              C428.644989,234.623047 420.330383,239.431870 411.032898,242.366241 
              C421.909302,240.265472 432.175293,236.463791 442.337952,231.368973 
              C434.054504,254.281128 421.300354,274.213226 403.184204,290.263763 
              C385.197449,306.199615 364.982910,318.597656 341.217529,324.286743 
              C364.024200,321.777740 384.105682,312.743744 402.076294,298.332306 
              C402.016144,303.610474 399.752869,307.660461 397.839172,311.789764 
              C384.754974,340.022552 362.433441,358.221924 334.462341,370.482910 
              C319.009155,377.256714 302.674286,381.405945 286.933258,387.290192 
              C284.475220,388.209015 281.912079,388.846924 280.417542,391.503662 
              C276.981476,397.611633 277.231201,398.733826 283.454193,401.802521 
              C285.656769,402.888641 287.807220,404.241241 286.926208,407.061066 
              C286.114014,409.660675 283.892395,410.504456 281.279480,409.716187 
              C279.069550,409.049561 278.234863,410.363861 277.591522,412.021576 
              C273.919647,421.482910 268.991333,430.435486 265.997437,440.929596 
              C264.407928,450.359436 260.174683,457.613953 254.073990,463.882385 
              M385.500488,224.065384 
              C382.666199,226.638138 379.774933,229.151215 377.006348,231.792831 
              C348.039581,259.430939 323.386932,290.541290 302.735901,324.799194 
              C289.921875,346.056305 278.240356,367.935425 268.430328,390.765656 
              C267.808075,392.213776 266.079041,394.397400 268.727264,395.451965 
              C271.011505,396.361572 271.856323,394.095490 272.626862,392.495239 
              C275.587921,386.345734 278.446136,380.146820 281.361847,373.975372 
              C305.440582,323.009705 335.415771,276.082581 375.666687,236.180008 
              C380.886322,231.005539 385.948669,225.672455 391.083893,220.412842 
              C390.873749,220.201050 390.663605,219.989258 390.453461,219.777466 
              C388.971100,221.053574 387.488739,222.329666 385.500488,224.065384 
              M383.100372,254.242737 
              C382.032837,254.467514 380.746002,253.942368 379.611053,255.642426 
              C392.687653,255.955490 404.428894,252.191895 416.013519,247.695175 
              C405.438141,250.534805 394.673645,252.469116 383.100372,254.242737 
              M293.825043,269.185272 
              C292.754730,272.067719 291.387787,274.874634 291.582367,278.110687 
              C295.062622,266.147278 300.839874,255.246613 306.937531,244.482132 
              C301.400055,251.828537 296.909454,259.703186 293.825043,269.185272 
              M355.974426,206.967972 
              C355.949982,207.123627 355.869995,207.299927 355.917816,207.428741 
              C355.959595,207.541275 356.239624,207.686600 356.254028,207.670822 
              C359.091766,204.567902 361.915253,201.451935 364.739166,198.336380 
              C361.229553,200.478989 358.390900,203.197006 355.974426,206.967972 z"/>
              <path fill="theme-darkest" d="M254.041718,464.221497 
              C260.174683,457.613953 264.407928,450.359436 265.918335,441.299286 
              C295.638275,421.453583 322.976318,398.675903 352.880737,379.554626 
              C376.896912,364.198334 402.819031,354.429565 431.793945,354.835663 
              C443.388245,354.998169 454.588531,357.127380 464.986847,362.739258 
              C483.995483,372.998016 489.628967,393.679932 478.230530,412.065002 
              C469.647675,425.908630 456.816528,434.813568 442.523010,441.592255 
              C424.541168,450.120209 405.292664,453.816345 385.468536,454.632050 
              C385.048340,454.649323 384.612244,454.280457 383.552734,453.813995 
              C385.880127,452.312958 388.062958,452.061035 390.228851,451.618896 
              C410.454590,447.490204 429.902252,441.261230 446.902557,429.125519 
              C455.623047,422.900330 463.671692,415.777130 467.778839,405.474670 
              C472.181183,394.431793 468.446320,385.074951 457.802246,379.576508 
              C446.898560,373.943939 435.220886,373.934906 423.636383,375.944000 
              C403.000519,379.522827 384.428772,388.470612 366.657684,399.258820 
              C349.557465,409.639709 333.509155,421.580048 316.874664,432.650879 
              C298.395844,444.949249 279.040771,455.661987 258.938354,465.033173 
              C257.470886,465.717255 255.276703,468.305511 254.041718,464.221497 z"/>
              <path fill="theme-darkest" d="M460.533875,389.670532 
              C463.805511,393.486908 464.071228,397.526245 462.698547,401.704102 
              C458.946777,413.123016 443.769531,423.614563 431.696045,423.386047 
              C427.154266,423.300049 423.882111,421.522461 422.745087,417.010498 
              C421.118347,410.555328 416.615326,408.410461 410.545898,408.097748 
              C396.572754,407.377777 383.579407,411.626740 370.624969,415.951263 
              C356.540161,420.653137 343.052734,426.769287 329.920837,433.689819 
              C328.271606,434.558960 326.688568,435.972351 324.095520,435.439117 
              C326.281342,432.051636 329.652527,430.792725 332.462189,428.949768 
              C350.417206,417.172791 367.963318,404.718964 387.318848,395.219910 
              C401.790924,388.117493 416.875031,382.979645 433.085358,382.094055 
              C442.841278,381.561066 452.472748,382.265350 460.533875,389.670532 z"/>
            </svg>
            <span className="text-[12px] font-bold tracking-[0.25em] text-theme-mid uppercase">
              E-FAWAAED
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-theme-darkest/10 px-3 py-1.5 rounded-full" title="Daily Streak">
            <Flame size={16} className={streakCount > 0 ? "text-[#E67E22] fill-[#E67E22]" : "text-theme-darkest/40"} />
            <span className={`font-bold text-sm ${streakCount > 0 ? "text-[#E67E22]" : "text-theme-darkest/60"}`}>
              {streakCount}
            </span>
          </div>
        </div>

        {/* Desktop pill nav */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 bg-theme-darkest rounded-full px-2 py-1.5 items-center gap-1 shadow-xl">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`${
                activeSection === item.id 
                  ? 'bg-theme-lightest text-theme-darkest font-semibold' 
                  : 'text-theme-light-mid font-medium hover:text-theme-lightest'
              } text-xs px-5 py-2 rounded-full transition-colors whitespace-nowrap`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right side container */}
        <div className="flex items-center gap-4">
          {/* Desktop Greeting & Date (CTA Replacement) */}
          <div className="hidden md:flex flex-col items-end relative" ref={calendarRef}>
            <div className="flex items-center gap-2 mb-0.5">
              <GreetingIcon type={greetingInfo.type} className="w-5 h-5" />
              <div className="text-sm font-bold text-theme-darkest tracking-tight">{greetingInfo.text}!</div>
            </div>
            <div 
              onClick={() => setShowCalendar(!showCalendar)}
              className="mt-1 text-[10px] text-theme-mid flex flex-col xl:flex-row items-end xl:items-center cursor-pointer hover:bg-white/60 bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-xl xl:rounded-full transition-all border border-theme-light-mid/20 shadow-sm gap-0.5 xl:gap-0"
            >
              <span className="font-semibold whitespace-nowrap text-theme-darkest">{masehiDate}</span>
              <span className="hidden xl:inline mx-1.5 text-theme-darkest opacity-50 font-bold">/</span>
              <span className="font-semibold whitespace-nowrap italic xl:not-italic">{hijriahDate}</span>
            </div>
            {showCalendar && (
              <CalendarPopup currentDate={calendarDate} setCurrentDate={setCalendarDate} />
            )}
          </div>

          {/* Mobile hamburger */}
          <button 
            className="lg:hidden text-theme-darkest p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Desktop Right Side Navigation */}
      <div className="hidden lg:flex fixed top-0 right-0 h-full w-4 z-50 group hover:w-20 transition-all duration-300">
        <div className="absolute right-0 top-0 h-full w-20 translate-x-full group-hover:translate-x-0 bg-theme-lightest/95 backdrop-blur-md border-l border-theme-light-mid/20 shadow-2xl transition-transform duration-300 flex flex-col items-center py-32 gap-6">
          <div className="text-[10px] font-bold text-theme-darkest/50 uppercase tracking-widest whitespace-nowrap -rotate-90 mb-4 whitespace-nowrap">Tema</div>
          <ThemeToggle className="flex-col gap-4 !bg-transparent !shadow-none !border-none" currentTheme={theme} onThemeChange={setTheme} />
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 right-0 bg-theme-lightest pt-24 pb-8 px-5 shadow-2xl flex flex-col gap-1 rounded-b-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {
                  scrollToSection(item.id);
                  setMenuOpen(false);
                }}
                className={`${
                  activeSection === item.id ? 'text-theme-mid font-semibold' : 'text-theme-darkest font-medium'
                } text-base py-3 border-b border-theme-light-mid/20 text-left hover:text-theme-mid transition-colors`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Theme Toggle */}
            <div className="md:hidden mt-4 pt-4 border-t border-theme-light-mid/20 flex flex-col items-center">
              <ThemeToggle currentTheme={theme} onThemeChange={setTheme} />
            </div>

            {/* Mobile Greeting & Date (CTA Replacement) */}
            <div className="md:hidden mt-4 pt-4 border-t border-theme-light-mid/20 flex flex-col items-center relative" ref={mobileCalendarRef}>
              <div className="flex items-center gap-2.5 mb-3">
                <GreetingIcon type={greetingInfo.type} className="w-6 h-6 flex-shrink-0" />
                <div className="text-lg font-bold text-theme-darkest text-center tracking-tight">{greetingInfo.text}!</div>
              </div>
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-[11px] text-theme-mid flex flex-col sm:flex-row items-center justify-center cursor-pointer bg-black/5 px-4 py-3 rounded-xl w-full text-center hover:bg-black/10 transition-colors gap-1 sm:gap-0"
              >
                <span className="font-medium text-xs text-theme-darkest">{masehiDate}</span>
                <span className="hidden sm:inline mx-1.5 text-theme-darkest opacity-50 font-bold">/</span>
                <span className="font-semibold text-xs italic sm:not-italic">{hijriahDate}</span>
              </div>
              {showCalendar && (
                <div className="relative mt-2 w-full flex justify-center">
                   <CalendarPopup currentDate={calendarDate} setCurrentDate={setCalendarDate} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 w-full overflow-y-auto overflow-x-hidden">
        {/* Beranda section */}
        <section id="beranda" className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center pt-20 px-5 md:px-12">
          {/* Symmetric Accents */}
          <div className="hidden md:block absolute top-1/2 left-20 -translate-y-1/2 space-y-32 opacity-20">
            <div className="w-1 h-1 bg-theme-darkest rounded-full"></div>
            <div className="w-1 h-1 bg-theme-darkest rounded-full"></div>
            <div className="w-1 h-1 bg-theme-darkest rounded-full"></div>
          </div>
          <div className="hidden md:block absolute top-1/2 right-20 -translate-y-1/2 space-y-32 opacity-20">
            <div className="w-1 h-1 bg-theme-darkest rounded-full"></div>
            <div className="w-1 h-1 bg-theme-darkest rounded-full"></div>
            <div className="w-1 h-1 bg-theme-darkest rounded-full"></div>
          </div>

          {/* Hero text block - centered and positioned at the top */}
          <div className="relative z-50 flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Popup Image Card */}
            <div 
              ref={imageCardRef} 
              className="mb-8 md:mb-12 w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-theme-darkest/20 border-4 border-theme-light-mid/60 opacity-0 translate-y-8 scale-95 bg-white relative"
            >
              <img 
                src={appData?.heroImage || "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80&w=800"} 
                alt="Productivity Dashboard" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-theme-darkest/10 mix-blend-overlay"></div>
            </div>

            <div className="space-y-6">
              <h1 ref={headlineRef} className="text-3xl sm:text-4xl md:text-5xl font-bold text-theme-darkest leading-[1.1] tracking-tight min-h-[96px] md:min-h-[108px] whitespace-pre-line">
                
              </h1>
              <div className="flex items-center justify-center gap-4 sm:gap-6 pt-4">
                <button 
                  onClick={(e) => handleRippleClick(e, () => scrollToSection('menu-utama'))}
                  className="relative overflow-hidden bg-theme-darkest text-theme-lightest text-sm font-semibold px-8 py-3.5 sm:py-4 rounded-full hover:bg-theme-mid transition-all shadow-xl shadow-theme-darkest/10 transform hover:-translate-y-0.5"
                >
                  <span className="relative z-10">Ayo Mulai</span>
                </button>
                <button 
                  onClick={() => {
                    recordStreak();
                    window.open('https://www.mp3quran.net/eng', '_blank');
                  }}
                  className="flex items-center gap-2 text-theme-darkest text-sm font-semibold hover:text-theme-mid transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full border border-theme-mid/40 flex items-center justify-center group-hover:border-theme-mid transition-colors">
                    <Play size={12} className="fill-theme-darkest group-hover:fill-theme-mid transition-colors" />
                  </div>
                  Murottal
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative Elements to anchor the white space */}
          <div className="hidden sm:flex absolute bottom-8 md:bottom-16 left-1/2 -translate-x-1/2 flex-col items-center gap-4 opacity-30">
            <div className="w-[1px] h-16 md:h-24 bg-gradient-to-b from-theme-darkest to-transparent"></div>
          </div>
        </section>

        {/* Menu Utama section */}
        <section id="menu-utama" className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 px-5 md:px-12 bg-theme-lightest/50">
          <div className="max-w-4xl w-full mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-theme-darkest tracking-tight">Menu Utama</h2>
              <p className="text-theme-mid max-w-2xl mx-auto">Jelajahi berbagai fitur yang dirancang khusus untuk meningkatkan produktivitas harian Anda bersama E-Fawaaed.</p>
            </div>
            
            <div ref={menuCardsContainerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'murojaah', title: "Muroja'ah Pelajaran", desc: "Mengulang kembali pelajaran dan buku modul Islam." },
                { id: 'mutholaah', title: "Muthola'ah", desc: "Menambah wawasan dari koleksi buku yang belum dipelajari." },
                { id: 'produktif', title: "Menjadi Lebih Produktif", desc: "Alat dan materi untuk Bekal Imam dan Khutbah." }
              ].map((item, idx) => (
                <MenuCard 
                  key={idx} 
                  item={item} 
                  idx={idx} 
                  onClick={() => handleCardClick(item.id)} 
                />
              ))}
            </div>
          </div>
        </section>

        {/* Tentang section */}
        <section id="tentang" className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 px-5 md:px-12">
          <div className="max-w-4xl w-full mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-theme-darkest tracking-tight">Tentang E-Fawaaed</h2>
              <div className="w-20 h-1 bg-theme-light-mid mx-auto rounded-full"></div>
            </div>
            
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-theme-light-mid/20">
              <div className="space-y-6 text-theme-darkest leading-relaxed text-lg">
                <p>
                  E-Fawaaed hadir sebagai solusi terintegrasi untuk membantu Anda mengelola waktu, tugas, dan prioritas dengan lebih baik. Kami percaya bahwa produktivitas bukan tentang bekerja lebih keras, tetapi bekerja lebih cerdas.
                </p>
                <p>
                  Dengan antarmuka yang bersih dan fitur yang tepat sasaran, E-Fawaaed memungkinkan Anda untuk fokus pada apa yang benar-benar penting, mengurangi gangguan, dan mencapai tujuan dengan lebih terstruktur.
                </p>
                <div className="pt-6 mt-6 border-t border-theme-light-mid/20 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h4 className="text-2xl font-bold text-theme-mid mb-1">Terintegrasi</h4>
                    <p className="text-sm text-theme-darkest/70">Sistem yang saling terhubung</p>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-theme-mid mb-1">Intuitif</h4>
                    <p className="text-sm text-theme-darkest/70">Mudah untuk digunakan</p>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-theme-mid mb-1">Aman</h4>
                    <p className="text-sm text-theme-darkest/70">Privasi Anda terjaga</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full bg-theme-darkest text-theme-lightest py-10 px-5 md:px-12 rounded-t-[2.5rem] mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('beranda')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 640 640" className="opacity-90">
                <path fill="theme-lightest" d="M254.073990,463.882385 
                C247.115021,470.993530 242.438248,479.838684 235.959320,488.489014 
                C235.959320,479.520508 235.959320,471.571381 235.959320,466.044556 
                C238.243500,474.650879 229.803909,475.315063 222.721497,477.508636 
                C197.656509,485.271820 172.030273,490.029724 145.895432,492.131683 
                C143.740311,492.304993 141.567734,492.291565 139.403107,492.297119 
                C138.777100,492.298737 138.150497,492.063599 137.379288,491.329620 
                C171.890594,485.306091 204.801514,474.625641 236.473953,458.250000 
                C236.226425,458.699005 236.548599,458.394135 236.518631,458.128998 
                C234.671310,441.779663 244.647217,429.005463 249.610794,414.717865 
                C251.289383,409.886078 254.179504,405.492706 255.075226,400.165375 
                C253.363068,399.216736 251.709412,398.457458 250.235336,397.438446 
                C248.835876,396.471008 247.661316,395.172668 248.430618,393.234894 
                C249.117310,391.505157 250.512222,390.702301 252.351715,390.684540 
                C253.015839,390.678131 253.789291,390.536285 254.328629,390.814026 
                C260.564545,394.025330 262.207275,390.030396 264.622498,385.276459 
                C267.501526,379.609619 267.519897,374.651947 265.737701,368.654358 
                C256.447479,337.390076 258.962250,306.826538 272.401184,277.152130 
                C273.103119,275.602142 273.261719,273.535248 276.155365,272.488647 
                C273.468964,289.240326 275.048859,305.196198 280.737946,320.666809 
                C269.508270,257.521271 308.182495,222.008301 339.109528,204.788208 
                C334.428741,217.818130 331.594238,230.491226 332.190643,243.729599 
                C333.627136,236.947479 335.323425,230.248932 337.391846,223.639252 
                C339.539673,216.775604 342.584656,210.303894 345.629974,203.823502 
                C347.350739,200.161713 349.470886,196.934982 353.081757,194.702911 
                C367.563171,185.751038 382.593323,177.887161 398.331909,171.392563 
                C399.791565,170.790237 401.369446,170.474396 404.318665,169.605194 
                C398.392487,180.118134 393.123322,189.448105 392.007660,200.396332 
                C394.613922,195.620346 397.281372,190.876526 399.812836,186.061218 
                C404.140808,177.828720 410.867004,171.513321 416.937134,164.694763 
                C418.150146,163.332214 420.371521,162.697098 422.249054,162.122177 
                C446.723145,154.628204 471.558472,149.429947 497.365234,150.786835 
                C499.390442,150.893326 501.727264,150.103088 503.711731,152.499359 
                C498.399689,155.161407 492.883484,156.928223 487.909302,159.853119 
                C467.676697,171.750229 455.321838,189.621048 449.457336,211.889603 
                C447.377869,219.785782 443.362701,225.176849 436.788239,229.396500 
                C428.644989,234.623047 420.330383,239.431870 411.032898,242.366241 
                C421.909302,240.265472 432.175293,236.463791 442.337952,231.368973 
                C434.054504,254.281128 421.300354,274.213226 403.184204,290.263763 
                C385.197449,306.199615 364.982910,318.597656 341.217529,324.286743 
                C364.024200,321.777740 384.105682,312.743744 402.076294,298.332306 
                C402.016144,303.610474 399.752869,307.660461 397.839172,311.789764 
                C384.754974,340.022552 362.433441,358.221924 334.462341,370.482910 
                C319.009155,377.256714 302.674286,381.405945 286.933258,387.290192 
                C284.475220,388.209015 281.912079,388.846924 280.417542,391.503662 
                C276.981476,397.611633 277.231201,398.733826 283.454193,401.802521 
                C285.656769,402.888641 287.807220,404.241241 286.926208,407.061066 
                C286.114014,409.660675 283.892395,410.504456 281.279480,409.716187 
                C279.069550,409.049561 278.234863,410.363861 277.591522,412.021576 
                C273.919647,421.482910 268.991333,430.435486 265.997437,440.929596 
                C264.407928,450.359436 260.174683,457.613953 254.073990,463.882385 
                M385.500488,224.065384 
                C382.666199,226.638138 379.774933,229.151215 377.006348,231.792831 
                C348.039581,259.430939 323.386932,290.541290 302.735901,324.799194 
                C289.921875,346.056305 278.240356,367.935425 268.430328,390.765656 
                C267.808075,392.213776 266.079041,394.397400 268.727264,395.451965 
                C271.011505,396.361572 271.856323,394.095490 272.626862,392.495239 
                C275.587921,386.345734 278.446136,380.146820 281.361847,373.975372 
                C305.440582,323.009705 335.415771,276.082581 375.666687,236.180008 
                C380.886322,231.005539 385.948669,225.672455 391.083893,220.412842 
                C390.873749,220.201050 390.663605,219.989258 390.453461,219.777466 
                C388.971100,221.053574 387.488739,222.329666 385.500488,224.065384 
                M383.100372,254.242737 
                C382.032837,254.467514 380.746002,253.942368 379.611053,255.642426 
                C392.687653,255.955490 404.428894,252.191895 416.013519,247.695175 
                C405.438141,250.534805 394.673645,252.469116 383.100372,254.242737 
                M293.825043,269.185272 
                C292.754730,272.067719 291.387787,274.874634 291.582367,278.110687 
                C295.062622,266.147278 300.839874,255.246613 306.937531,244.482132 
                C301.400055,251.828537 296.909454,259.703186 293.825043,269.185272 
                M355.974426,206.967972 
                C355.949982,207.123627 355.869995,207.299927 355.917816,207.428741 
                C355.959595,207.541275 356.239624,207.686600 356.254028,207.670822 
                C359.091766,204.567902 361.915253,201.451935 364.739166,198.336380 
                C361.229553,200.478989 358.390900,203.197006 355.974426,206.967972 z"/>
                <path fill="theme-lightest" d="M254.041718,464.221497 
                C260.174683,457.613953 264.407928,450.359436 265.918335,441.299286 
                C295.638275,421.453583 322.976318,398.675903 352.880737,379.554626 
                C376.896912,364.198334 402.819031,354.429565 431.793945,354.835663 
                C443.388245,354.998169 454.588531,357.127380 464.986847,362.739258 
                C483.995483,372.998016 489.628967,393.679932 478.230530,412.065002 
                C469.647675,425.908630 456.816528,434.813568 442.523010,441.592255 
                C424.541168,450.120209 405.292664,453.816345 385.468536,454.632050 
                C385.048340,454.649323 384.612244,454.280457 383.552734,453.813995 
                C385.880127,452.312958 388.062958,452.061035 390.228851,451.618896 
                C410.454590,447.490204 429.902252,441.261230 446.902557,429.125519 
                C455.623047,422.900330 463.671692,415.777130 467.778839,405.474670 
                C472.181183,394.431793 468.446320,385.074951 457.802246,379.576508 
                C446.898560,373.943939 435.220886,373.934906 423.636383,375.944000 
                C403.000519,379.522827 384.428772,388.470612 366.657684,399.258820 
                C349.557465,409.639709 333.509155,421.580048 316.874664,432.650879 
                C298.395844,444.949249 279.040771,455.661987 258.938354,465.033173 
                C257.470886,465.717255 255.276703,468.305511 254.041718,464.221497 z"/>
                <path fill="theme-lightest" d="M460.533875,389.670532 
                C463.805511,393.486908 464.071228,397.526245 462.698547,401.704102 
                C458.946777,413.123016 443.769531,423.614563 431.696045,423.386047 
                C427.154266,423.300049 423.882111,421.522461 422.745087,417.010498 
                C421.118347,410.555328 416.615326,408.410461 410.545898,408.097748 
                C396.572754,407.377777 383.579407,411.626740 370.624969,415.951263 
                C356.540161,420.653137 343.052734,426.769287 329.920837,433.689819 
                C328.271606,434.558960 326.688568,435.972351 324.095520,435.439117 
                C326.281342,432.051636 329.652527,430.792725 332.462189,428.949768 
                C350.417206,417.172791 367.963318,404.718964 387.318848,395.219910 
                C401.790924,388.117493 416.875031,382.979645 433.085358,382.094055 
                C442.841278,381.561066 452.472748,382.265350 460.533875,389.670532 z"/>
              </svg>
              <span className="text-[12px] font-bold tracking-[0.25em] text-theme-lightest uppercase">
                E-FAWAAED
              </span>
            </div>

            {/* Center */}
            <div className="flex items-center gap-8 text-sm font-semibold">
              <button 
                onClick={() => setShowAdminPopup(true)}
                className="hover:text-theme-light-mid transition-colors"
              >
                Admin
              </button>
              <a 
                href="https://chat.whatsapp.com/Jf0phAMkHjJHDBHGWUnMYN" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-theme-light-mid transition-colors"
              >
                Komunitas
              </a>
            </div>

            {/* Right */}
            <div className="text-sm">
              Built by <a href="https://t.me/izz_005" target="_blank" rel="noopener noreferrer" className="text-theme-light-mid hover:text-white font-bold transition-colors">Faiz</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Popups / Views */}
      {activePopup !== 'none' && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
          
          {/* Muroja'ah Popup */}
          {activePopup === 'murojaah' && (
            <div className="bg-theme-lightest w-full max-w-4xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-theme-light-mid/30">
              <div className="px-6 py-4 md:px-8 md:py-6 border-b border-theme-light-mid/20 flex justify-between items-center bg-white/40 sticky top-0 z-10 backdrop-blur-md">
                <h2 className="text-xl md:text-2xl font-bold text-theme-darkest flex items-center gap-3">
                  <BookOpen className="text-theme-mid" />
                  Muroja'ah Pelajaran
                </h2>
                <button onClick={() => setActivePopup('none')} className="p-2 bg-white/50 hover:bg-white rounded-full text-theme-darkest transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <p className="text-theme-mid mb-6">Daftar buku modul pelajaran Islam untuk Anda ulang kembali.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {appData?.murojaahCards.map(card => (
                    <div 
                      key={card.id} 
                      onClick={() => setActiveReaderCard({ card, category: 'murojaah' })}
                      className="bg-white/60 p-5 rounded-2xl border border-theme-light-mid/30 hover:border-theme-mid transition-colors cursor-pointer group flex flex-col"
                    >
                      <div className="w-12 h-12 bg-theme-darkest/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-theme-darkest/20 transition-colors text-theme-darkest shrink-0">
                        <FileText size={24} />
                      </div>
                      <h3 className="font-bold text-theme-darkest mb-1 line-clamp-1">{card.title}</h3>
                      {card.subtitle && <p className="text-xs text-theme-mid mb-2 font-medium">{card.subtitle}</p>}
                      <p className="text-sm opacity-80 line-clamp-2 flex-1">{card.description}</p>
                      <div className="mt-4 pt-3 border-t border-theme-light-mid/10 flex gap-2">
                        {card.pdfFile && <span className="text-[10px] bg-red-100 text-red-800 px-2 py-1 rounded font-bold">PDF</span>}
                        {card.txtContent && <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">TXT</span>}
                      </div>
                    </div>
                  ))}
                  {appData?.murojaahCards.length === 0 && (
                    <div className="col-span-3 text-center py-10 opacity-50">Belum ada modul pelajaran. Admin belum mengunggah file.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Muthola'ah View */}
          {activePopup === 'mutholaah' && (
            <div className="bg-theme-lightest w-full h-[90vh] md:h-full rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
               <div className="bg-theme-darkest text-theme-lightest p-4 flex justify-between items-center shadow-md z-10">
                 <div className="flex items-center gap-3 md:gap-4">
                   <Library size={24} className="hidden md:block" />
                   <h1 className="font-bold text-lg md:text-xl tracking-wide">Pustaka Muthola'ah</h1>
                 </div>
                 <button onClick={() => setActivePopup('none')} className="flex items-center gap-2 bg-theme-lightest/10 hover:bg-theme-lightest/20 px-4 py-2 rounded-full transition-colors text-xs md:text-sm font-medium">
                   <ChevronLeft size={16} /> Kembali
                 </button>
               </div>
               <div className="p-5 md:p-10 overflow-y-auto flex-1 bg-theme-lightest">
                  <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-theme-darkest mb-1 md:mb-2">Jelajahi Wawasan Baru</h2>
                    <p className="text-theme-mid mb-6 md:mb-8 text-sm md:text-lg">Koleksi kitab berdasarkan kategori yang menanti untuk Anda pelajari.</p>
                    
                    <MutholaahAccordion 
                      data={appData?.mutholaahCards || []} 
                      onCardClick={(card) => setActiveReaderCard({ card, category: 'mutholaah' })}
                    />
                  </div>
               </div>
            </div>
          )}

          {/* Produktif Popup */}
          {activePopup === 'produktif' && (
            <div className="bg-theme-lightest w-full max-w-5xl h-[85vh] md:h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-theme-light-mid/30">
              <div className="px-6 py-4 md:px-8 md:py-6 border-b border-theme-light-mid/20 flex justify-between items-center bg-white/40 sticky top-0 z-10 backdrop-blur-md">
                <h2 className="text-xl md:text-2xl font-bold text-theme-darkest flex items-center gap-3">
                  <LayoutList className="text-theme-mid" />
                  Menjadi Lebih Produktif
                </h2>
                <button onClick={() => setActivePopup('none')} className="p-2 bg-white/50 hover:bg-white rounded-full text-theme-darkest transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-0 overflow-y-auto flex-1 flex flex-col md:flex-row">
                 {/* Kiri: Imam Salat */}
                 <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-theme-light-mid/20 bg-white/20">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 bg-theme-darkest rounded-full flex items-center justify-center text-theme-lightest shadow-md shadow-theme-darkest/20">
                         <Mic size={20} />
                       </div>
                       <h3 className="text-lg md:text-xl font-bold text-theme-darkest">Bekal Imam Salat</h3>
                    </div>
                    <p className="text-theme-mid text-xs md:text-sm mb-6">Kumpulan bacaan pendek dan doa panduan untuk imam.</p>
                    <div className="space-y-3 md:space-y-4">
                       {[
                         { title: "Surat Pendek Pilihan", desc: "Al-A'la, Al-Ghasyiyah, Ad-Dhuha, dll." },
                         { title: "Doa Qunut Nazilah & Witir", desc: "Teks Arab & Panduan Bacaan" },
                         { title: "Dzikir Ba'da Salat Maktubah", desc: "Panduan ringkas dzikir jahr sesuai sunnah" },
                       ].map((item, i) => (
                         <div key={i} className="bg-white/60 p-4 rounded-xl border border-theme-light-mid/30 hover:border-theme-mid transition-colors cursor-pointer group hover:shadow-sm">
                            <h4 className="font-bold text-theme-darkest group-hover:text-theme-mid transition-colors text-sm md:text-base">{item.title}</h4>
                            <p className="text-[11px] md:text-xs text-theme-mid/80 mt-1">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Kanan: Khutbah */}
                 <div className="flex-1 p-6 md:p-8 bg-white/40">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-10 h-10 bg-theme-mid rounded-full flex items-center justify-center text-theme-lightest shadow-md shadow-theme-mid/20">
                         <FileText size={20} />
                       </div>
                       <h3 className="text-lg md:text-xl font-bold text-theme-darkest">Materi Khutbah & Kultum</h3>
                    </div>
                    <p className="text-theme-mid text-xs md:text-sm mb-6">Arsip dan draft materi untuk berbagai kesempatan majelis.</p>
                    <div className="space-y-3 md:space-y-4">
                       {[
                         { title: "Keutamaan Sabar dan Syukur", desc: "Kultum Singkat 7 Menit" },
                         { title: "Khutbah Jumat: Mengingat Kematian", desc: "Materi Khutbah Lengkap" },
                         { title: "Tanggung Jawab Kepala Keluarga", desc: "Materi Ta'lim Pagi" },
                       ].map((item, i) => (
                         <div key={i} className="bg-white/80 p-4 rounded-xl border border-theme-light-mid/30 hover:border-theme-darkest transition-colors cursor-pointer group hover:shadow-sm">
                            <h4 className="font-bold text-theme-darkest group-hover:text-theme-mid transition-colors text-sm md:text-base">{item.title}</h4>
                            <p className="text-[11px] md:text-xs text-theme-mid/80 mt-1">{item.desc}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Admin Popup */}
      {showAdminPopup && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative border border-theme-light-mid/30 animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={() => {
                setShowAdminPopup(false);
                setAdminPassword('');
              }} 
              className="absolute top-4 right-4 p-2 text-theme-darkest/50 hover:text-theme-darkest hover:bg-theme-lightest rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-theme-lightest rounded-full flex items-center justify-center text-theme-darkest mb-2">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-theme-darkest">Akses Admin</h2>
              <p className="text-sm text-theme-mid">
                Silakan login untuk menambah atau mengedit file.
              </p>
              <div className="w-full mt-4 space-y-3">
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-theme-light-mid/40 focus:border-theme-mid focus:ring-2 focus:ring-theme-mid/20 outline-none transition-all placeholder:text-theme-light-mid"
                />
                <input 
                  type="password" 
                  placeholder="Kata Sandi" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-theme-light-mid/40 focus:border-theme-mid focus:ring-2 focus:ring-theme-mid/20 outline-none transition-all placeholder:text-theme-light-mid"
                />
                <button 
                  onClick={() => {
                    import('./lib/supabase').then(async ({ supabase }) => {
                      const { error } = await supabase.auth.signInWithPassword({
                        email: adminEmail,
                        password: adminPassword,
                      });
                      
                      if (!error) {
                        setIsAdminLoggedIn(true);
                        setShowAdminPopup(false);
                        setAdminPassword('');
                        setAdminEmail('');
                      } else {
                        alert('Login gagal: ' + error.message);
                      }
                    });
                  }}
                  className="w-full bg-theme-darkest text-theme-lightest font-semibold py-3 rounded-xl hover:bg-theme-mid transition-colors shadow-lg shadow-theme-darkest/20"
                >
                  Masuk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {isAdminLoggedIn && (
        <AdminPanel 
          onClose={() => setIsAdminLoggedIn(false)} 
          onDataUpdate={fetchAppData} 
        />
      )}

      {/* Reader Overlay */}
      {activeReaderCard && (
        <ReaderOverlay 
          card={activeReaderCard.card} 
          onClose={() => setActiveReaderCard(null)} 
          pdfOnly={activeReaderCard.category === 'mutholaah'}
        />
      )}
    </div>
  );
}
