import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api, User, Request } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  assigned: 'bg-violet-100 text-violet-700 border-violet-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  waiting: 'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_ICONS: Record<string, string> = {
  new: 'Inbox', assigned: 'UserCheck', in_progress: 'Loader',
  done: 'CircleCheck', waiting: 'Clock',
};

const CATEGORIES = ['Протечка воды', 'Не работает лифт', 'Электрика', 'Отопление', 'Засор канализации', 'Замена замка', 'Прочее'];
const PRIORITIES = [
  { value: 'urgent', label: 'Срочно' },
  { value: 'high', label: 'Высокий' },
  { value: 'medium', label: 'Средний' },
  { value: 'low', label: 'Низкий' },
];

const BOTTOM_NAV = [
  { id: 'requests', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'notifications', label: 'Уведомления', icon: 'Bell' },
];

type Props = { user: User; onLogout: () => void };

export default function ResidentApp({ user, onLogout }: Props) {
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [openNew, setOpenNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', address: user.address || '', priority: 'medium' });
  // track which notification ids have been "read" this session
  const [readIds, setReadIds] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('jkh_read_notifs') || '[]')); }
    catch { return new Set(); }
  });

  const load = async () => {
    try {
      const [reqs, notifs] = await Promise.all([api.listRequests(), api.getNotifications()]);
      setRequests(reqs);
      setNotifications(notifs);
    } catch {
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markRead = (id: number) => {
    const next = new Set(readIds).add(id);
    setReadIds(next);
    localStorage.setItem('jkh_read_notifs', JSON.stringify([...next]));
  };

  const markAllRead = () => {
    const next = new Set(notifications.map((n) => n.id));
    setReadIds(next);
    localStorage.setItem('jkh_read_notifs', JSON.stringify([...next]));
  };

  const submit = async () => {
    if (!form.category || !form.description || !form.address) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    setSubmitting(true);
    try {
      await api.createRequest(form);
      toast.success('Заявка отправлена!', { description: 'Диспетчер назначит мастера в ближайшее время' });
      setOpenNew(false);
      setForm({ category: '', description: '', address: user.address || '', priority: 'medium' });
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  const active = requests.filter((r) => r.status !== 'done');
  const done = requests.filter((r) => r.status === 'done');

  const formatDate = (s: string) =>
    new Date(s).toLocaleString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Home" size={16} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">Жилец</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors">
          <Icon name="LogOut" size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 pt-5 pb-28 overflow-y-auto">

        {/* ── ЗАЯВКИ ── */}
        {tab === 'requests' && (
          <>
            <div className="bg-primary rounded-2xl px-5 py-5 mb-5 text-primary-foreground">
              <p className="text-sm opacity-80">Ваши заявки</p>
              <p className="text-3xl font-extrabold mt-1">{requests.length}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span><span className="font-bold">{active.length}</span> активных</span>
                <span><span className="font-bold">{done.length}</span> выполнено</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Icon name="Loader" size={28} className="text-primary animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                  <Icon name="ClipboardList" size={28} className="text-muted-foreground" />
                </div>
                <p className="font-bold text-lg">Заявок пока нет</p>
                <p className="text-sm text-muted-foreground mt-1">Нажмите кнопку ниже, чтобы подать первую заявку</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {requests.map((r) => (
                  <Card key={r.id} className="p-4 border-border">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-sm">№{r.id} · {r.category}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.address}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_STYLES[r.status] || ''}`}>
                        <Icon name={STATUS_ICONS[r.status] || 'Circle'} size={10} className="mr-1" />
                        {r.status_label}
                      </Badge>
                    </div>
                    <p className="text-xs text-foreground/80 line-clamp-2">{r.description}</p>

                    {/* Сообщение диспетчера при выполнении */}
                    {r.status === 'done' && r.close_comment && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon name="MessageSquare" size={13} className="text-emerald-600" />
                          <span className="text-xs font-semibold text-emerald-700">Сообщение диспетчера</span>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">{r.close_comment}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      {r.master_name
                        ? <div className="flex items-center gap-1.5">
                            <Icon name="Wrench" size={12} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{r.master_name}</span>
                          </div>
                        : <span />
                      }
                      <p className="text-[10px] text-muted-foreground">{formatDate(r.created_at)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── УВЕДОМЛЕНИЯ ── */}
        {tab === 'notifications' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">Уведомления</h2>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-sm text-primary font-medium">
                  Прочитать все
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Icon name="Loader" size={28} className="text-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                  <Icon name="BellOff" size={28} className="text-muted-foreground" />
                </div>
                <p className="font-bold">Уведомлений пока нет</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Здесь появятся сообщения диспетчера о решённых проблемах
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notifications.map((n) => {
                  const isRead = readIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        isRead
                          ? 'bg-card border-border opacity-70'
                          : 'bg-white border-emerald-200 shadow-sm shadow-emerald-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isRead ? 'bg-secondary' : 'bg-emerald-100'}`}>
                          <Icon name="CircleCheck" size={20} className={isRead ? 'text-muted-foreground' : 'text-emerald-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-sm">Заявка №{n.id} выполнена</p>
                            {!isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{n.category} · {n.address}</p>

                          {/* Сообщение диспетчера */}
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon name="Headphones" size={12} className="text-emerald-600" />
                              <span className="text-[11px] font-semibold text-emerald-700">Диспетчер</span>
                            </div>
                            <p className="text-xs text-emerald-900 leading-relaxed">{n.close_comment}</p>
                          </div>

                          {n.closed_at && (
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Закрыта {formatDate(n.closed_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB — только на вкладке заявок */}
      {tab === 'requests' && (
        <button
          onClick={() => setOpenNew(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-max px-6 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center gap-3 text-primary-foreground font-semibold hover:scale-105 transition-transform z-30"
        >
          <Icon name="Plus" size={22} />
          Подать заявку
        </button>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-20">
        <div className="grid grid-cols-2 px-2 py-2">
          {BOTTOM_NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all relative ${tab === n.id ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {tab === n.id && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />}
              <Icon name={n.icon} size={22} />
              <span className="text-[10px] font-semibold">{n.label}</span>
              {n.id === 'notifications' && unreadCount > 0 && (
                <span className="absolute top-1.5 right-6 w-4 h-4 bg-emerald-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* New request dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="max-w-[calc(100vw-2rem)] mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Новая заявка</DialogTitle>
            <DialogDescription>Опишите проблему, диспетчер назначит мастера</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label>Категория проблемы</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Адрес</Label>
              <Input placeholder="ул. Ленина, 12, кв. 45" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Описание проблемы</Label>
              <Textarea placeholder="Подробно опишите ситуацию..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Приоритет</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpenNew(false)}>Отмена</Button>
            <Button className="flex-1 gap-2" onClick={submit} disabled={submitting}>
              {submitting ? <Icon name="Loader" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
