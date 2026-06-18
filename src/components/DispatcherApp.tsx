import { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api, User, Request, downloadBase64 } from '@/lib/api';

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

const STATUSES = [
  { value: 'new', label: 'Новая' },
  { value: 'assigned', label: 'Назначена' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'waiting', label: 'Ожидает' },
  { value: 'done', label: 'Выполнена' },
];

type Master = { id: number; name: string; phone: string };
type Props = { user: User; onLogout: () => void };

const BOTTOM_NAV = [
  { id: 'dashboard', label: 'Дашборд', icon: 'LayoutDashboard' },
  { id: 'requests', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'masters', label: 'Мастера', icon: 'Wrench' },
  { id: 'reports', label: 'Отчёты', icon: 'FileText' },
];

// ── Экран отчётов ─────────────────────────────────────────────────────────────
function ReportsScreen() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);

  const download = async (format: 'excel' | 'pdf') => {
    setLoading(format);
    try {
      const res = await api.downloadReport({
        action: format,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        status_filter: statusFilter,
      });
      downloadBase64(res.data, res.filename, res.mime);
      toast.success(`${format === 'excel' ? 'Excel' : 'PDF'} отчёт скачан`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка генерации отчёта');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-primary rounded-2xl px-5 py-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Icon name="FileText" size={22} />
          </div>
          <div>
            <p className="font-extrabold text-lg">Отчёты</p>
            <p className="text-sm opacity-75">Выгрузка заявок за период</p>
          </div>
        </div>
      </div>

      <Card className="p-5 border-border flex flex-col gap-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Icon name="Filter" size={16} className="text-primary" />
          Фильтры
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <Label className="text-xs">Дата от</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Дата до</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm" />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Статус заявок</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-3">
        <button
          onClick={() => download('excel')}
          disabled={!!loading}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            {loading === 'excel'
              ? <Icon name="Loader" size={22} className="text-white animate-spin" />
              : <Icon name="Table" size={22} className="text-white" />}
          </div>
          <div className="text-left">
            <p className="font-bold text-emerald-800">Скачать Excel</p>
            <p className="text-xs text-emerald-600">Таблица для Excel / Google Sheets</p>
          </div>
          <Icon name="Download" size={18} className="text-emerald-500 ml-auto" />
        </button>

        <button
          onClick={() => download('pdf')}
          disabled={!!loading}
          className="flex items-center gap-4 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-60"
        >
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            {loading === 'pdf'
              ? <Icon name="Loader" size={22} className="text-white animate-spin" />
              : <Icon name="FileText" size={22} className="text-white" />}
          </div>
          <div className="text-left">
            <p className="font-bold text-red-800">Скачать PDF</p>
            <p className="text-xs text-red-600">Готовый документ для печати</p>
          </div>
          <Icon name="Download" size={18} className="text-red-400 ml-auto" />
        </button>
      </div>

      <Card className="p-4 border-border bg-secondary/40">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Отчёт включает: номер заявки, категорию, адрес, жильца, мастера, статус, приоритет, время создания и закрытия, время выполнения и комментарий диспетчера.
          </p>
        </div>
      </Card>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function DispatcherApp({ user, onLogout }: Props) {
  const [tab, setTab] = useState('dashboard');
  const [requests, setRequests] = useState<Request[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<Request | null>(null);
  const [assignMasterId, setAssignMasterId] = useState('');
  const [assignStatus, setAssignStatus] = useState('');
  const [closeComment, setCloseComment] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const [reqs, mstrs] = await Promise.all([api.listRequests(), api.getMasters()]);
      setRequests(reqs);
      setMasters(mstrs);
    } catch {
      toast.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchSearch = !q || [r.category, r.address, r.resident_name, String(r.id)].some((f) => f?.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [requests, search, filterStatus]);

  const stats = {
    new: requests.filter((r) => r.status === 'new').length,
    in_progress: requests.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length,
    done: requests.filter((r) => r.status === 'done').length,
    total: requests.length,
  };

  const openRequest = (r: Request) => {
    setSelected(r);
    setAssignMasterId(r.master_id ? String(r.master_id) : '');
    setAssignStatus(r.status);
    setCloseComment(r.close_comment || '');
  };

  const saveUpdate = async () => {
    if (!selected) return;
    if (assignStatus === 'done' && !closeComment.trim()) {
      toast.error('Добавьте комментарий для жильца при закрытии заявки');
      return;
    }
    setUpdating(true);
    try {
      await api.updateRequest({
        id: selected.id,
        status: assignStatus || undefined,
        master_id: assignMasterId ? Number(assignMasterId) : undefined,
        close_comment: closeComment.trim() || undefined,
      });
      toast.success('Заявка обновлена', {
        description: assignStatus === 'done' ? 'Жилец увидит ваш комментарий в уведомлениях' : undefined,
      });
      setSelected(null);
      load();
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
            <Icon name="Headphones" size={16} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">Диспетчер</p>
          </div>
        </div>
        <button onClick={onLogout} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors">
          <Icon name="LogOut" size={18} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 pt-5 pb-28 overflow-y-auto">
        {loading && tab !== 'reports' ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader" size={28} className="text-primary animate-spin" />
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {tab === 'dashboard' && (
              <div className="flex flex-col gap-5">
                <div className="bg-primary rounded-2xl px-5 py-5 text-primary-foreground">
                  <p className="text-sm opacity-80">Смена дневная</p>
                  <p className="text-xl font-extrabold mt-1">Добро пожаловать, {user.name.split(' ')[0]}</p>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    {[
                      { label: 'Новые', value: stats.new, icon: 'Inbox' },
                      { label: 'В работе', value: stats.in_progress, icon: 'Loader' },
                      { label: 'Выполнено', value: stats.done, icon: 'CircleCheck' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                        <p className="text-2xl font-extrabold">{s.value}</p>
                        <p className="text-[11px] opacity-70 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold">Ожидают назначения</h2>
                    <button onClick={() => setTab('requests')} className="text-sm text-primary font-medium">Все</button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {requests.filter((r) => r.status === 'new').slice(0, 4).map((r) => (
                      <Card key={r.id} className="p-4 border-border cursor-pointer hover:shadow-md transition-all" onClick={() => { setTab('requests'); openRequest(r); }}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[r.priority] || 'bg-slate-300'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">№{r.id} · {r.category}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                            <p className="text-xs text-muted-foreground">{r.resident_name}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">Новая</Badge>
                        </div>
                      </Card>
                    ))}
                    {requests.filter((r) => r.status === 'new').length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">Новых заявок нет</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold">Мастера</h2>
                    <button onClick={() => setTab('masters')} className="text-sm text-primary font-medium">Все</button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {masters.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone}</p>
                        </div>
                        <span className="text-xs font-medium text-emerald-600">
                          {requests.filter((r) => r.master_id === m.id && r.status !== 'done').length} заявок
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick report */}
                <button
                  onClick={() => setTab('reports')}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-secondary transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Icon name="FileText" size={20} className="text-violet-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">Скачать отчёт</p>
                    <p className="text-xs text-muted-foreground">Excel или PDF по всем заявкам</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Requests */}
            {tab === 'requests' && (
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Поиск..." className="pl-9 bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                  {[{ value: 'all', label: 'Все' }, ...STATUSES].map((s) => (
                    <button key={s.value} onClick={() => setFilterStatus(s.value)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterStatus === s.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'}`}>
                      {s.label}
                      {s.value !== 'all' && <span className="ml-1 opacity-60">{requests.filter((r) => r.status === s.value).length}</span>}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {filtered.map((r) => (
                    <Card key={r.id} className="p-4 border-border cursor-pointer hover:shadow-md transition-all" onClick={() => openRequest(r)}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${PRIORITY_DOT[r.priority]}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">№{r.id}</span>
                            <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[r.status]}`}>{r.status_label}</Badge>
                          </div>
                          <p className="text-xs font-medium mt-0.5">{r.category}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.address}</p>
                          <p className="text-xs text-muted-foreground">{r.resident_name}</p>
                        </div>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0 mt-1" />
                      </div>
                    </Card>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-10">Ничего не найдено</p>
                  )}
                </div>
              </div>
            )}

            {/* Masters */}
            {tab === 'masters' && (
              <div className="flex flex-col gap-3">
                {masters.map((m) => {
                  const active = requests.filter((r) => r.master_id === m.id && r.status !== 'done');
                  return (
                    <Card key={m.id} className="p-4 border-border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${active.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {active.length === 0 ? 'Свободен' : `${active.length} заявок`}
                        </span>
                      </div>
                      {active.length > 0 && (
                        <div className="flex flex-col gap-1.5 pt-3 border-t border-border">
                          {active.slice(0, 3).map((r) => (
                            <div key={r.id} className="flex items-center gap-2 text-xs">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[r.priority]}`} />
                              <span className="text-muted-foreground">№{r.id}</span>
                              <span className="truncate">{r.category}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Reports */}
            {tab === 'reports' && <ReportsScreen />}
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border z-20">
        <div className="grid grid-cols-4 px-2 py-2">
          {BOTTOM_NAV.map((n) => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all relative ${tab === n.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {tab === n.id && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />}
              <Icon name={n.icon} size={20} />
              <span className="text-[10px] font-semibold">{n.label}</span>
              {n.id === 'requests' && stats.new > 0 && (
                <span className="absolute top-1.5 right-3 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground flex items-center justify-center font-bold">{stats.new}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Request detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Заявка №{selected.id}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="space-y-0">
                  {[
                    { label: 'Категория', value: selected.category },
                    { label: 'Адрес', value: selected.address },
                    { label: 'Жилец', value: `${selected.resident_name} · ${selected.resident_phone}` },
                    { label: 'Приоритет', value: selected.priority_label },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-start py-2.5 border-b border-border">
                      <span className="text-sm text-muted-foreground shrink-0">{item.label}</span>
                      <span className="text-sm font-semibold text-right max-w-[58%]">{item.value}</span>
                    </div>
                  ))}
                  <div className="py-2.5 border-b border-border">
                    <span className="text-sm text-muted-foreground block mb-1">Описание</span>
                    <p className="text-sm">{selected.description}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Статус</Label>
                    <Select value={assignStatus} onValueChange={setAssignStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Назначить мастера</Label>
                    <Select value={assignMasterId} onValueChange={setAssignMasterId}>
                      <SelectTrigger><SelectValue placeholder="Выберите мастера" /></SelectTrigger>
                      <SelectContent>
                        {masters.map((m) => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Сообщение жильцу — всегда видно, обязательно при закрытии */}
                  <div className="grid gap-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Icon name="MessageSquare" size={14} className="text-primary" />
                      Сообщение жильцу
                      {assignStatus === 'done' && <span className="text-red-500 text-xs font-normal ml-1">* обязательно</span>}
                    </Label>
                    <Textarea
                      placeholder={assignStatus === 'done'
                        ? 'Опишите что было сделано, жилец увидит это в уведомлениях...'
                        : 'Необязательное сообщение для жильца...'}
                      rows={3}
                      value={closeComment}
                      onChange={(e) => setCloseComment(e.target.value)}
                      className={assignStatus === 'done' && !closeComment.trim() ? 'border-red-300 focus:border-red-400' : ''}
                    />
                    {assignStatus === 'done' && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Icon name="Bell" size={11} />
                        Жилец получит уведомление с этим сообщением
                      </p>
                    )}
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={saveUpdate} disabled={updating}>
                  {updating ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                  Сохранить
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
