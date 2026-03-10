import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  format, isSameDay, addDays, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from
'date-fns';
import { de } from 'date-fns/locale';
import {
  Plus, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, Clock,
  Settings2, Minus, User, Phone, Mail, Tag, Trash2, Ban, CheckCircle2, Users, CalendarCheck, Sparkles, ImageIcon, CreditCard, Banknote, Globe, Loader2 } from
'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Reservation } from '@/hooks/useReservations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StaffMember } from '@/hooks/useStaffMembers';
import { StaffShift } from '@/hooks/useStaffShifts';
import { ShiftException } from '@/hooks/useShiftExceptions';
import { Product } from '@/hooks/useProducts';
import ReservationForm from './ReservationForm';
import { AvailabilityView } from '@/components/portal/AvailabilityView';
import { StaffManagementDialog } from '@/components/portal/StaffManagementDialog';
import { SmartTextImport } from '@/components/portal/SmartTextImport';

const SLOT_HEIGHT = 30; // px per 30 min
const START_HOUR = 8;
const END_HOUR = 22;
const TIME_INTERVALS = [15, 30, 60] as const;
type TimeInterval = typeof TIME_INTERVALS[number];

interface Props {
  reservations: Reservation[];
  staffMembers: StaffMember[];
  shifts: StaffShift[];
  exceptions: ShiftException[];
  products: Product[];
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  onCreateReservation: (data: any) => Promise<any>;
  onUpdateReservation: (id: string, data: any) => Promise<any>;
  onDeleteReservation: (id: string) => Promise<void>;
  onNavigate?: (view: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  confirmed: 'bg-primary',
  completed: 'bg-emerald-500',
  cancelled: 'bg-muted-foreground',
  no_show: 'bg-destructive'
};

const statusLabels: Record<string, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  no_show: 'Nicht erschienen'
};

const sourceLabels: Record<string, string> = {
  manual: 'Manuell',
  voice_agent: 'KI Voice',
  website: 'Website',
  phone: 'Telefon',
  n8n: 'n8n'
};

