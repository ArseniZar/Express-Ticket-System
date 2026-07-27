import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GetEventResponse {
  eventId: number;      
  title: string;        
  price: number;        
  availableSeats: number; 
  startTime: string;    
  endTime: string;      
}

export default function EventCatalogPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<GetEventResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/inventory', {
          method: 'GET',
          headers: { 'Accept': '*/*' }
        });

        if (!response.ok) {
          throw new Error(`Błąd ładowania danych: ${response.status}`);
        }

        const data: GetEventResponse[] = await response.json();
        setEvents(data);
      } catch (err: any) {
        setError(err.message || 'Nie udało się pobrać listy wydarzeń.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getHeaderGradient = (id: number) => {
    const index = id % 4;
    switch (index) {
      case 0: return 'from-slate-800 to-slate-900';
      case 1: return 'from-slate-700 to-slate-800';
      case 2: return 'from-zinc-700 to-zinc-800';
      case 3: return 'from-neutral-800 to-neutral-900';
      default: return 'from-slate-800 to-slate-900';
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900">
      
      <div className="text-center md:text-left mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">
          Aktualne Wydarzenia
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-xl">
          Wybierz interesujące Cię wydarzenie z bazy danych i przejdź do szybkiej rezerwacji biletów.
        </p>
      </div>

      { }
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-10">
        <div className="w-full md:w-96">
          <input
            type="text"
            placeholder="Szukaj po nazwie wydarzenia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors text-sm font-medium"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-400 text-xs uppercase tracking-wider">Pobieranie oferty...</p>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-6 rounded-2xl text-center max-w-md mx-auto text-xs font-semibold uppercase tracking-wider">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 text-xs uppercase tracking-wider">
            Brak dostępnych wydarzeń w systemie.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => {
              const isSoldOut = event.availableSeats === 0;

              return (
                <div 
                  key={event.eventId} 
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all duration-300"
                >
                  <div className={`h-24 bg-gradient-to-br ${getHeaderGradient(event.eventId)} p-4 flex flex-col justify-end`}>
                    <div className="text-[10px] text-white font-mono font-bold bg-white/10 backdrop-blur-md px-2 py-1 rounded-md self-start shadow-sm tracking-wider">
                      📅 {formatDate(event.startTime)}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 tracking-tight">
                        {event.title}
                      </h3>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cena wstępu</span>
                        <span className="text-base font-black text-slate-900 font-mono">{event.price.toFixed(2)} PLN</span>
                      </div>

                      {isSoldOut ? (
                        <span className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200">
                          Wyprzedane
                        </span>
                      ) : (
                        <div className="text-right">
                          <button 
                            onClick={() => navigate(`/booking/${event.eventId}`)}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer"
                          >
                            Kup bilet
                          </button>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">
                            Miejsca: {event.availableSeats}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}