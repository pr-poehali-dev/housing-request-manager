import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import AuthScreen from '@/components/AuthScreen';
import ResidentApp from '@/components/ResidentApp';
import DispatcherApp from '@/components/DispatcherApp';
import MasterApp from '@/components/MasterApp';
import { User } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jkh_token');
    const saved = localStorage.getItem('jkh_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('jkh_user');
      }
    }
    setLoading(false);
  }, []);

  const handleAuth = (u: User) => {
    localStorage.setItem('jkh_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('jkh_token');
    localStorage.removeItem('jkh_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Icon name="Loader" size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      {!user && <AuthScreen onAuth={handleAuth} />}
      {user?.role === 'resident' && <ResidentApp user={user} onLogout={handleLogout} />}
      {user?.role === 'dispatcher' && <DispatcherApp user={user} onLogout={handleLogout} />}
      {user?.role === 'master' && <MasterApp user={user} onLogout={handleLogout} />}
    </>
  );
}
