import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { api, User, Request } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/20',
  assigned: 'bg-violet-100 text-violet-700 border-violet-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  done: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  waiting: 'bg-slate-100 text-slate-600 border-slate-200',
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-slate-300',
};

type Props = { user: User; onLogout: () => void };

export default function MasterApp({ user, onLogout }: Props) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Request | null>(null);
  const [updating, setUpdating] = useState(false);
  const [tab, setTab] = useState<'active' | 'done'>('active');

  const load = async () => {
    try {
      const data = await api.listRequests();
      setRequests(data);
    } catch {
      toast.error('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const active = requests.filter((r) => r.status !== 'done');
  const done = requests.filter((r) => r.status === 'done');
  const displayed = tab === 'active' ? active : done;

  const markInProgress = async (r: Request) => {
    setUpdating(true);
    try {
      await api.updateRequest({ id: r.id, status: 'in_progress' });
      toast.success('Задача взята в работу');
      load();
      setSelected(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setUpdating(false);
    }
  };

  const markDone = async (r: Request) => {
    setUpdating(true);
    try {
      await api.updateRequest({ id: r.id, status: 'done' });
      toast.success('Задача выполнена!', { description: 'Жильцу отправлено уведомление' });
      load();
      setSelected(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Icon name="Wrench" size={16} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">Мастер</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors">
          <Icon name="LogOut" size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 pt-5 pb-8 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-primary rounded-2xl p-4 text-primary-foreground">
            <p className="text-3xl font-extrabold">{active.length}</p>
            <p className="text-sm opacity-80 mt-0.5">Активных задач</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-3xl font-extrabold text-emerald-600">{done.length}</p>
            <p className="text-sm text-muted-foreground mt-0.5">Выполнено</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-secondary p-1 mb-4">
          {([['active', 'Активные'], ['done', 'Выполненные']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>
              {label}
              <span className="ml-1.5 text-xs opacity-60">{id === 'active' ? active.length : done.length}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icon name="Loader" size={28} className="text-primary animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-3">
              <Icon name={tab === 'active' ? 'ClipboardList' : 'CircleCheck'} size={28} className="text-muted-foreground" />
            </div>
            <p className="font-bold">{tab === 'active' ? 'Нет активных задач' : 'Нет выполненных задач'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === 'active' ? 'Диспетчер назначит задачи в ближайшее время' : 'Выполненные задачи появятся здесь'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayed.map((r) => (
              <Card key={r.id} className="p-4 border-border cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(r)}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[r.priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">№{r.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[r.status]}`}>{r.status_label}</Badge>
                    </div>
                    <p className="text-sm font-medium">{r.category}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Жилец: {r.resident_name}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0 mt-1" />
                </div>
                {tab === 'active' && (
                  <div className="flex gap-2 mt-3">
                    {r.status === 'assigned' && (
                      <Button size="sm" className="flex-1 h-8 gap-1 text-xs" onClick={(e) => { e.stopPropagation(); markInProgress(r); }} disabled={updating}>
                        <Icon name="Play" size={13} /> Взять в работу
                      </Button>
                    )}
                    {(r.status === 'in_progress' || r.status === 'waiting') && (
                      <Button size="sm" className="flex-1 h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={(e) => { e.stopPropagation(); markDone(r); }} disabled={updating}>
                        <Icon name="Check" size={13} /> Выполнено
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Задача №{selected.id}</SheetTitle>
              </SheetHeader>
              <div className="space-y-3">
                {[
                  { label: 'Категория', value: selected.category },
                  { label: 'Адрес', value: selected.address },
                  { label: 'Жилец', value: selected.resident_name },
                  { label: 'Телефон', value: selected.resident_phone },
                  { label: 'Приоритет', value: selected.priority_label },
                  { label: 'Статус', value: selected.status_label },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-border">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
                <div className="py-2.5 border-b border-border">
                  <span className="text-sm text-muted-foreground block mb-1.5">Описание проблемы</span>
                  <p className="text-sm leading-relaxed">{selected.description}</p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {selected.status === 'assigned' && (
                    <Button className="w-full gap-2" onClick={() => markInProgress(selected)} disabled={updating}>
                      <Icon name="Play" size={16} /> Взять в работу
                    </Button>
                  )}
                  {(selected.status === 'in_progress' || selected.status === 'waiting') && (
                    <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => markDone(selected)} disabled={updating}>
                      {updating ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="CheckCircle" size={16} />}
                      Отметить выполненной
                    </Button>
                  )}
                  <Button variant="outline" className="w-full gap-2" onClick={() => toast(`Звонок: ${selected.resident_phone}`)}>
                    <Icon name="Phone" size={16} /> Позвонить жильцу
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
