import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';  

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  
   
  const { currentUser, isAdminUser, logout } = useAuth();

  const handleLogout = () => {
    logout();  
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          { }
          <Link 
            to={isAdminUser ? "/admin" : (currentUser ? "/events" : "/")} 
            className="flex items-center gap-2 font-black tracking-widest text-white text-lg hover:opacity-90 transition-opacity"
          >
            TICKET.PORTAL
          </Link>

          { }
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
            {currentUser && (
              isAdminUser ? (
                <>
                  <Link to="/admin" className={`transition-colors ${location.pathname === '/admin' ? 'text-white' : 'hover:text-white'}`}>Wydarzenia</Link>
                  <Link to="/admin/users" className={`transition-colors ${location.pathname === '/admin/users' ? 'text-white' : 'hover:text-white'}`}>Użytkownicy</Link>
                  <Link to="/admin/audit" className={`transition-colors ${location.pathname === '/admin/audit' ? 'text-white' : 'hover:text-white'}`}>Audit Log</Link>
                </>
              ) : (
                <>
                  <Link to="/events" className={`transition-colors ${location.pathname === '/events' ? 'text-white' : 'hover:text-white'}`}>Wydarzenia</Link>
                  <Link to="/profile" className={`transition-colors ${location.pathname === '/profile' ? 'text-white' : 'hover:text-white'}`}>Moje konto</Link>
                </>
              )
            )}
          </div>

          { }
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="flex items-center gap-4">
                { }
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  {currentUser.firstName} {currentUser.lastName}
                </span>

                <span className={`text-[9px] uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded ${
                  isAdminUser ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAdminUser ? 'Admin' : 'Klient'}
                </span>
                
                <button 
                  onClick={handleLogout}
                  className="text-rose-400 hover:text-rose-300 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Wyloguj
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}