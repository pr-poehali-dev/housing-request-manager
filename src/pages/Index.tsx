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
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'requests', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'residents', label: 'Жильцы', icon: 'Users' },
  { id: 'masters', label: 'Мастера', icon: 'Wrench' },
  { id: 'analytics', label: 'Аналитика', icon: 'BarChart3' },
  { id: 'notifications', label: 'Оповещения', icon: 'Bell' },
  { id: 'categories', label: 'Категории', icon: 'Tags' },
  { id: 'archive', label: 'Архив', icon: 'Archive' },
];

const METRICS = [
  { label: 'Новые заявки', value: '24', delta: '+6 сегодня', icon: 'Inbox', tone: 'text-primary' },
  { label: 'В работе', value: '37', delta: '12 мастеров', icon: 'Loader', tone: 'text-amber-500' },
  { label: 'Выполнено за день', value: '58', delta: '+18%', icon: 'CircleCheck', tone: 'text-emerald-500' },
  { label: 'Ср. время решения', value: '3.2ч', delta: '-24 мин', icon: 'Clock', tone: 'text-violet-500' },
];

type Status = 'Новая' | 'В работе' | 'Выполнена' | 'Ожидает';

const STATUS_STYLES: Record<Status, string> = {
  'Новая': 'bg-primary/10 text-primary border-primary/20',
  'В работе': 'bg-amber-100 text-amber-700 border-amber-200',
  'Выполнена': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Ожидает': 'bg-slate-100 text-slate-600 border-slate-200',
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
  { name: 'Петров Иван', spec: 'Сантехник', load: 4, status: 'На выезде', av: 'ПИ' },
  { name: 'Сидоров Алексей', spec: 'Электрик', load: 2, status: 'Свободен', av: 'СА' },
  { name: 'Кузнецов Виктор', spec: 'Отопление', load: 1, status: 'Свободен', av: 'КВ' },
  { name: 'Морозов Пётр', spec: 'Универсал', load: 3, status: 'На выезде', av: 'МП' },
];

const Index = () => {
  const [active, setActive] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState<Request[]>(INITIAL_REQUESTS);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ addr: '', cat: '', resident: '', priority: 'Средний', desc: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [r.id, r.addr, r.cat, r.resident, r.master].some((f) => f.toLowerCase().includes(q))
    );
  }, [search, requests]);

  const navLabel = NAV.find((n) => n.id === active)?.label ?? 'Дашборд';

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

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card px-4 py-6 fixed h-full">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Icon name="Building2" className="text-primary-foreground" size={22} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm">Диспетчерская</p>
            <p className="text-xs text-muted-foreground">Служба ЖКХ</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active === n.id
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon name={n.icon} size={18} />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-3 py-4 rounded-2xl bg-accent">
          <div className="flex items-center gap-2 text-accent-foreground mb-1">
            <Icon name="MessageSquareText" size={16} />
            <span className="text-xs font-semibold">СМС-уведомления</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">Жильцы получают статус заявки и время визита мастера автоматически</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 lg:ml-64 px-5 sm:px-8 py-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {active === 'dashboard' ? 'Панель управления' : navLabel}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Среда, 18 июня · смена дневная</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск заявки..."
                className="pl-9 w-56 bg-card"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              className="relative shrink-0"
              onClick={() => toast('3 новых оповещения', { description: 'Заявки №4820, №4819 ожидают назначения' })}
            >
              <Icon name="Bell" size={18} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
            </Button>
            <Button className="gap-2 shrink-0" onClick={() => setOpenNew(true)}>
              <Icon name="Plus" size={18} />
              <span className="hidden sm:inline">Новая заявка</span>
            </Button>
          </div>
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {METRICS.map((m, i) => (
            <Card
              key={m.label}
              className="p-5 border-border hover:shadow-lg hover:shadow-primary/5 transition-all animate-scale-in"
              style={{ animationDelay: `${i * 70}ms`, opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center ${m.tone}`}>
                  <Icon name={m.icon} size={20} />
                </div>
                <span className="text-xs text-muted-foreground">{m.delta}</span>
              </div>
              <p className="text-3xl font-extrabold mt-4 tracking-tight">{m.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{m.label}</p>
            </Card>
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Requests table */}
          <Card className="xl:col-span-2 p-0 overflow-hidden border-border">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Icon name="ClipboardList" size={18} className="text-primary" />
                <h2 className="font-bold">Активные заявки</h2>
                <Badge variant="outline" className="ml-1">{filtered.length}</Badge>
              </div>
              <button
                className="text-sm text-primary font-medium hover:underline"
                onClick={() => setActive('requests')}
              >
                Все заявки
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="font-medium px-5 py-3">Заявка</th>
                    <th className="font-medium px-3 py-3">Категория</th>
                    <th className="font-medium px-3 py-3 hidden md:table-cell">Мастер</th>
                    <th className="font-medium px-3 py-3">Статус</th>
                    <th className="font-medium px-5 py-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold">{r.id}</p>
                        <p className="text-xs text-muted-foreground">{r.addr}</p>
                      </td>
                      <td className="px-3 py-3.5">{r.cat}</td>
                      <td className="px-3 py-3.5 hidden md:table-cell text-muted-foreground">{r.master}</td>
                      <td className="px-3 py-3.5">
                        <Badge variant="outline" className={`font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === 'Новая' && (
                          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => assignRequest(r.id)}>
                            <Icon name="UserPlus" size={14} /> Назначить
                          </Button>
                        )}
                        {(r.status === 'В работе' || r.status === 'Ожидает') && (
                          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => completeRequest(r.id)}>
                            <Icon name="Check" size={14} /> Завершить
                          </Button>
                        )}
                        {r.status === 'Выполнена' && (
                          <span className="text-xs text-muted-foreground">{r.time}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">Ничего не найдено</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Masters */}
          <Card className="p-5 border-border">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="Wrench" size={18} className="text-primary" />
              <h2 className="font-bold">Мастера на смене</h2>
            </div>
            <div className="space-y-3">
              {MASTERS.map((m) => (
                <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                    {m.av}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.spec}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${m.status === 'Свободен' ? 'text-emerald-600' : 'text-amber-600'}`}>{m.status}</span>
                    <p className="text-xs text-muted-foreground">{m.load} заявок</p>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={() => toast.success('Заявки распределены', { description: 'Свободные мастера получили новые задачи' })}
            >
              <Icon name="UserPlus" size={16} />
              Распределить заявки
            </Button>
          </Card>
        </div>
      </main>

      {/* New request dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Новая заявка</DialogTitle>
            <DialogDescription>Заполните данные — жильцу автоматически уйдёт СМС о приёме заявки</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="desc">Описание проблемы</Label>
              <Textarea id="desc" placeholder="Опишите ситуацию..." value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Отмена</Button>
            <Button onClick={createRequest} className="gap-2">
              <Icon name="Send" size={16} /> Создать заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
