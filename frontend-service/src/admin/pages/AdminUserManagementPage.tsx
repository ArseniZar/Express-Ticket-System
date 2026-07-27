import { useState, useEffect } from 'react';

 
interface UserItem {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  age: number;
}

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number>(18);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error(`Błąd pobierania użytkowników: ${response.status}`);
      const data: UserItem[] = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Nie udało się załadować listy użytkowników.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setFirstName('');
    setLastName('');
    setAge(18);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setUsername(user.username);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setAge(user.age);
    setIsModalOpen(true);
  };

   
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      username,
      firstName,
      lastName,
      age: Number(age)
    };

    try {
      let response;
      if (editingUser) {
         
        response = await fetch(`/api/users/${editingUser.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
         
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error(`Operacja nieudana: ${response.status}`);

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Błąd zapisu użytkownika.');
    }
  };

   
  const handleDelete = async (userId: number) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć użytkownika o ID #${userId}?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Błąd usuwania: ${response.status}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Nie udało się usunąć użytkownika.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
        <p className="text-slate-400 text-xs uppercase tracking-wider">Ładowanie użytkowników...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-slate-900">
      
      { }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Zarządzanie Użytkownikami</h1>
          <p className="text-xs text-slate-400 mt-1">Przeglądanie, edycja oraz usuwanie kont użytkowników z bazy danych.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          + Dodaj użytkownika
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-xl text-xs font-medium mb-6">
          ⚠️ Błąd: {error}
        </div>
      )}

      { }
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                <th className="py-4 px-6 w-16">ID</th>
                <th className="py-4 px-6">Username (Nick)</th>
                <th className="py-4 px-6">Imię i Nazwisko</th>
                <th className="py-4 px-6 w-24">Wiek</th>
                <th className="py-4 px-6 text-right w-36">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-xs text-slate-400 uppercase tracking-wider">
                    Brak użytkowników w bazie danych.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">#{user.userId}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">@{user.username}</td>
                    <td className="py-4 px-6">{user.firstName} {user.lastName}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{user.age} lat</td>
                    
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="w-20 py-1.5 text-center border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-600 transition-colors cursor-pointer"
                        >
                          Edytuj
                        </button>
                        <button
                          onClick={() => handleDelete(user.userId)}
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

      { }
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
            
            <h2 className="text-lg font-black text-slate-900 tracking-tight mb-6">
              {editingUser ? `Edycja użytkownika #${editingUser.userId}` : 'Tworzenie nowego użytkownika'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Username (Unikalny nick)</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="np. arseni99"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Imię</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Jan"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Nazwisko</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Kowalski"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Wiek</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none font-bold"
                />
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
                  {editingUser ? 'Zapisz zmiany' : 'Utwórz konto'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}