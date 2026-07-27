import { useState, useEffect } from 'react';

interface EventItem {
  eventId: number;
  title: string;
  price: number;
  availableSeats: number;
  startTime: string;  
  endTime: string;   
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [availableSeats, setAvailableSeats] = useState<number>(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) throw new Error(`Błąd pobierania danych: ${response.status}`);
      const data: EventItem[] = await response.json();
      
       
      const sortedData = data.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setEvents(sortedData);
    } catch (err: any) {
      setError(err.message || 'Nie udało się załadować wydarzeń.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle('');
    setPrice(0);
    setAvailableSeats(0);
    setStartTime('');
    setEndTime('');
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setTitle(event.title);
    setPrice(event.price);
    setAvailableSeats(event.availableSeats);
    
     
    setStartTime(event.startTime.substring(0, 16));
    setEndTime(event.endTime.substring(0, 16));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

     
     
    const formatForBackend = (dateTimeStr: string) => {
      if (!dateTimeStr) return "";
      return dateTimeStr.length === 16 ? `${dateTimeStr}:00.252` : dateTimeStr;
    };

    const payload = {
      title,
      price: Number(price),
      availableSeats: Number(availableSeats),
      startTime: formatForBackend(startTime),
      endTime: formatForBackend(endTime),
    };

    try {
      let response;
      if (editingEvent) {
        response = await fetch(`/api/inventory/${editingEvent.eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error(`Operacja nieudana: ${response.status}`);

      setIsModalOpen(false);
      fetchEvents(); 
    } catch (err: any) {
      setError(err.message || 'Błąd zapisu wydarzenia.');
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć wydarzenie #${eventId}?`)) return;

    try {
      const response = await fetch(`/api/inventory/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Błąd usuwania: ${response.status}`);
      fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Nie udało się usunąć wydarzenia.');
    }
  };

   
  const formatDateString = (dateStr: string) => {
    try {
      if (!dateStr) return '';
       
      const [datePart, timePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes] = timePart.split(':');

      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-400 text-xs uppercase tracking-wider">Ładowanie panelu administratora...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Panel Administratora</h1>
          <p className="text-xs text-slate-400 mt-1">Zarządzanie bazą danych Inventory Service.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          + Dodaj nowe wydarzenie
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-medium mb-6">
          ⚠️ Błąd: {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <th className="py-4 px-6 w-16">ID</th>
                <th className="py-4 px-6">Nazwa wydarzenia</th>
                <th className="py-4 px-6">Cena (double)</th>
                <th className="py-4 px-6">Miejsca (int)</th>
                <th className="py-4 px-6">Data rozpoczęcia</th>
                <th className="py-4 px-6 text-right w-36">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-slate-400 uppercase tracking-wider">
                    Brak wydarzeń w bazie danych.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.eventId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">#{event.eventId}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{event.title}</td>
                    <td className="py-4 px-6 font-mono">{event.price.toFixed(2)} PLN</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${event.availableSeats === 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-800'}`}>
                        {event.availableSeats} szt.
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 font-mono font-bold">
                      {formatDateString(event.startTime)}
                    </td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => openEditModal(event)}
                          className="w-20 py-1.5 text-center border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => handleDelete(event.eventId)}
                          className="w-20 py-1.5 text-center border border-rose-100 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
            
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6">
              {editingEvent ? `Edycja Wydarzenia #${editingEvent.eventId}` : 'Tworzenie nowego wydarzenia'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Tytuł wydarzenia</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Koncert Dawida Podsiadło"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Cena (PLN)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Dostępne miejsca</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Data rozpoczęcia</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-bold text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Data zakończenia</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-bold text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {editingEvent ? 'Zapisz zmiany' : 'Utwórz wydarzenie'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}