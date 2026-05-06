/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
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
import { 
  Activity, 
  Cpu, 
  Database, 
  Layers, 
  LayoutDashboard, 
  List, 
  RefreshCcw, 
  Search, 
  Server, 
  Settings, 
  Terminal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Info,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MetricPoint, LogEntry } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const StatCard = ({ title, value, unit, icon: Icon, color, borderColor }: { title: string, value: string | number, unit?: string, icon: any, color: string, borderColor: string }) => (
  <div className={cn("bg-[#181b1f] border-t-2 p-3 flex flex-col justify-between h-24 group transition-colors", borderColor)}>
    <span className="text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      {title}
    </span>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-light text-white leading-none">{value}</span>
      {unit && <span className="text-xs opacity-50 font-mono italic">{unit}</span>}
    </div>
  </div>
);

const LogRow = ({ log }: { log: LogEntry; key?: string | number }) => {
  const levelColors = {
    INFO: 'text-[#56a64b]',
    WARN: 'text-[#ff780a]',
    ERROR: 'text-[#e02f44]',
    DEBUG: 'text-neutral-500',
  };

  return (
    <div className="group flex items-start gap-3 py-1 px-3 border-b border-[#2c2c2e] hover:bg-[#111217] transition-colors font-mono text-[11px]">
      <span className="text-neutral-600 whitespace-nowrap opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
      <span className={cn("font-bold uppercase w-10", levelColors[log.level])}>
        {log.level.substring(0, 4)}
      </span>
      <span className="text-neutral-500 whitespace-nowrap opacity-40">[{log.service}]</span>
      <span className="text-[#d8d9da] break-all">{log.message}</span>
    </div>
  );
};

const LogExplorer = ({ logs, logEndRef }: { logs: LogEntry[], logEndRef: any }) => (
  <div className="bg-[#181b1f] border border-[#2c2c2e] rounded-sm flex flex-col h-full overflow-hidden">
    <div className="p-3 border-b border-[#2c2c2e] flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
        <Terminal size={14} className="text-[#9fef00]" />
        Loki Log Stream Explorer
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-[#111217] border border-[#2c2c2e] rounded text-[11px]">
          <Search size={12} className="opacity-30" />
          <input 
            type="text" 
            placeholder="Search logs..." 
            className="bg-transparent border-none outline-none text-neutral-300 w-48"
          />
        </div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2c2c2e]">
      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
      <div ref={logEndRef} />
    </div>
    <div className="p-2 border-t border-[#2c2c2e] bg-[#111217] text-[9px] text-[#9fef00] uppercase flex justify-between tracking-widest opacity-80">
      <span>Mode: Real-time Streaming</span>
      <span>Total: {logs.length} Lines Buffered</span>
    </div>
  </div>
);

