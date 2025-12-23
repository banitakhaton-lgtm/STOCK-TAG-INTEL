
import React, { useState, useEffect, useMemo } from 'react';
import { MicrostockSite, TagResult, AIAnalysis } from './types';
import { scrapeLivePage, processTags } from './services/scraper';
import { getAISuggestions } from './services/geminiService';
import { SITE_CONFIG } from './constants';

const Sidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tags: TagResult[];
  site: MicrostockSite;
  onRefresh: () => void;
  topic?: string;
}> = ({ isOpen, onClose, tags, site, onRefresh, topic }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedTags(new Set());
    }
  }, [isOpen, tags]);

  const filteredTags = useMemo(() => {
    return tags.filter(t => t.tag.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tags, searchTerm]);

  const handleToggleTag = (tag: string) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setSelectedTags(next);
  };

  const handleCopySelected = () => {
    if (selectedTags.size === 0) return;
    const text = Array.from(selectedTags).join(', ');
    navigator.clipboard.writeText(text);
    alert(`Copied ${selectedTags.size} selected tags!`);
  };

  const handleCopyAll = () => {
    const text = tags.map(t => t.tag).join(', ');
    navigator.clipboard.writeText(text);
    alert('All tags copied to clipboard!');
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Tag,Score,Frequency\n"
      + tags.map(t => `${t.tag},${t.score},${t.frequency}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tags_${site}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const generateAI = async () => {
    if (tags.length === 0) return;
    setLoadingAI(true);
    const result = await getAISuggestions(tags.slice(0, 10).map(t => t.tag));
    setAiAnalysis(result);
    setLoadingAI(false);
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 45) return 'bg-emerald-600';
    if (score >= 30) return 'bg-green-500';
    if (score >= 20) return 'bg-yellow-500';
    if (score >= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-96 glass shadow-2xl transition-transform duration-300 transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50 flex flex-col border-l border-white/20`}
    >
      <div className="p-4 border-b flex justify-between items-center bg-white/60 backdrop-blur-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${SITE_CONFIG[site as keyof typeof SITE_CONFIG]?.primaryColor || 'bg-gray-400'} animate-pulse`}></div>
            <h2 className="font-bold text-lg text-gray-800">Tag Discovery</h2>
          </div>
          {topic && <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-0.5">Topic: {topic}</span>}
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-200/60 rounded-full transition-colors">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div className="px-4 py-3 bg-white/40 border-b">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search keywords..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30">
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[10px] text-gray-400 uppercase tracking-[0.15em]">
              {searchTerm ? `Matches (${filteredTags.length})` : `Best Suggestions`}
            </h3>
            {selectedTags.size > 0 && (
              <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-100">
                {selectedTags.size} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {filteredTags.map((tag) => {
              const isSelected = selectedTags.has(tag.tag);
              return (
                <div 
                  key={tag.tag} 
                  onClick={() => handleToggleTag(tag.tag)}
                  className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer select-none
                    ${isSelected 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-500/20' 
                      : 'bg-white border-gray-100 text-gray-700 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full shadow-sm transition-colors ${isSelected ? 'bg-white' : getScoreColorClass(tag.score)}`} />
                  <span className="text-sm font-semibold tracking-tight">{tag.tag}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors
                    ${isSelected ? 'bg-indigo-500/50 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-gray-600'}
                  `}>
                    {tag.score}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2 uppercase tracking-widest text-[10px]">
               AI Copilot
            </h3>
            {!aiAnalysis && (
              <button 
                onClick={generateAI} 
                disabled={loadingAI}
                className="text-[10px] font-black uppercase text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {loadingAI ? 'Calculating...' : 'Generate Optimized Title'}
              </button>
            )}
          </div>
          
          {aiAnalysis ? (
            <div className="space-y-4">
              <div className="bg-white/70 p-3 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Proposed Title</p>
                <p className="text-sm text-indigo-950 font-medium leading-relaxed">{aiAnalysis.suggestedTitle}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {aiAnalysis.additionalTags.map(tag => (
                  <span key={tag} className="text-[10px] bg-white text-indigo-700 px-2 py-1 rounded-lg border border-indigo-200 font-black shadow-sm uppercase tracking-tighter">+{tag}</span>
                ))}
              </div>
              <p className="text-xs text-indigo-800 italic border-t border-indigo-100 pt-3">
                "{aiAnalysis.nicheInsight}"
              </p>
              <button onClick={() => setAiAnalysis(null)} className="text-[10px] font-bold text-indigo-400 hover:underline">Reset AI</button>
            </div>
          ) : (
            <p className="text-[11px] text-indigo-400 text-center py-2 font-medium">Click above for AI-suggested metadata optimized for trending CTR.</p>
          )}
        </section>
      </div>

      <div className="p-4 border-t bg-white/90 backdrop-blur-lg flex flex-col gap-3">
        <div className="flex gap-2">
          <button 
            onClick={handleCopyAll}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200"
          >
            Copy All
          </button>
          {selectedTags.size > 0 && (
            <button 
              onClick={handleCopySelected}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200"
            >
              Copy Selected
            </button>
          )}
          <button 
            onClick={handleDownloadCSV}
            className="w-12 h-12 flex items-center justify-center border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </button>
        </div>
        <button onClick={onRefresh} className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-black text-[10px] uppercase tracking-[0.2em]">
          Refresh Search Stream
        </button>
      </div>
    </div>
  );
};

const TRENDING_TOPICS = [
  { id: 'ai', label: 'AI & Robotics', tags: ['ai', 'robotics', 'futuristic', 'technology', 'innovation', 'digital art', 'neural'] },
  { id: 'climate', label: 'Sustainability', tags: ['green energy', 'ecology', 'nature', 'conservation', 'environment', 'renewable', 'clean'] },
  { id: 'wellness', label: 'Mental Wellness', tags: ['meditation', 'mental health', 'peace', 'calm', 'lifestyle', 'healthy', 'zen'] },
  { id: 'cyber', label: 'Cybersecurity', tags: ['data', 'security', 'protection', 'privacy', 'hacker', 'encryption', 'code'] },
  { id: 'urban', label: 'Smart City', tags: ['urban', 'cityscape', 'intelligent', 'architecture', 'infrastructure', 'modern', 'led'] }
];

const App: React.FC = () => {
  const [site, setSite] = useState<MicrostockSite>(MicrostockSite.NONE);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [results, setResults] = useState<TagResult[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Robust domain detection
  useEffect(() => {
    const hostname = window.location.hostname;
    let detectedSite = MicrostockSite.NONE;

    if (hostname.includes('shutterstock.com')) detectedSite = MicrostockSite.SHUTTERSTOCK;
    else if (hostname.includes('adobe.com')) detectedSite = MicrostockSite.ADOBE_STOCK;
    else if (hostname.includes('freepik.com')) detectedSite = MicrostockSite.FREEPIK;
    
    setSite(detectedSite);
    
    // Automatically "Authorize" if a valid site is detected
    if (detectedSite !== MicrostockSite.NONE) {
      setIsAuthorized(true);
    }
  }, []);

  const handleAnalysis = (topicTags?: string[], topicLabel?: string) => {
    if (!isAuthorized && site === MicrostockSite.NONE) {
      setNotification("Please select a site to connect the intelligence engine.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    if (topicLabel) setActiveTopic(topicLabel);
    
    // Scrape live elements
    const scrapedItems = scrapeLivePage(site);
    let processed = processTags(scrapedItems);
    
    // Simulate inject trending tags if topic clicked
    if (topicTags) {
      const trendingResults: TagResult[] = topicTags.map(tag => ({
        tag,
        score: Math.floor(Math.random() * 25) + 40,
        frequency: Math.floor(Math.random() * 12) + 6
      }));
      processed = [...trendingResults, ...processed].slice(0, 30);
    }

    setResults(processed);
    setIsDrawerOpen(true);
  };

  const handleTrendClick = (trend: typeof TRENDING_TOPICS[0]) => {
    // If on "None" (simulator home), default to Shutterstock for the search demo
    if (site === MicrostockSite.NONE) {
      setSite(MicrostockSite.SHUTTERSTOCK);
      setIsAuthorized(true);
    }
    
    setNotification(`Searching ${trend.label} trends...`);
    setTimeout(() => {
      setNotification(null);
      handleAnalysis(trend.tags, trend.label);
    }, 1000);
  };

  const toggleAuthorization = () => {
    if (site === MicrostockSite.NONE) {
      setNotification("Identify a domain first to authorize.");
      setTimeout(() => setNotification(null), 2500);
      return;
    }
    setIsAuthorized(!isAuthorized);
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      <header className="p-6 bg-white border-b shadow-sm sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 border-4 border-white">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">STOCK TAG INTEL</h1>
              <div className="flex items-center gap-2 mt-2">
                 <div className={`w-2 h-2 rounded-full ${isAuthorized ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{isAuthorized ? 'System Connected' : 'System Disengaged'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase ml-3">Target Domain:</span>
                <select 
                  value={site} 
                  onChange={(e) => {
                    const newSite = e.target.value as MicrostockSite;
                    setSite(newSite);
                    setIsAuthorized(newSite !== MicrostockSite.NONE);
                  }}
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none hover:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
                >
                  <option value={MicrostockSite.NONE}>Select Domain</option>
                  <option value={MicrostockSite.SHUTTERSTOCK}>Shutterstock.com</option>
                  <option value={MicrostockSite.ADOBE_STOCK}>Stock.Adobe.com</option>
                  <option value={MicrostockSite.FREEPIK}>Freepik.com</option>
                </select>
             </div>
             <button 
                onClick={toggleAuthorization}
                className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isAuthorized ? 'bg-emerald-100 text-emerald-700 border-emerald-200 border' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
             >
                {isAuthorized ? 'Active' : 'Allow Access'}
             </button>
          </div>
        </div>
      </header>

      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl z-50 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-6 duration-500 border border-white/10 flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></div>
          {notification}
        </div>
      )}

      <main className="max-w-6xl mx-auto p-6 mt-10 space-y-12">
        {/* Trending Section */}
        <section className="space-y-6 bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <svg className="w-24 h-24 text-indigo-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                 Top Trending Searches
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Shutterstock & Adobe High Volume Picks</p>
            </div>
            <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl">
               <p className="text-[10px] font-black text-indigo-700 italic">Click a topic to auto-trigger deep tag analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
            {TRENDING_TOPICS.map(trend => (
              <button
                key={trend.id}
                onClick={() => handleTrendClick(trend)}
                className="flex flex-col gap-3 p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100 transition-all group text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-indigo-600 flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  #
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 tracking-tight">{trend.label}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Discover Tags</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 space-y-10">
            <div className="bg-indigo-600 p-12 rounded-[3.5rem] text-white shadow-3xl shadow-indigo-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[4rem]"></div>
               <h3 className="text-2xl font-black tracking-tight mb-4">Auto-Connect Ready</h3>
               <p className="text-sm text-indigo-100 leading-relaxed font-medium opacity-90">
                  When you browse supported sites, StockTag Intel automatically detects the context. Simply click the floating "L" button or a Trending Topic to bridge the search results into our metadata engine.
               </p>
               <div className="mt-8 pt-8 border-t border-indigo-400/30 flex items-center gap-4">
                  <div className="flex -space-x-3">
                     <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-red-500 flex items-center justify-center text-[10px] font-black">SS</div>
                     <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-blue-700 flex items-center justify-center text-[10px] font-black">AS</div>
                     <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-blue-500 flex items-center justify-center text-[10px] font-black">FR</div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Supported Platforms</p>
               </div>
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
               <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Discovery Log</h4>
               <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <p className="text-xs font-bold text-slate-600">Engine Online & Authorized</p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                     <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                     <p className="text-xs font-bold text-slate-600">Site Detect: {site === MicrostockSite.NONE ? 'Scanning...' : SITE_CONFIG[site as keyof typeof SITE_CONFIG]?.name}</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border-2 border-slate-100 shadow-3xl shadow-slate-200/50 rounded-[4rem] p-12 min-h-[600px] flex flex-col relative group">
            <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-8">
              <div className="flex items-center gap-4">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Scraper Viewport</h3>
                 {isAuthorized && (
                   <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter animate-pulse">
                      Connected
                   </div>
                 )}
              </div>
              <div className="flex gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-100"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-100"></div>
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-100"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 flex-1 content-start">
              {site !== MicrostockSite.NONE ? (
                Array.from({length: 6}).map((_, i) => (
                  <div key={i} data-testid="search-grid-item" className="search-result-cell show-card p-5 border border-slate-100 rounded-[2.5rem] bg-slate-50/50 flex flex-col gap-5 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500">
                    <div className="aspect-video bg-slate-200 rounded-3xl overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform" />
                    <div className="tag-list flex flex-wrap gap-2">
                      <a data-testid="tag" className="keyword-link tag text-[9px] font-black bg-white text-slate-400 px-2.5 py-1.5 border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-colors">Metadata#1</a>
                      <a data-testid="tag" className="keyword-link tag text-[9px] font-black bg-white text-slate-400 px-2.5 py-1.5 border border-slate-200 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-colors">Metadata#2</a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center py-24 opacity-40">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest text-center max-w-[200px] leading-loose">Navigate to supported stock site to authorize scraper</p>
                </div>
              )}
            </div>
            <div className="mt-auto pt-8 flex items-center justify-center text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">
               Real-Time Asset Feed
            </div>
          </div>
        </div>
      </main>

      {/* Main Intelligent Action Button */}
      <button 
        onClick={() => handleAnalysis()}
        disabled={!isAuthorized}
        className={`fixed bottom-12 right-12 w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl shadow-[0_25px_60px_rgba(79,70,229,0.3)] transition-all duration-500 transform hover:scale-110 active:scale-90 z-40 group overflow-hidden
          ${!isAuthorized 
            ? 'bg-slate-300 cursor-not-allowed shadow-none grayscale' 
            : SITE_CONFIG[site as keyof typeof SITE_CONFIG]?.primaryColor || 'bg-indigo-600'
          }`}
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="group-hover:rotate-12 transition-transform relative z-10">L</span>
        {isAuthorized && (
           <span className="absolute inset-0 flex items-center justify-center">
             <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-white opacity-20"></span>
           </span>
        )}
      </button>

      <Sidebar 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        tags={results} 
        site={site}
        onRefresh={() => handleAnalysis()}
        topic={activeTopic || undefined}
      />

      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-[6px] z-40 transition-opacity animate-in fade-in duration-700" 
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
