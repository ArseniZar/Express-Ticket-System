import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  

type AuthMode = 'LOGIN' | 'REGISTER';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();  
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [loginUsername, setLoginUsername] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number>(18);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const saveUserAndRedirect = (user: { userId: number; username: string; firstName: string; lastName: string }) => {
     
    login(user); 
    
    setSuccessMessage(`Witaj, ${user.firstName}! Zostałeś zalogowany.`);
    
    setTimeout(() => {
      if (user.username === 'admin') {
        navigate('/admin');
      } else {
        navigate('/events');
      }
    }, 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/username/${loginUsername}`, {
        method: 'GET',
        headers: { 'Accept': '*/*' }
      });

      if (response.status === 404) throw new Error('Użytkownik nie istnieje. Zarejestruj się!');
      if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
      
      const userData = await response.json();
      saveUserAndRedirect({ 
        userId: userData.userId, 
        username: userData.username, 
        firstName: userData.firstName, 
        lastName: userData.lastName 
      });
    } catch (err: any) {
      setError(err.message || 'Nie udało się zalogować.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        body: JSON.stringify({ username, firstName, lastName, age: Number(age) }),
      });

      if (!response.ok) throw new Error(`Błąd rejestracji: ${response.status}`);
      
      const resData = await response.json();
      saveUserAndRedirect({ userId: resData.userId, username, firstName, lastName });
    } catch (err: any) {
      setError(err.message || 'Błąd rejestracji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-slate-900">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        
        <div className="flex bg-slate-50 p-1 rounded-xl mb-8 border border-slate-200 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              mode === 'LOGIN' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => { setMode('REGISTER'); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all cursor-pointer ${
              mode === 'REGISTER' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-800'
            }`}
          >
            Rejestracja
          </button>
        </div>

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-xs font-medium text-center mb-6 uppercase tracking-wider">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs text-center mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        {mode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Nazwa użytkownika</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="np. admin lub arseni99"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors font-medium"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !!successMessage} 
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              {loading ? 'Sprawdzanie...' : 'Zaloguj się ➔'}
            </button>
          </form>
        )}

        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Twój unikalny nick"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Imię</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jan"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Nazwisko</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Kowalski"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Wiek</label>
              <input
                type="number"
                required
                min="1"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-colors font-bold"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !!successMessage} 
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            >
              {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}