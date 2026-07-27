import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface EventDetails {
  eventId: number;
  title: string;
  price: number;
  availableSeats: number;
  startTime: string;
}

export default function BookingPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [eventData, setEventData] = useState<EventDetails | null>(null);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const savedUserRaw = localStorage.getItem('currentUser');
  const currentUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch('/api/inventory');
        if (!response.ok) throw new Error(`Błąd: ${response.status}`);
        const list: EventDetails[] = await response.json();
        const found = list.find(item => item.eventId === Number(eventId));
        if (!found) throw new Error('Nie znaleziono takiego wydarzenia.');
        setEventData(found);
      } catch (err: any) {
        setError(err.message || 'Problem z pobieraniem danych.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  const totalPrice = eventData ? ticketCount * eventData.price : 0;

  const handleProcess = async (action: 'JUST_RESERVE' | 'GO_TO_PAY') => {
    if (!currentUser || !eventData) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
        body: JSON.stringify({
          userId: Number(currentUser.userId),
          eventId: Number(eventData.eventId),
          seats: ticketCount
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Błąd tworzenia rezerwacji: ${response.status}`);
      }

       
      const bookingResult = await response.json();

       
      navigate(`/checkout/${bookingResult.bookingId}?action=${action}`, {
        state: {
          backendData: bookingResult,  
          eventTitle: eventData.title,
          seats: ticketCount
        }
      });

    } catch (err: any) {
      setError(err.message || 'Operacja nie powiodła się.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-500 text-xs tracking-wider uppercase">Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-slate-900">
      <button onClick={() => navigate('/events')} className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900 transition-colors">
        ← Powrót do oferty
      </button>

      {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-sm mb-6 text-center font-medium">⚠️ {error}</div>}

      {eventData && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Konfiguracja zamówienia</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-6">{eventData.title}</h1>
          
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-500">
              Klient: {currentUser?.firstName} {currentUser?.lastName} (@{currentUser?.username})
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Liczba biletów</label>
                <span className="text-xs text-slate-400">Dostępne: {eventData.availableSeats}</span>
              </div>
              <input 
                type="number" 
                required 
                min="1" 
                max={eventData.availableSeats}
                value={ticketCount} 
                onChange={e => setTicketCount(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-slate-900 focus:bg-white transition-colors" 
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-semibold">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Wartość zamówienia</span>
              <span className="text-xl font-black text-slate-900">{totalPrice} PLN</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                disabled={submitting}
                onClick={() => handleProcess('JUST_RESERVE')}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
              >
                {submitting ? 'Czekaj...' : 'Zarezerwuj ⏱'}
              </button>
              <button 
                type="button"
                disabled={submitting}
                onClick={() => handleProcess('GO_TO_PAY')}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer text-center"
              >
                {submitting ? 'Czekaj...' : 'Kup bilet  '}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}