export default function App() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'metrics'>('overview');
  const [isLive, setIsLive] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Fetching Logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mRes, lRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/logs?count=5')
        ]);
        
        const mData = await mRes.json();
        const lData = await lRes.json();

        setMetrics(mData);
        setLogs(prev => {
          const newLogs = [...prev, ...lData];
          return newLogs.slice(-100); // Keep last 100
        });
      } catch (e) {
        console.error("Dashboard failed to sync:", e);
      }
    };

    if (isLive) {
      const interval = setInterval(fetchData, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // Auto-scroll logs
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const latestMetric = metrics[metrics.length - 1] || { cpu: 0, memory: 0, requests: 0 };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#d8d9da] flex font-sans selection:bg-[#9fef00]/30 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-16 border-r border-[#2c2c2e] flex flex-col items-center py-6 gap-8 flex-shrink-0 bg-[#111217]">
        <div className="w-10 h-10 bg-[#f05a28] rounded flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#f05a28]/10">
          N
        </div>
        
        <nav className="flex flex-col gap-6">
          <button onClick={() => setActiveTab('overview')} className={cn("p-2 transition-all group", activeTab === 'overview' ? "text-[#9fef00]" : "text-[#4a4a4e] hover:text-neutral-300")}>
            <LayoutDashboard size={20} />
          </button>
          <button onClick={() => setActiveTab('metrics')} className={cn("p-2 transition-all group", activeTab === 'metrics' ? "text-[#3274d9]" : "text-[#4a4a4e] hover:text-neutral-300")}>
            <Layers size={20} />
          </button>
          <button onClick={() => setActiveTab('logs')} className={cn("p-2 transition-all group", activeTab === 'logs' ? "text-white" : "text-[#4a4a4e] hover:text-neutral-300")}>
            <Terminal size={20} />
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-6 mb-4 text-[#4a4a4e]">
          <Settings size={20} className="hover:text-neutral-400 cursor-pointer" />
          <div className="w-8 h-8 rounded-full border border-[#2c2c2e] bg-[#181b1f] flex items-center justify-center text-[10px] font-bold">
            AD
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="h-12 border-b border-[#2c2c2e] bg-[#111217] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <span className="text-[#9fef00] font-medium text-sm">Dashboards</span>
            <span className="opacity-30 text-sm">/</span>
            <span className="text-sm font-light">System Overview (Production)</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#181b1f] border border-[#2c2c2e] px-3 py-1 rounded text-[11px] h-7">
              <Clock size={12} className="opacity-50" />
              <span>Last 15 minutes</span>
              <ChevronDown size={12} className="opacity-30" />
            </div>
            
            <button 
              onClick={() => setIsLive(!isLive)}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded text-[11px] font-bold transition-all h-7",
                isLive ? "bg-[#3274d9] text-white" : "bg-[#181b1f] text-neutral-400 border border-[#2c2c2e]"
              )}
            >
              <RefreshCcw size={12} className={cn(isLive && "animate-spin-slow")} />
              {isLive ? "REFRESHING" : "PAUSED"}
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Prometheus CPU" value={latestMetric.cpu} unit="%" icon={Cpu} color="bg-[#3274d9]" borderColor="border-[#3274d9]" />
                  <StatCard title="RAM Usage" value={latestMetric.memory} unit="GiB" icon={Database} color="bg-[#9fef00]" borderColor="border-[#9fef00]" />
                  <StatCard title="Request Rate" value={`${(latestMetric.requests/100).toFixed(1)}k`} unit="req/s" icon={Activity} color="bg-[#f05a28]" borderColor="border-[#f05a28]" />
                  <StatCard title="Error Rate (5xx)" value="0.04" unit="%" icon={AlertTriangle} color="bg-[#e02f44]" borderColor="border-[#e02f44]" />
                </div>

                {/* Main Charts area */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 lg:col-span-8 bg-[#181b1f] border border-[#2c2c2e] p-4 h-[320px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase opacity-60">Cluster Traffic over Time</span>
                      <div className="flex gap-4 text-[10px] opacity-40 uppercase tracking-widest">
                        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#3274d9]"></div> CPU</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-[#9fef00]"></div> MEM</div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" vertical={false} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={[0, 100]} hide />
                          <Tooltip 
                            contentStyle={{ background: '#111217', border: '1px solid #2c2c2e', fontSize: '10px' }}
                          />
                          <Area type="monotone" dataKey="cpu" stroke="#3274d9" fill="#3274d9" fillOpacity={0.1} strokeWidth={2} />
                          <Area type="monotone" dataKey="memory" stroke="#9fef00" fill="#9fef00" fillOpacity={0.05} strokeWidth={1} strokeDasharray="4 4" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-4 bg-[#181b1f] border border-[#2c2c2e] p-4 flex flex-col h-[320px]">
                    <span className="text-xs font-bold uppercase opacity-60 mb-4">Loki Logs Explorer</span>
                    <div className="flex-1 overflow-hidden font-mono text-[11px] space-y-1">
                      {logs.slice(-15).map((log) => (
                        <div key={log.id} className="flex gap-2">
                           <span className={cn(
                             log.level === 'ERROR' ? 'text-[#e02f44]' : 
                             log.level === 'WARN' ? 'text-[#ff780a]' : 'text-[#56a64b]'
                           )}>{log.level.substring(0, 4)}</span>
                           <span className="opacity-30">[{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
                           <span className="truncate">{log.message}</span>
                        </div>
                      ))}
                      <div className="text-[#9fef00] opacity-50 italic text-[10px] mt-2">-- end of stream --</div>
                    </div>
                  </div>
                </div>

                {/* Node Health Grid - Bottom Section */}
                <div className="col-span-12 bg-[#111217] border border-[#2c2c2e] p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase opacity-60">Node Health Status</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { region: 'eu-west-1', name: 'Prod-Cluster-A', status: 'ONLINE', color: 'border-[#56a64b]' },
                      { region: 'us-east-1', name: 'Prod-Cluster-B', status: 'ONLINE', color: 'border-[#56a64b]' },
                      { region: 'ap-south-1', name: 'Stage-Cluster-X', status: 'DEGRADED', color: 'border-[#ff780a]' },
                      { region: 'global', name: 'Ingress-Gateway', status: 'ONLINE', color: 'border-[#56a64b]' }
                    ].map((node, i) => (
                      <div key={i} className={cn("border-l-4 bg-[#181b1f] p-3 flex justify-between items-center", node.color)}>
                        <div>
                          <div className="text-[10px] opacity-40 font-mono uppercase">{node.region}</div>
                          <div className="text-xs font-bold">{node.name}</div>
                        </div>
                        <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", 
                          node.status === 'ONLINE' ? 'bg-[#56a64b]/10 text-[#56a64b]' : 'bg-[#ff780a]/10 text-[#ff780a]'
                        )}>{node.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs-explorer"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="h-[calc(100vh-160px)]"
              >
                <LogExplorer logs={logs} logEndRef={logEndRef} />
              </motion.div>
            )}

            {/* Metrics detailed view */}
            {activeTab === 'metrics' && (
              <motion.div 
                key="metrics-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-sm p-4 h-[400px]">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-4">Memory Allocation History</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="time" stroke="#444" fontSize={10} />
                      <YAxis stroke="#444" fontSize={10} />
                      <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                      <Line type="monotone" dataKey="memory" stroke="#a855f7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Add more metrics as needed */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Status Bar */}
        <footer className="h-6 bg-[#0b0c0e] border-t border-[#2c2c2e] px-6 flex items-center justify-between text-[10px] opacity-40">
          <div className="flex gap-4">
            <span>Grafana v10.2.1 • Prometheus 2.47 • Loki 2.9</span>
          </div>
          <div className="flex items-center gap-4 uppercase font-mono">
            <span>DB: TimeSeries</span>
            <span>User: admin</span>
            <span className="text-[#9fef00]">● System healthy</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
