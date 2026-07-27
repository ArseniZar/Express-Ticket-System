import { useState, useEffect } from 'react';

interface AuditLogItem {
  id: number;
  serviceName: string;
  eventType: string; 
  entityType: string; 
  entityId: number;
  userId: number;
  payload: string; 
  createdAt: string; 
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  
   
  const [period, setPeriod] = useState<string>('all'); 
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const fetchAuditLogs = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);
      
      setError(null);
      
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error(`Błąd pobierania logów: ${response.status}`);
      }
      
      const data: AuditLogItem[] = await response.json();
      
       
      const sorted = data.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.localeCompare(a.createdAt);
      });
      
      setLogs(sorted);
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać logów audytowych.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

   
  useEffect(() => {
     
    fetchAuditLogs(false);

     
    const intervalId = setInterval(() => {
      fetchAuditLogs(true);  
    }, 10000);

     
    return () => clearInterval(intervalId);
  }, []);

   
  useEffect(() => {
    let result = [...logs];

     
    if (serviceFilter !== 'all') {
      result = result.filter(log => log.serviceName === serviceFilter);
    }

     
    const targetDateStr = "2026-06-11";
    const now = new Date(targetDateStr + "T23:59:59");

    if (period === 'today') {
      result = result.filter(log => log.createdAt && log.createdAt.startsWith(targetDateStr));
    } else if (period === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      result = result.filter(log => log.createdAt && log.createdAt.split('T')[0] >= sevenDaysAgo);
    } else if (period === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      result = result.filter(log => log.createdAt && log.createdAt.split('T')[0] >= thirtyDaysAgo);
    }

    setFilteredLogs(result);
  }, [period, serviceFilter, logs]);

   
  const handleDownloadCSV = () => {
    const headers = ['ID', 'Data', 'Serwis', 'Typ Wydarzenia', 'Typ Encji', 'ID Encji', 'ID Usera', 'Payload'];
    const rows = filteredLogs.map(log => [
      log.id, 
      log.createdAt, 
      log.serviceName, 
      log.eventType, 
      log.entityType, 
      log.entityId,
      log.userId,
      `"${(log.payload || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${period}_2026-06-11.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

   
  const handleDownloadTXT = () => {
    const textContent = filteredLogs.map(log => 
      `[${log.createdAt}] [Serwis: ${log.serviceName}] [Event: ${log.eventType}]\nEncja: ${log.entityType} (ID: ${log.entityId}) | User ID: ${log.userId}\nPayload: ${log.payload}\n------------------------------------------------------------`
    ).join('\n\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${period}_2026-06-11.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

   
  const formatTimestamp = (str: string) => {
    try {
      if (!str) return '';
      const [date, time] = str.split('T');
      const [y, m, d] = date.split('-');
      return `${d}.${m}.${y}, ${time.substring(0, 5)}`;
    } catch {
      return str;
    }
  };

  const uniqueServices = Array.from(new Set(logs.map(log => log.serviceName)));

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-400 text-xs uppercase tracking-wider">Pobieranie rejestru audytu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900">
      
      { }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Rejestr Audytu (Audit Logs)</h1>
            
            { }
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isRefreshing ? 'animate-ping' : 'animate-pulse'}`}></span>
              Live (10s)
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">Aktywne monitorowanie zdarzeń systemowych w architekturze mikroserwisowej.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTXT}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            Pobierz .TXT
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-40"
          >
            Eksportuj .CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-medium mb-6">
          ⚠️ Błąd komunikacji z API: {error}
        </div>
      )}

      { }
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm flex flex-wrap items-center gap-6">
        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Okres czasu</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold uppercase tracking-wider">
            <button onClick={() => setPeriod('all')} className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${period === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Wszystko</button>
            <button onClick={() => setPeriod('today')} className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${period === 'today' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Dzisiaj</button>
            <button onClick={() => setPeriod('week')} className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${period === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>7 dni</button>
            <button onClick={() => setPeriod('month')} className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${period === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>30 dni</button>
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Mikroserwis</span>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Wszystkie serwisy</option>
            {uniqueServices.map(srv => (
              <option key={srv} value={srv}>{srv}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-right">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wpisy</span>
          <span className="text-lg font-mono font-black text-slate-900">
            {filteredLogs.length}
          </span>
        </div>
      </div>

      { }
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <th className="py-4 px-6 w-16">ID</th>
                <th className="py-4 px-6 w-40">Data i czas</th>
                <th className="py-4 px-6 w-36">Źródło (Serwis)</th>
                <th className="py-4 px-6 w-44">Typ Wydarzenia</th>
                <th className="py-4 px-6 w-32">Obiekt (ID)</th>
                <th className="py-4 px-6 w-20 text-center">User</th>
                <th className="py-4 px-6">Payload (Szczegóły)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 uppercase tracking-wider font-bold">
                    Brak logów audytowych dla wybranych kryteriów.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-slate-400">#{log.id}</td>
                    <td className="py-4 px-6 font-mono text-slate-500">{formatTimestamp(log.createdAt)}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-700">
                        {log.serviceName}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-blue-600 text-[11px] uppercase">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      <span className="font-bold">{log.entityType}</span>
                      <span className="text-slate-400 font-mono ml-1">(#{log.entityId})</span>
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-bold text-slate-800">
                      {log.userId}
                    </td>
                    <td className="py-4 px-6 text-slate-500 leading-relaxed font-mono text-[11px] bg-slate-50/30">
                      {log.payload}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}