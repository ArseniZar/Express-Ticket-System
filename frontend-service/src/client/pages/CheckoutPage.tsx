import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

type ScreenState = 'RESERVED_INFO' | 'PAYMENT_FORM' | 'PROCESSING' | 'SUCCESS';

interface BookingDetails {
  bookingId: number;
  userId: number;
  eventId: number;
  seats: number;
  totalPrice: number;
  status: string;
}

interface EventDetails {
  eventId: number;
  title: string;
  price: number;
}

interface PayBookingResponse {
  bookingId: number;
  status: string;
  totalPrice: number;
  message: string;
}

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get('action');

  const [screen, setScreen] = useState<ScreenState>('PROCESSING');
  const [error, setError] = useState<string | null>(null);

   
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('Ładowanie nazwy...');
  const [successData, setSuccessData] = useState<PayBookingResponse | null>(null);

   
  const loadDataFromApi = async () => {
    try {
      setError(null);

       
      const bookingResponse = await fetch(`/api/bookings/${bookingId}`);
      if (!bookingResponse.ok) {
        throw new Error(`Nie znaleziono rezerwacji o ID #${bookingId}`);
      }
      const bookingData: BookingDetails = await bookingResponse.json();
      setBooking(bookingData);

       
      const eventResponse = await fetch(`/api/inventory/${bookingData.eventId}`);
      if (eventResponse.ok) {
        const eventData: EventDetails = await eventResponse.json();
        setEventTitle(eventData.title);
      } else {
        setEventTitle(`Wydarzenie #${bookingData.eventId}`);
      }

       
      if (action === 'JUST_RESERVE') {
        setScreen('RESERVED_INFO');
      } else {
        setScreen('PAYMENT_FORM');
      }

    } catch (err: any) {
      setError(err.message || 'Błąd ładowania danych transakcji.');
      setScreen('PAYMENT_FORM');
    }
  };

   
  useEffect(() => {
    if (bookingId) {
      loadDataFromApi();
    }
  }, [bookingId, action]);

   
  const handleFinalPayment = async () => {
    setScreen('PROCESSING');
    setError(null);

    try {
      const response = await fetch(`/api/bookings/pay/${bookingId}`, {
        method: 'POST',
        headers: { 'Accept': '*/*' }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Płatność odrzucona (Status: ${response.status})`);
      }

      const data: PayBookingResponse = await response.json();
      setSuccessData(data);
      
       
      const refreshResponse = await fetch(`/api/bookings/${bookingId}`);
      if (refreshResponse.ok) {
        const refreshedBooking: BookingDetails = await refreshResponse.json();
        setBooking(refreshedBooking);
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      setScreen('SUCCESS');

    } catch (err: any) {
      setError(err.message || 'Nie udało się sfinalizować płatności.');
      setScreen('PAYMENT_FORM');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-slate-900">
      
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs text-center mb-6 font-medium animate-in fade-in duration-200">
          ⚠️ {error}
        </div>
      )}

      { }
      {screen === 'RESERVED_INFO' && booking && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center text-lg mx-auto mb-4">⏱</div>
          <h2 className="text-xl font-black text-slate-900 mb-1">Miejsca zarezerwowane!</h2>
          <p className="text-sm text-slate-500 mb-6">Twoja rezerwacja została pomyślnie zarejestrowana w systemie.</p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-sm space-y-2.5 font-mono mb-6">
            <p><span className="text-slate-400">ID Rezerwacji:</span> <span className="text-slate-900 font-bold">#{booking.bookingId}</span></p>
            <p><span className="text-slate-400">Wydarzenie:</span> <span className="text-slate-800 font-bold">{eventTitle}</span></p>
            <p><span className="text-slate-400">Liczba biletów:</span> <span className="text-slate-800 font-bold">{booking.seats} szt.</span></p>
            <p><span className="text-slate-400">Koszt łączny:</span> <span className="text-slate-900 font-bold">{booking.totalPrice} PLN</span></p>
            <p>
              <span className="text-slate-400">Status (status):</span>{' '}
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold font-mono">
                {booking.status}
              </span>
            </p>
          </div>

          <button onClick={() => navigate('/events')} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer">
            Rozumiem, wróć do oferty
          </button>
        </div>
      )}

      { }
      {screen === 'PAYMENT_FORM' && booking && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Krok 2 z 2 • Autoryzacja płatności</span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mb-6">Sfinalizuj swoje zamówienie</h1>

          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Identyfikator rezerwacji:</span>
              <span className="font-mono font-bold text-slate-800">#{booking.bookingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wydarzenie:</span>
              <span className="font-bold text-slate-800 text-right max-w-[260px]">{eventTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Zamówione bilety:</span>
              <span className="font-bold text-slate-800">{booking.seats} szt.</span>
            </div>
            <div className="pt-3 border-t border-dashed border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Do zapłaty:</span>
              <span className="text-xl font-black text-slate-900 font-mono">{booking.totalPrice} PLN</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/profile')} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer">
              Anuluj
            </button>
            <button onClick={handleFinalPayment} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer">
              Kupuję i płacę  
            </button>
          </div>
        </div>
      )}

      { }
      {screen === 'PROCESSING' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-xs text-slate-400 font-mono tracking-wider animate-pulse">Przetwarzanie transakcji w systemie...</p>
        </div>
      )}

      { }
      {screen === 'SUCCESS' && successData && booking && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center text-lg mx-auto mb-4">✓</div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Sukces!</h2>
          <p className="text-sm text-slate-500 mb-6">{successData.message || 'Booking payment processed successfully'}</p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-sm space-y-2.5 font-mono mb-6">
            <p><span className="text-slate-400">ID Rezerwacji (bookingId):</span> <span className="text-slate-900 font-bold">#{booking.bookingId}</span></p>
            
            { }
            <p><span className="text-slate-400">Liczba biletów:</span> <span className="text-slate-800 font-bold">{booking.seats} szt.</span></p> 
            
            <p><span className="text-slate-400">Pobrana kwota (totalPrice):</span> <span className="text-emerald-600 font-mono font-bold">{booking.totalPrice} PLN</span></p>
            <p>
              <span className="text-slate-400">Status końcowy (status):</span>{' '}
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-bold font-sans">
                {booking.status}
              </span>
            </p>
          </div>

          <button onClick={() => navigate('/profile')} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer">
            Powrót do profilu
          </button>
        </div>
      )}

    </div>
  );
}