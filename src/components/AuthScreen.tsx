import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { api, User } from '@/lib/api';
import { toast } from 'sonner';

type Props = { onAuth: (user: User) => void };

type Mode = 'login' | 'register';
type Role = 'resident' | 'dispatcher' | 'master';

const ROLES: { id: Role; label: string; icon: string; desc: string }[] = [
  { id: 'resident', label: 'Жилец', icon: 'Home', desc: 'Подать заявку о проблеме' },
  { id: 'dispatcher', label: 'Диспетчер', icon: 'Headphones', desc: 'Принимать и распределять заявки' },
  { id: 'master', label: 'Мастер', icon: 'Wrench', desc: 'Выполнять назначенные задачи' },
];

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('resident');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', address: '' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    try {
      let res;
      if (mode === 'login') {
        res = await api.login({ phone: form.phone, password: form.password });
      } else {
        res = await api.register({
          name: form.name, phone: form.phone, password: form.password,
          role, address: form.address,
        });
      }
      localStorage.setItem('jkh_token', res.token);
      onAuth(res.user);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
          <Icon name="Building2" size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Диспетчерская ЖКХ</h1>
        <p className="text-sm text-muted-foreground mt-1">Служба учёта заявок жильцов</p>
      </div>

      <Card className="w-full max-w-sm p-6 border-border shadow-sm animate-scale-in">
        {/* Tabs */}
        <div className="flex rounded-xl bg-secondary p-1 mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {/* Role picker (только при регистрации) */}
          {mode === 'register' && (
            <div className="grid gap-2">
              <Label>Кто вы?</Label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      role === r.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <Icon name={r.icon} size={20} />
                    <span className="text-xs font-semibold">{r.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {ROLES.find((r) => r.id === role)?.desc}
              </p>
            </div>
          )}

          {mode === 'register' && (
            <div className="grid gap-2">
              <Label htmlFor="name">Полное имя</Label>
              <Input id="name" placeholder="Иванов Иван Иванович" value={form.name} onChange={set('name')} />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="phone">Номер телефона</Label>
            <Input id="phone" placeholder="+7 900 000-00-00" type="tel" value={form.phone} onChange={set('phone')} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Пароль {mode === 'register' && <span className="text-muted-foreground font-normal">(мин. 6 символов)</span>}</Label>
            <Input id="password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>

          {mode === 'register' && role === 'resident' && (
            <div className="grid gap-2">
              <Label htmlFor="address">Адрес (необязательно)</Label>
              <Input id="address" placeholder="ул. Ленина, 12, кв. 45" value={form.address} onChange={set('address')} />
            </div>
          )}

          <Button className="w-full gap-2 mt-1" onClick={submit} disabled={loading}>
            {loading
              ? <><Icon name="Loader" size={16} className="animate-spin" /> Загрузка...</>
              : <><Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={16} />
                {mode === 'login' ? 'Войти' : 'Создать аккаунт'}</>
            }
          </Button>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Демо-аккаунты</p>
          <div className="flex flex-col gap-1.5">
            {[
              { label: 'Диспетчер', phone: '+70000000001', pwd: 'dispatcher123' },
              { label: 'Мастер', phone: '+70000000002', pwd: 'master123' },
            ].map((d) => (
              <button
                key={d.phone}
                onClick={() => {
                  setMode('login');
                  setForm((f) => ({ ...f, phone: d.phone, password: d.pwd }));
                  toast(`Данные ${d.label} заполнены`);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors text-xs"
              >
                <span className="font-semibold">{d.label}</span>
                <span className="text-muted-foreground">{d.phone}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}