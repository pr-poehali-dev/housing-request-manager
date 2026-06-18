import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const SIDEBAR_NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'requests', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'residents', label: 'Жильцы', icon: 'Users' },
  { id: 'masters', label: 'Мастера', icon: 'Wrench' },
  { id: 'analytics', label: 'Аналитика', icon: 'BarChart3' },
  { id: 'notifications', label: 'Оповещения', icon: 'Bell' },
  { id: 'categories', label: 'Категории', icon: 'Tags' },
  { id: 'archive', label: 'Архив', icon: 'Archive' },
];

const BOTTOM_NAV = [
  { id: 'dashboard', label: 'Главная', icon: 'LayoutDashboard' },
  { id: 'requests', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'masters', label: 'Мастера', icon: 'Wrench' },
  { id: 'notifications', label: 'Уведомления', icon: 'Bell' },
];

const METRICS = [
  { label: 'Новые', value: '24', delta: '+6', icon: 'Inbox', tone: 'text-primary', bg: 'bg-primary/10' },
  { label: 'В работе', value: '37', delta: '12 мастеров', icon: 'Loader', tone: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Выполнено', value: '58', delta: '+18%', icon: 'CircleCheck', tone: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Ср. время', value: '3.2ч', delta: '-24м', icon: 'Clock', tone: 'text-violet-500', bg: 'bg-violet-50' },
];

type Status = 'Новая' | 'В работе' | 'Выполнена' | 'Ожидает';

const STATUS_STYLES: Record<Status, string> = {
  'Новая': 'bg-primary/10 text-primary border-primary/20',
  'В работе': 'bg-amber-100 text-amber-700 border-amber-200',
  'Выполнена': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Ожидает': 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_STYLES: Record<string, string> = {
  'Срочно': 'bg-red-100 text-red-600',
  'Высокий': 'bg-orange-100 text-orange-600',
  'Средний': 'bg-yellow-100 text-yellow-700',
  'Низкий': 'bg-slate-100 text-slate-500',
};

const CATEGORIES = ['Протечка воды', 'Не работает лифт', 'Электрика', 'Отопление', 'Засор канализации', 'Замена замка', 'Прочее'];

type Request = {
  id: string; addr: string; cat: string; resident: string;
  status: Status; master: string; time: string; priority: string;
};

const INITIAL_REQUESTS: Request[] = [
  { id: '№4821', addr: 'ул. Ленина, 12 — кв. 45', cat: 'Протечка воды', resident: 'Смирнова А.В.', status: 'В работе', master: 'Петров И.', time: '10:24', priority: 'Срочно' },
  { id: '№4820', addr: 'пр. Мира, 8 — кв. 112', cat: 'Не работает лифт', resident: 'Козлов Д.С.', status: 'Новая', master: '—', time: '10:05', priority: 'Высокий' },
  { id: '№4819', addr: 'ул. Садовая, 3 — кв. 7', cat: 'Электрика', resident: 'Иванова М.П.', status: 'Ожидает', master: 'Сидоров А.', time: '09:48', priority: 'Средний' },
  { id: '№4818', addr: 'ул. Гагарина, 21 — кв. 88', cat: 'Отопление', resident: 'Фёдоров Р.К.', status: 'Выполнена', master: 'Кузнецов В.', time: '09:12', priority: 'Низкий' },
  { id: '№4817', addr: 'пр. Победы, 5 — кв. 33', cat: 'Засор канализации', resident: 'Орлова Е.Н.', status: 'В работе', master: 'Петров И.', time: '08:50', priority: 'Высокий' },
  { id: '№4816', addr: 'ул. Лесная, 17 — кв. 60', cat: 'Замена замка', resident: 'Белов С.А.', status: 'Выполнена', master: 'Морозов П.', time: '08:30', priority: 'Низкий' },
];

const MASTERS = [
  { name: 'Петров Иван', spec: 'Сантехник', load: 4, status: 'На выезде', av: 'ПИ', phone: '+7 900 123-45-67' },
  { name: 'Сидоров Алексей', spec: 'Электрик', load: 2, status: 'Свободен', av: 'СА', phone: '+7 900 234-56-78' },
  { name: 'Кузнецов Виктор', spec: 'Отопление', load: 1, status: 'Свободен', av: 'КВ', phone: '+7 900 345-67-89' },
  { name: 'Морозов Пётр', spec: 'Универсал', load: 3, status: 'На выезде', av: 'МП', phone: '+7 900 456-78-90' },
];