const StaffCalendarView: React.FC<Props> = ({
  reservations, staffMembers, shifts, exceptions, products,
  selectedDate, setSelectedDate,
  onCreateReservation, onUpdateReservation, onDeleteReservation, onNavigate
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [calendarMode, setCalendarMode] = useState<'calendar' | 'availability'>('calendar');
  const [rowHeight, setRowHeight] = useState(80);
  const [columnWidth, setColumnWidth] = useState(160);
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(30);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);
  const [dragOverStaff, setDragOverStaff] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeStaff = useMemo(() =>
  staffMembers.filter((s) => s.is_active).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  [staffMembers]
  );

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: {hour: number;minute: number;label: string;}[] = [];
    const slotsPerHour = 60 / timeInterval;
    for (let i = 0; i < (END_HOUR - START_HOUR) * slotsPerHour; i++) {
      const hour = START_HOUR + Math.floor(i / slotsPerHour);
      const minute = i % slotsPerHour * timeInterval;
      slots.push({ hour, minute, label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` });
    }
    return slots;
  }, [timeInterval]);

  const slotHeight = rowHeight / (60 / timeInterval);
  const totalHeight = timeSlots.length * slotHeight;

  // Check if staff is working at a given time
  const isStaffWorkingAt = useCallback((staffId: string, date: Date, hour: number, minute: number) => {
    const dayOfWeek = getDay(date); // 0=Sun
    const dateString = format(date, 'yyyy-MM-dd');
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;

    // Check exceptions first
    const dayExceptions = exceptions.filter((e) => e.staff_member_id === staffId && e.exception_date === dateString);
    for (const ex of dayExceptions) {
      if (!ex.start_time || !ex.end_time) return false; // full day off
      if (timeStr >= ex.start_time && timeStr < ex.end_time) return false;
    }

    // Check shift
    const shift = shifts.find((s) => s.staff_member_id === staffId && s.day_of_week === dayOfWeek);
    if (!shift || !shift.is_working) return false;
    return timeStr >= shift.start_time && timeStr < shift.end_time;
  }, [shifts, exceptions]);

  // Get reservations for a date
  const getReservationsForDate = useCallback((date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    return reservations.filter((r) => r.date === ds && r.status !== 'cancelled');
  }, [reservations]);

  // Position calculation
  const calcTop = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h - START_HOUR) * 60 + m) * (slotHeight / timeInterval);
  };

  const calcHeight = (startTime: string, endTime: string | null) => {
    const [sh, sm] = startTime.split(':').map(Number);
    let endMin: number;
    if (endTime) {
      const [eh, em] = endTime.split(':').map(Number);
      endMin = eh * 60 + em;
    } else {
      endMin = sh * 60 + sm + 60; // default 1h
    }
    const startMin = sh * 60 + sm;
    return Math.max((endMin - startMin) * (slotHeight / timeInterval), 24);
  };

  // Slot click handler
  const handleSlotClick = (staffId: string, hour: number, minute: number, date: Date) => {
    setEditingId(null);
    setFormInitial({
      date: format(date, 'yyyy-MM-dd'),
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      end_time: `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      staff_member_id: staffId
    });
    setFormOpen(true);
  };

  // Reservation click handler
  const handleReservationClick = (r: Reservation) => {
    setDetailReservation(r);
  };

  // Edit from detail
  const handleEditFromDetail = () => {
    if (!detailReservation) return;
    const r = detailReservation;
    setEditingId(r.id);
    setFormInitial({
      customer_name: r.customer_name,
      customer_phone: r.customer_phone || '',
      customer_email: r.customer_email || '',
      date: r.date,
      time: r.time?.substring(0, 5),
      end_time: r.end_time?.substring(0, 5) || '',
      staff_member_id: r.staff_member_id || '',
      product_id: r.product_id || '',
      notes: r.notes || '',
      status: r.status || 'confirmed'
    });
    setDetailReservation(null);
    setFormOpen(true);
  };

  // Form submit
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingId) {
        await onUpdateReservation(editingId, {
          customer_name: data.customer_name,
          customer_phone: data.customer_phone || null,
          customer_email: data.customer_email || null,
          date: data.date,
          time: data.time,
          end_time: data.end_time || null,
          staff_member_id: data.staff_member_id || null,
          product_id: data.product_id || null,
          notes: data.notes || null,
          status: data.status
        });
      } else {
        await onCreateReservation({
          customer_name: data.customer_name,
          customer_phone: data.customer_phone || null,
          customer_email: data.customer_email || null,
          date: data.date,
          time: data.time,
          end_time: data.end_time || null,
          staff_member_id: data.staff_member_id || null,
          product_id: data.product_id || null,
          notes: data.notes || null,
          status: 'confirmed',
          source: 'manual'
        });
      }
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error('Error saving reservation:', err);
    }
  };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, reservationId: string) => {
    e.dataTransfer.setData('reservationId', reservationId);
    setDraggingId(reservationId);
  };

  const handleDrop = async (e: React.DragEvent, staffId: string) => {
    e.preventDefault();
    const resId = e.dataTransfer.getData('reservationId');
    if (resId) {
      try {
        await onUpdateReservation(resId, { staff_member_id: staffId || null });
      } catch (err) {
        console.error('Error updating staff assignment:', err);
      }
    }
    setDragOverStaff(null);
    setDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent, staffId: string) => {
    e.preventDefault();
    setDragOverStaff(staffId);
  };

  const handleDragLeave = () => setDragOverStaff(null);

  // Get product name
  const getProductName = (productId: string | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId)?.name || null;
  };

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return 'Nicht zugewiesen';
    return staffMembers.find((s) => s.id === staffId)?.name || 'Unbekannt';
  };

  const getStaffColor = (staffId: string | null) => {
    if (!staffId) return '#94a3b8';
    return staffMembers.find((s) => s.id === staffId)?.color || '#3B82F6';
  };

  // Week view days
  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { locale: de }),
    end: endOfWeek(selectedDate, { locale: de })
  });

  // Render a single column of reservations
  const renderColumn = (staffId: string | null, date: Date, widthOverride?: number) => {
    const ds = format(date, 'yyyy-MM-dd');
    const colReservations = reservations.filter((r) =>
    r.date === ds &&
    r.status !== 'cancelled' && (
    staffId === null ? !r.staff_member_id : r.staff_member_id === staffId)
    );

    const colWidth = widthOverride || columnWidth;

    return (
      <div
        key={`${staffId || 'unassigned'}-${ds}`}
        className={`relative border-r border-border last:border-r-0 transition-colors ${
        dragOverStaff === (staffId || '__unassigned') ? 'bg-primary/5' : ''}`
        }
        style={{ width: colWidth, minWidth: colWidth }}
        onDrop={(e) => handleDrop(e, staffId || '')}
        onDragOver={(e) => handleDragOver(e, staffId || '__unassigned')}
        onDragLeave={handleDragLeave}>
        
        {/* Time slot grid lines */}
        {timeSlots.map((slot) => {
          const isWorking = staffId ? isStaffWorkingAt(staffId, date, slot.hour, slot.minute) : true;
          return (
            <div
              key={`${slot.hour}-${slot.minute}`}
              onClick={() => handleSlotClick(staffId || '', slot.hour, slot.minute, date)}
              className={`border-b cursor-pointer group flex items-start justify-center pt-1 transition-colors ${
              slot.minute === 0 ? 'border-border/60' : 'border-border/20'} ${
              isWorking ? 'hover:bg-muted/40' : 'bg-muted/30'}`}
              style={{ height: `${slotHeight}px` }}>
              
              {isWorking &&
              <Plus className="w-3 h-3 text-muted-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              }
            </div>);

        })}

        {/* Reservation blocks */}
        {colReservations.map((r) => {
          const top = calcTop(r.time);
          const height = calcHeight(r.time, r.end_time);
          const color = getStaffColor(r.staff_member_id);
          const productName = getProductName(r.product_id);

          return (
            <div
              key={r.id}
              draggable
              onDragStart={(e) => handleDragStart(e, r.id)}
              onClick={(e) => {e.stopPropagation();handleReservationClick(r);}}
              className={`absolute left-1 right-1 rounded-xl px-2.5 py-1.5 shadow-sm cursor-pointer z-10 overflow-hidden transition-all hover:shadow-md active:scale-[0.98] ${
              draggingId === r.id ? 'opacity-40' : ''}`
              }
              style={{
                top: `${top + 2}px`,
                height: `${Math.max(height - 4, 22)}px`,
                backgroundColor: `${color}18`,
                borderLeft: `4px solid ${color}`
              }}>
              
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] font-bold text-muted-foreground">
                  {r.time?.substring(0, 5)}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[r.status || 'pending']}`} />
              </div>
              <p className="font-bold text-xs text-foreground truncate leading-tight">{r.customer_name}</p>
              {height > 40 && productName &&
              <p className="text-[9px] font-semibold text-muted-foreground truncate mt-0.5">{productName}</p>
              }
              {height > 55 && r.source && r.source !== 'manual' &&
              <Badge variant="secondary" className="text-[8px] px-1 py-0 mt-0.5 h-3.5">
                  {sourceLabels[r.source] || r.source}
                </Badge>
              }
            </div>);

        })}
      </div>);

  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-2 px-4 pt-2 space-y-2">

        {/* Bottom row: Mode toggles + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Date display */}
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-foreground leading-tight">
                {format(selectedDate, 'EEEE,', { locale: de })}
                <br />
                <span className="text-sm font-bold text-muted-foreground">
                  {format(selectedDate, 'd. MMMM yyyy', { locale: de })}
                </span>
              </span>
            </div>

            {/* Date navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'week' ? -7 : -1))}
                className="p-2 bg-muted hover:bg-card rounded-xl border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-2 bg-muted hover:bg-card rounded-xl border border-border shadow-sm text-muted-foreground hover:text-foreground font-black text-[10px] transition-all"
              >
                HEUTE
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'week' ? 7 : 1))}
                className="p-2 bg-muted hover:bg-card rounded-xl border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View mode toggle */}
            <div className="bg-muted p-1 rounded-2xl flex border border-border shadow-sm">
              <button
                onClick={() => setViewMode('day')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
                  viewMode === 'day' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> TAG
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
                  viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" /> WOCHE
              </button>
            </div>
          </div>



          <div className="flex items-center gap-3">
            <div className="bg-muted p-1 rounded-2xl flex border border-border shadow-sm">
              <button onClick={() => setCalendarMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
              calendarMode === 'calendar' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`
              }>
                <CalendarDays className="w-3.5 h-3.5" /> KALENDER
              </button>
              <button onClick={() => setCalendarMode('availability')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${
              calendarMode === 'availability' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`
              }>
                <CheckCircle2 className="w-3.5 h-3.5" /> FREIE SLOTS
              </button>
            </div>
            <StaffManagementDialog trigger={
            <button className="flex items-center gap-2 px-3 py-2.5 bg-muted hover:bg-card rounded-xl border border-border shadow-sm text-muted-foreground hover:text-foreground font-black text-[10px] transition-all">
                <Users className="w-3.5 h-3.5" /> DIENSTPLAN
              </button>
            } />

            {calendarMode === 'calendar' &&
            <>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="p-2.5 bg-muted hover:bg-card rounded-xl border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all">
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-5 bg-card border border-border rounded-2xl shadow-2xl" align="end">
                    <div className="space-y-5">
                      <div>
                        <h4 className="text-sm font-black text-foreground mb-1">Einstellungen</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="zen-label">Zeilenhöhe</label>
                          <span className="text-xs font-black text-primary">{rowHeight}px</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setRowHeight(Math.max(40, rowHeight - 10))} className="p-1.5 bg-muted rounded-lg">
                            <Minus className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <Slider value={[rowHeight]} onValueChange={(v) => setRowHeight(v[0])} min={40} max={160} step={10} className="flex-1" />
                          <button onClick={() => setRowHeight(Math.min(160, rowHeight + 10))} className="p-1.5 bg-muted rounded-lg">
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="zen-label">Intervall</label>
                        <div className="grid grid-cols-3 gap-2">
                          {TIME_INTERVALS.map((interval) =>
                        <button key={interval} onClick={() => setTimeInterval(interval)}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${
                        timeInterval === interval ?
                        'bg-primary text-primary-foreground shadow-lg' :
                        'bg-muted text-muted-foreground hover:bg-card border border-border'}`
                        }>
                              {interval}m
                            </button>
                        )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="zen-label">Spaltenbreite</label>
                        <span className="text-xs font-black text-primary">{columnWidth}px</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setColumnWidth(Math.max(80, columnWidth - 10))} className="p-1.5 bg-muted rounded-lg">
                          <Minus className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <Slider value={[columnWidth]} onValueChange={(v) => setColumnWidth(v[0])} min={80} max={300} step={10} className="flex-1" />
                        <button onClick={() => setColumnWidth(Math.min(300, columnWidth + 10))} className="p-1.5 bg-muted rounded-lg">
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Treatwell Import button */}
                <button
                onClick={() => setIsSmartImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-black text-xs shadow-lg hover:opacity-90 transition-all">
                
                  <ImageIcon className="w-4 h-4" /> Treatwell Import
                </button>


                <button onClick={() => {
                setEditingId(null);
                setFormInitial({ date: dateStr, time: '09:00', end_time: '10:00' });
                setFormOpen(true);
              }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-black text-xs shadow-lg hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4" /> Termin
                </button>
              </>
            }
          </div>
        </div>
      </div>

      {/* Availability View or Calendar Grid */}
      {calendarMode === 'availability' ?
      <AvailabilityView /> :

      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex flex-col bg-card border-t border-border">
        
          {/* Header Row */}
          <div className="flex border-b border-border bg-card sticky top-0 z-20" style={{ minHeight: '56px' }}>
            <div className="w-16 border-r border-border shrink-0 flex items-center justify-center sticky left-0 z-30 bg-card">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

            {viewMode === 'day' ?
          <>
                {/* Unassigned column */}
                <div className="px-3 flex items-center gap-2 border-r border-border bg-muted/30" style={{ width: columnWidth, minWidth: columnWidth }}>
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground truncate">Offen</span>
                </div>
                {activeStaff.map((staff) =>
            <div key={staff.id} className="px-3 flex items-center gap-2 border-r border-border last:border-r-0 bg-card" style={{ width: columnWidth, minWidth: columnWidth }}>
                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-border shrink-0"
              style={{ backgroundColor: `${staff.color}20` }}>
                      {staff.avatar_url ?
                <img src={staff.avatar_url} className="w-full h-full object-cover" alt={staff.name} /> :

                <div className="w-full h-full flex items-center justify-center text-[10px] font-black" style={{ color: staff.color }}>
                          {staff.name.charAt(0)}
                        </div>
                }
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">{staff.name}</span>
                  </div>
            )}
              </> :

          <>
            {/* Week view: two-row header - day names on top, staff per day below */}
            <div className="flex flex-col">
              <div className="flex">
                {weekDays.map((day) => {
                  const weekColWidth = Math.max(columnWidth * 0.6, 80);
                  const totalDayWidth = weekColWidth * (activeStaff.length + 1);
                  return (
                    <div key={day.toString()}
                    className={`border-r border-border last:border-r-0 text-center py-1.5 ${
                    isSameDay(day, new Date()) ? 'bg-primary/5' : 'bg-card'}`}
                    style={{ width: totalDayWidth, minWidth: totalDayWidth }}>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        {format(day, 'EEE', { locale: de })}
                      </p>
                      <p className={`text-sm font-black ${isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </p>
                    </div>);

                })}
              </div>
              <div className="flex border-t border-border">
                {weekDays.map((day) => {
                  const weekColWidth = Math.max(columnWidth * 0.6, 80);
                  return (
                    <React.Fragment key={`staff-${day.toString()}`}>
                      <div className="flex items-center justify-center border-r border-border/50 bg-muted/30"
                      style={{ width: weekColWidth, minWidth: weekColWidth, height: 28 }}>
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                      {activeStaff.map((staff, idx) =>
                      <div key={staff.id}
                      className={`flex items-center justify-center gap-1 bg-card ${
                      idx === activeStaff.length - 1 ? 'border-r border-border' : 'border-r border-border/30'}`}
                      style={{ width: weekColWidth, minWidth: weekColWidth, height: 28 }}>
                          <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black text-white"
                        style={{ backgroundColor: staff.color }}>
                            {staff.name.charAt(0)}
                          </div>
                          {weekColWidth > 90 &&
                        <span className="text-[9px] font-bold text-foreground truncate max-w-[50px]">{staff.name}</span>
                        }
                        </div>
                      )}
                    </React.Fragment>);

                })}
              </div>
            </div>
          </>
          }
          </div>

          {/* Scrollable Grid */}
          <div className="flex-1">
            <div className="flex min-w-max" style={{ minHeight: `${totalHeight}px` }}>
              {/* Time column */}
              <div className="w-16 border-r border-border bg-card shrink-0 sticky left-0 z-20">
                {timeSlots.map((slot) =>
              <div key={`${slot.hour}-${slot.minute}`}
              className="px-2 text-[9px] font-bold text-muted-foreground text-right pr-3 flex items-start pt-1"
              style={{ height: `${slotHeight}px` }}>
                    {slot.minute === 0 || timeInterval < 60 ? slot.label : ''}
                  </div>
              )}
              </div>

              {/* Columns */}
              {viewMode === 'day' ?
            <>
                  {renderColumn(null, selectedDate)}
                  {activeStaff.map((staff) => renderColumn(staff.id, selectedDate))}
                </> :

            weekDays.map((day) => {
              const weekColWidth = Math.max(columnWidth * 0.6, 80);
              return (
                <React.Fragment key={`week-col-${day.toString()}`}>
                  {renderColumn(null, day, weekColWidth)}
                  {activeStaff.map((staff) => renderColumn(staff.id, day, weekColWidth))}
                </React.Fragment>);

            })
            }
            </div>
          </div>
        </div>
      }

      {/* Reservation Form */}
      {formOpen &&
      <ReservationForm
        onSubmit={handleFormSubmit}
        onClose={() => {setFormOpen(false);setEditingId(null);}}
        onDelete={editingId ? async () => {
          await onDeleteReservation(editingId);
          setFormOpen(false);
          setEditingId(null);
        } : undefined}
        staffMembers={staffMembers}
        products={products}
        initialData={formInitial}
        isEdit={!!editingId} />

      }

      {/* Detail Dialog */}
      {detailReservation &&
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={() => setDetailReservation(null)}>
          <div className="bg-card rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-black text-foreground">{detailReservation.customer_name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[9px]">
                    {statusLabels[detailReservation.status || 'pending']}
                  </Badge>
                  {detailReservation.source &&
                <Badge variant="outline" className="text-[9px]">
                      {sourceLabels[detailReservation.source] || detailReservation.source}
                    </Badge>
                }
                </div>
              </div>
              <button onClick={() => setDetailReservation(null)} className="text-muted-foreground hover:text-foreground">
                <span className="text-lg">✕</span>
              </button>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  {detailReservation.time?.substring(0, 5)}
                  {detailReservation.end_time && ` – ${detailReservation.end_time.substring(0, 5)}`}
                </span>
                <span className="text-xs">
                  {format(new Date(detailReservation.date), 'd. MMM yyyy', { locale: de })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold">{getStaffName(detailReservation.staff_member_id)}</span>
              </div>

              {detailReservation.product_id &&
            <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-semibold">{getProductName(detailReservation.product_id)}</span>
                </div>
            }

              {detailReservation.customer_phone &&
            <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{detailReservation.customer_phone}</span>
                </div>
            }

              {detailReservation.customer_email &&
            <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{detailReservation.customer_email}</span>
                </div>
            }

              {detailReservation.notes &&
            <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2 mt-2">{detailReservation.notes}</p>
            }
            </div>

            {/* POS Checkout Section */}
            <PosCheckoutSection
              reservation={detailReservation}
              onCompleted={() => {
                setDetailReservation(null);
              }}
            />

            <div className="flex gap-2 mt-5">
              <button onClick={() => {
              handleEditFromDetail();
            }} className="flex-1 zen-button-secondary text-xs py-2.5">
                Bearbeiten
              </button>
              <button onClick={async () => {
              await onDeleteReservation(detailReservation.id);
              setDetailReservation(null);
            }} className="px-3 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      }

      {/* Smart Text Import Dialog */}
      <SmartTextImport
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        onSuccess={() => {
          setIsSmartImportOpen(false);
        }}
        defaultDate={selectedDate} />
      
    </div>);

};

export default StaffCalendarView;