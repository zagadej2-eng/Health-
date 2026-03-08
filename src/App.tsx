/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { 
  Leaf, 
  HeartPulse, 
  Trash2, 
  AlertTriangle, 
  Menu, 
  X, 
  ChevronRight, 
  Camera, 
  Send, 
  Activity,
  Zap,
  Wind,
  Droplets
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { 
  getWasteClassification, 
  getHealthAdvice, 
  getEnergyOptimization, 
  getDisasterRisk 
} from './services/gemini';

type Module = 'climate' | 'health' | 'waste' | 'disaster';

const FOOTPRINT_DATA = [
  { month: 'Jan', footprint: 4.2 },
  { month: 'Feb', footprint: 3.8 },
  { month: 'Mar', footprint: 4.5 },
  { month: 'Apr', footprint: 3.2 },
  { month: 'May', footprint: 2.9 },
  { month: 'Jun', footprint: 3.1 },
];

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('climate');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [wasteResult, setWasteResult] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAction = async () => {
    if (!input && activeModule !== 'waste') return;
    setLoading(true);
    setResponse(null);
    try {
      let res;
      if (activeModule === 'climate') {
        res = await getEnergyOptimization(input);
      } else if (activeModule === 'health') {
        res = await getHealthAdvice(input);
      } else if (activeModule === 'disaster') {
        res = await getDisasterRisk(input);
      }
      setResponse(res);
    } catch (err) {
      console.error(err);
      setResponse("An error occurred while processing your request.");
    } finally {
      setLoading(false);
    }
  };

  const captureImage = useCallback(async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480);
        const imageData = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
        setLoading(true);
        try {
          const result = await getWasteClassification(imageData);
          setWasteResult(result);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const modules = [
    { id: 'climate', name: 'Climate & Energy', icon: Leaf, color: 'text-emerald-600' },
    { id: 'health', name: 'Health & Medicine', icon: HeartPulse, color: 'text-rose-600' },
    { id: 'waste', name: 'Waste Management', icon: Trash2, color: 'text-amber-600' },
    { id: 'disaster', name: 'Disaster Preparedness', icon: AlertTriangle, color: 'text-orange-600' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#141414] text-[#E4E3E0] flex flex-col border-r border-[#141414]/20"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-serif italic text-xl"
              >
                ImpactOS
              </motion.h1>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-8">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setActiveModule(m.id as Module);
                setResponse(null);
                setWasteResult(null);
                setInput('');
              }}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-all group",
                activeModule === m.id 
                  ? "bg-[#E4E3E0] text-[#141414]" 
                  : "hover:bg-white/5 text-white/60"
              )}
            >
              <m.icon size={20} className={cn("shrink-0", activeModule === m.id ? m.color : "")} />
              {isSidebarOpen && (
                <span className="ml-4 font-medium text-sm tracking-tight">{m.name}</span>
              )}
              {isSidebarOpen && activeModule === m.id && (
                <ChevronRight size={16} className="ml-auto opacity-50" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Activity size={16} className="text-emerald-500" />
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="text-xs font-mono opacity-50 uppercase tracking-widest">System Status</span>
                <span className="text-xs font-medium text-emerald-500">All Nodes Active</span>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#E4E3E0] overflow-y-auto">
        <header className="h-20 border-bottom border-[#141414] flex items-center px-8 justify-between sticky top-0 bg-[#E4E3E0]/80 backdrop-blur-md z-10">
          <div>
            <h2 className="font-serif italic text-2xl">
              {modules.find(m => m.id === activeModule)?.name}
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50">
              Module v1.0.4 / Global Impact Initiative
            </p>
          </div>
          <div className="flex gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-mono opacity-50 uppercase">Global CO2 Level</span>
              <span className="text-xs font-mono text-rose-500">421.5 ppm <span className="text-[8px] opacity-50">↑ 2.4</span></span>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-mono opacity-50 uppercase">Global Temp Rise</span>
              <span className="text-xs font-mono text-rose-500">+1.26°C <span className="text-[8px] opacity-50">↑ 0.02</span></span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono opacity-50 uppercase">Local Time</span>
              <span className="text-xs font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Module Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {activeModule === 'climate' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#141414]/5">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-serif italic text-xl">Carbon Footprint Trends</h3>
                        <span className="text-xs font-mono opacity-50">Metric Tons CO2e</span>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={FOOTPRINT_DATA}>
                            <defs>
                              <linearGradient id="colorFootprint" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                            <XAxis 
                              dataKey="month" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#141414', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: '#E4E3E0',
                                fontSize: '12px',
                                fontFamily: 'JetBrains Mono'
                              }} 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="footprint" 
                              stroke="#059669" 
                              strokeWidth={2}
                              fillOpacity={1} 
                              fill="url(#colorFootprint)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#141414]/5">
                      <h3 className="font-serif italic text-xl mb-4">Energy Optimization AI</h3>
                      <p className="text-sm text-black/60 mb-6">
                        Describe your daily home energy habits (e.g., "I leave lights on in empty rooms", "I use the AC all day at 20°C").
                      </p>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Enter habits..."
                          className="flex-1 bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                        <button 
                          onClick={handleAction}
                          disabled={loading}
                          className="bg-[#141414] text-white px-6 py-3 rounded-xl hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? <Activity className="animate-spin" size={18} /> : <Zap size={18} />}
                          <span className="font-medium text-sm">Optimize</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#141414] text-white p-8 rounded-2xl">
                      <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 mb-2">Live Impact</h4>
                      <div className="text-4xl font-mono mb-1">2.4<span className="text-xl opacity-50">t</span></div>
                      <p className="text-xs opacity-60">Your estimated annual carbon savings through AI optimization.</p>
                      <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-mono opacity-50 uppercase">Trees Planted</div>
                          <div className="text-xl font-mono">142</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono opacity-50 uppercase">Water Saved</div>
                          <div className="text-xl font-mono">12k<span className="text-xs">L</span></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-[#141414]/5">
                      <h4 className="font-serif italic text-lg mb-4">Quick Tips</h4>
                      <ul className="space-y-4">
                        {[
                          { icon: Wind, text: "Use natural ventilation when air quality is good." },
                          { icon: Droplets, text: "Lower water heater temp to 49°C." },
                          { icon: Zap, text: "Switch to LED bulbs to save up to 75% energy." }
                        ].map((item, i) => (
                          <li key={i} className="flex gap-3 text-sm text-black/70">
                            <item.icon size={16} className="shrink-0 text-emerald-600" />
                            <span>{item.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeModule === 'health' && (
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#141414]/5">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <HeartPulse className="text-rose-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-serif italic text-2xl">AI Health Companion</h3>
                        <p className="text-xs font-mono opacity-50 uppercase tracking-widest">Symptom Analysis & Wellness</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <textarea 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Describe how you're feeling..."
                          className="w-full bg-[#F5F5F5] border-none rounded-2xl p-6 text-sm min-h-[150px] focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                        />
                        <button 
                          onClick={handleAction}
                          disabled={loading || !input}
                          className="absolute bottom-4 right-4 bg-rose-600 text-white p-3 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? <Activity className="animate-spin" size={20} /> : <Send size={20} />}
                        </button>
                      </div>
                      <p className="text-[10px] text-center text-black/40 italic">
                        Disclaimer: This is an AI tool for informational purposes only. Not a medical diagnosis.
                      </p>
                    </div>
                  </div>

                  {response && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#141414] text-white p-8 rounded-2xl shadow-xl"
                    >
                      <div className="flex items-center gap-2 mb-4 opacity-50">
                        <Activity size={14} />
                        <span className="text-[10px] font-mono uppercase tracking-widest">AI Assessment Result</span>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <Markdown>{response}</Markdown>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {activeModule === 'waste' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#141414]/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif italic text-xl">Waste Classifier</h3>
                      <button 
                        onClick={startCamera}
                        className="text-xs font-mono uppercase tracking-widest flex items-center gap-2 hover:opacity-70"
                      >
                        <Camera size={14} />
                        Activate Camera
                      </button>
                    </div>
                    
                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
                      
                      <div className="absolute inset-0 border-2 border-white/20 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <button 
                          onClick={captureImage}
                          disabled={loading}
                          className="bg-white text-black px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2"
                        >
                          {loading ? <Activity className="animate-spin" size={18} /> : <Camera size={18} />}
                          Capture & Classify
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-black/50 text-center">Point your camera at a waste item to identify its disposal category.</p>
                  </div>

                  <div className="space-y-6">
                    <AnimatePresence mode="wait">
                      {wasteResult ? (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-[#141414] text-white p-8 rounded-2xl h-full flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-8">
                            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Classification Result</span>
                            <span className="text-xs font-mono px-2 py-1 bg-white/10 rounded">
                              {Math.round(wasteResult.confidence * 100)}% Match
                            </span>
                          </div>
                          
                          <div className="flex-1 space-y-6">
                            <div>
                              <h4 className="text-[10px] font-mono uppercase opacity-50 mb-1">Category</h4>
                              <div className="text-3xl font-serif italic text-amber-400 capitalize">{wasteResult.category}</div>
                            </div>
                            
                            <div>
                              <h4 className="text-[10px] font-mono uppercase opacity-50 mb-2">Disposal Instructions</h4>
                              <p className="text-sm text-white/80 leading-relaxed">{wasteResult.instructions}</p>
                            </div>
                          </div>

                          <div className="mt-8 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <Trash2 size={18} className="text-amber-500" />
                              </div>
                              <div className="text-xs">
                                <div className="font-medium">Gamification Bonus</div>
                                <div className="opacity-50">+15 Impact Points earned</div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="bg-white/40 border-2 border-dashed border-[#141414]/10 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center">
                          <Trash2 size={48} className="opacity-10 mb-4" />
                          <p className="text-sm font-serif italic opacity-40">Awaiting capture input...</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeModule === 'disaster' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#141414]/5">
                      <h3 className="font-serif italic text-xl mb-6">Disaster Risk Assessment</h3>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Enter your city or region..."
                          className="flex-1 bg-[#F5F5F5] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 transition-all"
                        />
                        <button 
                          onClick={handleAction}
                          disabled={loading || !input}
                          className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {loading ? <Activity className="animate-spin" size={18} /> : <AlertTriangle size={18} />}
                          <span className="font-medium text-sm">Assess</span>
                        </button>
                      </div>
                    </div>

                    {response && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#141414] text-white p-8 rounded-2xl"
                      >
                        <div className="flex items-center gap-2 mb-6 opacity-50">
                          <Activity size={14} />
                          <span className="text-[10px] font-mono uppercase tracking-widest">Risk Analysis Report</span>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <Markdown>{response}</Markdown>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#141414]/5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-4">Real-time Alerts</h4>
                      <div className="space-y-4">
                        {[
                          { title: "Flood Watch", loc: "Coastal Region", time: "2h ago", severity: "Medium" },
                          { title: "Heat Wave", loc: "Central Valley", time: "5h ago", severity: "High" },
                          { title: "Air Quality", loc: "Metro Area", time: "12h ago", severity: "Low" }
                        ].map((alert, i) => (
                          <div key={i} className="p-4 rounded-xl bg-[#F5F5F5] border border-[#141414]/5">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold">{alert.title}</span>
                              <span className={cn(
                                "text-[8px] px-1.5 py-0.5 rounded font-mono uppercase",
                                alert.severity === 'High' ? "bg-rose-100 text-rose-600" : 
                                alert.severity === 'Medium' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
                              )}>
                                {alert.severity}
                              </span>
                            </div>
                            <div className="text-[10px] opacity-50 font-mono">{alert.loc} • {alert.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-orange-600 text-white p-6 rounded-2xl">
                      <h4 className="font-serif italic text-lg mb-2">Emergency Kit</h4>
                      <p className="text-xs opacity-80 mb-4">Ensure you have these essentials ready at all times.</p>
                      <div className="space-y-2">
                        {['Water (3 days)', 'Non-perishable food', 'First aid kit', 'Flashlight & batteries'].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-1 h-1 bg-white rounded-full" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
