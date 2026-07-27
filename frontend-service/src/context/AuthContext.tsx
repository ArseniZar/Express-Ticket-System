import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface CurrentUser {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  isAdminUser: boolean;
  login: (user: CurrentUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

   
  useEffect(() => {
    const savedUserRaw = localStorage.getItem('currentUser');
    if (savedUserRaw) {
      try {
        setCurrentUser(JSON.parse(savedUserRaw));
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = (user: CurrentUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);  
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const isAdminUser = currentUser?.username === 'admin';

  return (
    <AuthContext.Provider value={{ currentUser, isAdminUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

 
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}