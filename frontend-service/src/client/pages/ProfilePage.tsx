import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GetAllBookingByUserResponse {
  bookingId: number;
  userId: number;
  eventId: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  seats: number;
  totalPrice: number; 
  createdAt: string; 
}

interface EventItem {
  eventId: number;
  title: string;
}

interface GetWalletByUserResponse {
  userId: number;
  balance: number;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<GetAllBookingByUserResponse[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<number, string>>({});
  const [userBalance, setUserBalance] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');

   
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositLoading, setDepositLoading] = useState(false);

  const savedUserRaw = localStorage.getItem('currentUser');
  const currentUser = savedUserRaw ? JSON.parse(savedUserRaw) : null;

   
  const fetchWalletBalance = async () => {
    if (!currentUser) return;
    try {
      const walletResponse = await fetch(`/api/wallets/user/${currentUser.userId}`);
      if (walletResponse.ok) {
        const walletData: GetWalletByUserResponse = await walletResponse.json();
        setUserBalance(walletData.balance);
      }
    } catch (err) {
      console.error('Błąd pobierania salda:', err);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setError('Musisz być zalogowany, aby zobaczyć swój profil.');
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const eventsResponse = await fetch('/api/inventory');
        let mapping: Record<number, string> = {};
        if (eventsResponse.ok) {
          const eventsList: EventItem[] = await eventsResponse.json();
          eventsList.forEach(e => { mapping[e.eventId] = e.title; });
          setEventsMap(mapping);
        }

        await fetchWalletBalance();

        const bookingsResponse = await fetch(`/api/bookings/user/${currentUser.userId}`);
        if (!bookingsResponse.ok) {
          throw new Error(`Błąd pobierania rezerwacji: ${bookingsResponse.status}`);
        }

        const data: GetAllBookingByUserResponse[] = await bookingsResponse.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Nie udało się pobrać danych profilu.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

   
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || depositAmount <= 0) return;

    setDepositLoading(true);
    try {
      const response = await fetch('/api/wallets/user/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.userId,
          amount: Number(depositAmount)
        })
      });

      if (!response.ok) {
        throw new Error(`Błąd depozytu: ${response.status}`);
      }

       
      await fetchWalletBalance();
      setIsDepositModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Nie udało się zasilić konta.');
    } finally {
      setDepositLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const formatDateTime = (dateStr: string) => {
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

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-400 text-xs uppercase tracking-wider">Ładowanie profilu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-900">
      
      { }
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white font-black rounded-xl flex items-center justify-center text-sm uppercase tracking-wider">
            {currentUser?.firstName[0]}{currentUser?.lastName[0]}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">{currentUser?.firstName} {currentUser?.lastName}</h1>
            <p className="text-xs text-slate-400 font-mono">@{currentUser?.username} • ID: #{currentUser?.userId}</p>
          </div>
        </div>

        { }
        <div className="flex sm:flex-row flex-col items-start sm:items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 w-full sm:w-auto justify-between">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Dostępne środki</span>
            <span className="text-lg font-black text-slate-900 font-mono block mt-0.5">
              {userBalance !== null ? `${userBalance.toFixed(2)} PLN` : '0.00 PLN'}
            </span>
          </div>
          <button
            onClick={() => {
              setDepositAmount(100);
              setIsDepositModalOpen(true);
            }}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            Doładuj
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Twoje zamówienia</h2>
        <p className="text-xs text-slate-400">Zarządzaj rezerwacjami i opłaconymi biletami.</p>
      </div>

      { }
      <div className="flex gap-2 border-b border-slate-200 pb-3 mb-8 text-xs font-bold uppercase tracking-wider">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Wszystkie ({bookings.length})
        </button>
        <button 
          onClick={() => setActiveTab('CONFIRMED')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'CONFIRMED' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Opłacone ({bookings.filter(b => b.status === 'CONFIRMED').length})
        </button>
        <button 
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'PENDING' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          W rezerwacji ({bookings.filter(b => b.status === 'PENDING').length})
        </button>
      </div>

      {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs text-center mb-6">⚠️ {error}</div>}

      { }
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed text-slate-400 text-xs uppercase tracking-wider">
          Brak historii zamówień.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const eventName = eventsMap[booking.eventId] || `Wydarzenie #${booking.eventId}`;

            return (
              <div 
                key={booking.bookingId}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">Rezerwacja #{booking.bookingId}</span>
                    <span className="text-[10px] text-slate-400 font-mono">• {formatDateTime(booking.createdAt)}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider ${
                      booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      booking.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">{eventName}</h3>
                  <p className="text-xs text-slate-500">
                    Miejsca: <span className="font-bold text-slate-800">{booking.seats} szt.</span>
                    {" • "}
                    Razem: <span className="font-bold text-slate-800">{booking.totalPrice} PLN</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {booking.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        localStorage.setItem(`meta_${booking.bookingId}`, JSON.stringify({
                          title: eventName,
                          totalPrice: booking.totalPrice,
                          seats: booking.seats
                        }));
                        navigate(`/checkout/${booking.bookingId}?action=GO_TO_PAY`);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Opłać rezerwację  
                    </button>
                  )}
                  {booking.status === 'CONFIRMED' && (
                    <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      Bilet aktywny ✓
                    </span>
                  )}
                  {booking.status === 'CANCELLED' && (
                    <span className="text-[10px] uppercase tracking-wider text-rose-700 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                      Anulowane
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      { }
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">
              Zasilenie portfela
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Wprowadź kwotę zasilenia konta. Środki zostaną natychmiast przypisane do Twojego salda.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">
                  Kwota doładowania (PLN)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-black text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors"
                />
              </div>

              { }
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setDepositAmount(amount)}
                    className={`py-2 border rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      depositAmount === amount 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                        : 'border-slate-200 hover:border-slate-400 text-slate-700 bg-white'
                    }`}
                  >
                    +{amount} PLN
                  </button>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  disabled={depositLoading}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={depositLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {depositLoading ? 'Przetwarzanie...' : 'Zatwierdź ➔'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}