const NOTIFS = [
  { id: 1, text: 'Заявка №4820 ожидает назначения мастера', time: '10:05', read: false, icon: 'AlertCircle', tone: 'text-amber-500' },
  { id: 2, text: 'Петров И. завершил заявку №4815', time: '09:40', read: false, icon: 'CircleCheck', tone: 'text-emerald-500' },
  { id: 3, text: 'Новая заявка №4819 от Ивановой М.П.', time: '09:48', read: true, icon: 'Inbox', tone: 'text-primary' },
  { id: 4, text: 'СМС отправлено: Фёдоров Р.К. — заявка выполнена', time: '09:12', read: true, icon: 'MessageSquareText', tone: 'text-slate-400' },
  { id: 5, text: 'Кузнецов В. приступил к заявке №4818', time: '08:55', read: true, icon: 'Wrench', tone: 'text-violet-500' },
];

// ─── Screens ─────────────────────────────────────────────────────────────────

const DashboardScreen = ({
  requests, onNew, onAssign, onComplete, onNav,
}: {
  requests: Request[];
  onNew: () => void;
  onAssign: (id: string) => void;
  onComplete: (id: string) => void;
  onNav: (id: string) => void;
}) => {
  const active = requests.filter((r) => r.status !== 'Выполнена').slice(0, 3);
  return (
    <div className="flex flex-col gap-5 pb-2">
      {/* Hero */}
      <div className="bg-primary rounded-2xl px-5 pt-5 pb-6 text-primary-foreground">
        <p className="text-sm font-medium opacity-80">Среда, 18 июня</p>
        <p className="text-xl font-extrabold mt-1">Смена дневная</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-extrabold">{m.value}</p>
              <p className="text-xs opacity-75 mt-0.5">{m.label}</p>
              <p className="text-[11px] opacity-60 mt-0.5">{m.delta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onNew}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-secondary transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon name="Plus" size={20} className="text-primary" />
          </div>
          <span className="text-xs font-semibold text-center leading-tight">Новая заявка</span>
        </button>
        <button
          onClick={() => onNav('requests')}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-secondary transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Icon name="ClipboardList" size={20} className="text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-center leading-tight">Все заявки</span>
        </button>
        <button
          onClick={() => onNav('masters')}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:bg-secondary transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Icon name="Wrench" size={20} className="text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-center leading-tight">Мастера</span>
        </button>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Активные заявки</h2>
          <button onClick={() => onNav('requests')} className="text-sm text-primary font-medium">Все</button>
        </div>
        <div className="flex flex-col gap-3">
          {active.map((r) => (
            <Card key={r.id} className="p-4 border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm">{r.id}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[r.status]}`}>{r.status}</Badge>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_STYLES[r.priority]}`}>{r.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{r.addr}</p>
                  <p className="text-xs mt-0.5">{r.cat}</p>
                </div>
                <div className="shrink-0">
                  {r.status === 'Новая' && (
                    <Button size="sm" className="h-8 text-xs gap-1" onClick={() => onAssign(r.id)}>
                      <Icon name="UserPlus" size={13} />Назначить
                    </Button>
                  )}
                  {(r.status === 'В работе' || r.status === 'Ожидает') && (
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => onComplete(r.id)}>
                      <Icon name="Check" size={13} />Готово
                    </Button>
                  )}
                </div>
              </div>
              {r.master !== '—' && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                  <Icon name="Wrench" size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{r.master}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{r.time}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const RequestsScreen = ({
  requests, onAssign, onComplete, onNew,
}: {
  requests: Request[];
  onAssign: (id: string) => void;
  onComplete: (id: string) => void;
  onNew: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchFilter = filter === 'all' || r.status === filter;
      const matchSearch = !q || [r.id, r.addr, r.cat, r.resident, r.master].some((f) => f.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [search, filter, requests]);

  const FILTERS: { id: 'all' | Status; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'Новая', label: 'Новые' },
    { id: 'В работе', label: 'В работе' },
    { id: 'Ожидает', label: 'Ожидает' },
    { id: 'Выполнена', label: 'Выполнена' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Поиск заявки..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filter === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((r) => (
          <Card key={r.id} className="p-4 border-border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm">{r.id}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[r.status]}`}>{r.status}</Badge>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_STYLES[r.priority]}`}>{r.priority}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.addr}</p>
                <p className="text-xs font-medium mt-0.5">{r.cat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.resident}</p>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <span className="text-xs text-muted-foreground">{r.time}</span>
                {r.status === 'Новая' && (
                  <Button size="sm" className="h-8 text-xs gap-1" onClick={() => onAssign(r.id)}>
                    <Icon name="UserPlus" size={13} />Назначить
                  </Button>
                )}
                {(r.status === 'В работе' || r.status === 'Ожидает') && (
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => onComplete(r.id)}>
                    <Icon name="Check" size={13} />Готово
                  </Button>
                )}
              </div>
            </div>
            {r.master !== '—' && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border">
                <Icon name="Wrench" size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Мастер: {r.master}</span>
              </div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Ничего не найдено</div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={onNew}
        className="fixed bottom-24 right-5 w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform z-30"
      >
        <Icon name="Plus" size={26} />
      </button>
    </div>
  );
};

const MastersScreen = () => {
  const [selected, setSelected] = useState<typeof MASTERS[0] | null>(null);
  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex gap-3 text-sm text-muted-foreground mb-1">
        <span>{MASTERS.filter((m) => m.status === 'Свободен').length} свободны</span>
        <span>·</span>
        <span>{MASTERS.filter((m) => m.status === 'На выезде').length} на выезде</span>
      </div>
      {MASTERS.map((m) => (
        <Card
          key={m.name}
          className="p-4 border-border cursor-pointer hover:shadow-md transition-all"
          onClick={() => setSelected(m)}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {m.av}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.spec}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-semibold ${m.status === 'Свободен' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {m.status}
              </span>
              <p className="text-xs text-muted-foreground">{m.load} заявок</p>
            </div>
          </div>
          {/* Load bar */}
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${m.status === 'На выезде' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${Math.min((m.load / 6) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      ))}

      {/* Master detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh]">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {selected.av}
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{selected.name}</p>
                    <p className="text-sm text-muted-foreground font-normal">{selected.spec}</p>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Статус</span>
                  <span className={`text-sm font-semibold ${selected.status === 'Свободен' ? 'text-emerald-600' : 'text-amber-600'}`}>{selected.status}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Активных заявок</span>
                  <span className="text-sm font-semibold">{selected.load}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Телефон</span>
                  <span className="text-sm font-semibold">{selected.phone}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => { toast(`Звонок: ${selected.phone}`); setSelected(null); }}
                >
                  <Icon name="Phone" size={16} /> Позвонить
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => { toast.success('Задача назначена на ' + selected.name); setSelected(null); }}
                >
                  <Icon name="ClipboardList" size={16} /> Назначить
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const NotificationsScreen = () => {
  const [notifs, setNotifs] = useState(NOTIFS);
  const unread = notifs.filter((n) => !n.read).length;

  const markAll = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markOne = (id: number) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} непрочитанных` : 'Всё прочитано'}
        </span>
        {unread > 0 && (
          <button onClick={markAll} className="text-sm text-primary font-medium">Прочитать все</button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {notifs.map((n) => (
          <button
            key={n.id}
            onClick={() => markOne(n.id)}
            className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
              n.read ? 'bg-card border-border opacity-60' : 'bg-white border-border shadow-sm'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read ? 'bg-secondary' : 'bg-primary/10'}`}>
              <Icon name={n.icon} size={18} className={n.read ? 'text-muted-foreground' : n.tone} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{n.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [active, setActive] = useState('dashboard');
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
  const [openNew, setOpenNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [form, setForm] = useState({ addr: '', cat: '', resident: '', priority: 'Средний', desc: '' });

  const unreadCount = NOTIFS.filter((n) => !n.read).length;

  const createRequest = () => {
    if (!form.addr || !form.cat || !form.resident) {
      toast.error('Заполните адрес, категорию и жильца');
      return;
    }
    const num = '№' + (4822 + requests.length - INITIAL_REQUESTS.length);
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setRequests([
      { id: num, addr: form.addr, cat: form.cat, resident: form.resident, status: 'Новая', master: '—', time, priority: form.priority },
      ...requests,
    ]);
    setOpenNew(false);
    setForm({ addr: '', cat: '', resident: '', priority: 'Средний', desc: '' });
    toast.success(`Заявка ${num} создана`, { description: 'СМС жильцу отправлено автоматически' });
  };

  const completeRequest = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Выполнена' } : r)));
    toast.success(`Заявка ${id} выполнена`, { description: 'Жильцу отправлено СМС о завершении' });
  };

  const assignRequest = (id: string) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'В работе', master: 'Петров И.' } : r)));
    toast.success(`Мастер назначен на ${id}`, { description: 'Жильцу отправлено СМС о визите мастера' });
  };

  const PAGE_TITLES: Record<string, string> = {
    dashboard: 'Диспетчерская',
    requests: 'Заявки',
    masters: 'Мастера',
    notifications: 'Уведомления',
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto">
      <Toaster position="top-center" richColors />

      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <Icon name="Menu" size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Building2" size={15} className="text-primary-foreground" />
          </div>
          <span className="font-bold text-base">{PAGE_TITLES[active] ?? 'ЖКХ'}</span>
        </div>
        <button
          onClick={() => setActive('notifications')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors relative"
        >
          <Icon name="Bell" size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
        {active === 'dashboard' && (
          <DashboardScreen
            requests={requests}
            onNew={() => setOpenNew(true)}
            onAssign={assignRequest}
            onComplete={completeRequest}
            onNav={setActive}
          />
        )}
        {active === 'requests' && (
          <RequestsScreen
            requests={requests}
            onAssign={assignRequest}
            onComplete={completeRequest}
            onNew={() => setOpenNew(true)}
          />
        )}
        {active === 'masters' && <MastersScreen />}
        {active === 'notifications' && <NotificationsScreen />}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-20 safe-area-pb">
        <div className="grid grid-cols-4 px-2 py-2">
          {BOTTOM_NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all relative ${
                active === n.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active === n.id && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
              )}
              <Icon name={n.icon} size={22} />
              <span className="text-[10px] font-semibold">{n.label}</span>
              {n.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute top-1.5 right-4 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Sidebar drawer (all sections) */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Icon name="Building2" size={20} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">Диспетчерская</p>
              <p className="text-xs text-muted-foreground">Служба ЖКХ</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {SIDEBAR_NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => { setActive(n.id); setMenuOpen(false); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active === n.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon name={n.icon} size={18} />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="mx-4 mt-2 px-3 py-4 rounded-2xl bg-accent">
            <div className="flex items-center gap-2 text-accent-foreground mb-1">
              <Icon name="MessageSquareText" size={14} />
              <span className="text-xs font-semibold">СМС-уведомления</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Жильцы получают статус заявки и время визита мастера автоматически
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* New request dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] mx-auto">
          <DialogHeader>
            <DialogTitle>Новая заявка</DialogTitle>
            <DialogDescription>Жильцу автоматически уйдёт СМС о приёме заявки</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="addr">Адрес и квартира</Label>
              <Input id="addr" placeholder="ул. Ленина, 12 — кв. 45" value={form.addr} onChange={(e) => setForm({ ...form, addr: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resident">Жилец</Label>
              <Input id="resident" placeholder="Смирнова А.В." value={form.resident} onChange={(e) => setForm({ ...form, resident: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Категория</Label>
                <Select value={form.cat} onValueChange={(v) => setForm({ ...form, cat: v })}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Приоритет</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Срочно', 'Высокий', 'Средний', 'Низкий'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Описание</Label>
              <Textarea id="desc" placeholder="Опишите ситуацию..." rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpenNew(false)}>Отмена</Button>
            <Button className="flex-1 gap-2" onClick={createRequest}>
              <Icon name="Send" size={15} />Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
