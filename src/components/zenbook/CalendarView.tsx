import React, { useState, useRef } from 'react';
import { 
  format, 
  isSameDay, 
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval
} from 'date-fns';
import { de } from 'date-fns/locale';
import { SERVICES, BUSINESS_HOURS } from '@/constants';
import { Appointment, Staff } from '@/types';
import { Plus, ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, Clock, Settings2, Minus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

interface Props {
  appointments: Appointment[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onUpdateAppointment: (app: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  staff: Staff[];
  onSlotClick: (staffId: string, hour: number) => void;
}

// Time interval options in minutes
const TIME_INTERVALS = [15, 30, 60] as const;
type TimeInterval = typeof TIME_INTERVALS[number];

const CalendarView: React.FC<Props> = ({ 
  appointments, 
  selectedDate, 
  setSelectedDate, 
  onUpdateAppointment,
  staff,
  onSlotClick
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedStaffId] = useState<string>(staff[0]?.id || '');
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  
  // Customizable settings
  const [rowHeight, setRowHeight] = useState(112); // Default row height in pixels
  const [timeInterval, setTimeInterval] = useState<TimeInterval>(60); // Default 60 min intervals
  
  // Generate time slots based on interval
  const generateTimeSlots = () => {
    const slots = [];
    const slotsPerHour = 60 / timeInterval;
    const totalSlots = (BUSINESS_HOURS.end - BUSINESS_HOURS.start) * slotsPerHour;
    
    for (let i = 0; i < totalSlots; i++) {
      const hour = BUSINESS_HOURS.start + Math.floor(i / slotsPerHour);
      const minute = (i % slotsPerHour) * timeInterval;
      slots.push({ hour, minute, label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}` });
    }
    return slots;
  };
  
  const timeSlots = generateTimeSlots();
  const slotHeight = rowHeight / (60 / timeInterval); // Height per slot

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { locale: de }),
    end: endOfWeek(selectedDate, { locale: de })
  });

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      setIsSwiping(true);
      if (diff > 0) {
        setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : 7));
      } else {
        setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : -7));
      }
      setTimeout(() => setIsSwiping(false), 300);
    }
    touchStartRef.current = null;
  };

  const totalHeight = timeSlots.length * slotHeight;

  return (
    <div 
      className={`h-full flex flex-col transition-all duration-300 ${isSwiping ? 'opacity-50 scale-[0.995]' : 'opacity-100'}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Calendar Header */}
      <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <h3 className="text-4xl font-black text-foreground tracking-tighter">
            {format(selectedDate, 'EEEE, d. MMMM', { locale: de })}
          </h3>
          <div className="flex gap-1 bg-muted p-1.5 rounded-[1.2rem] border border-border shadow-sm">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 hover:bg-card hover:shadow-sm rounded-xl text-muted-foreground transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setSelectedDate(new Date())} className="px-5 py-2 text-[11px] font-black text-primary hover:bg-card hover:shadow-sm rounded-xl transition-all">Heute</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 hover:bg-card hover:shadow-sm rounded-xl text-muted-foreground transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="bg-muted p-1.5 rounded-[1.2rem] flex border border-border shadow-sm">
            <button onClick={() => setViewMode('day')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewMode === 'day' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-4 h-4" /> TAG
            </button>
            <button onClick={() => setViewMode('week')} className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewMode === 'week' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
              <CalendarDays className="w-4 h-4" /> WOCHE
            </button>
          </div>

          {/* Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-3 bg-muted hover:bg-card rounded-xl border border-border shadow-sm text-muted-foreground hover:text-foreground transition-all">
                <Settings2 className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-6 bg-card border border-border rounded-2xl shadow-2xl" align="end">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-black text-foreground mb-1">Kalender Einstellungen</h4>
                  <p className="text-xs text-muted-foreground">Passe die Ansicht an deine Bedürfnisse an.</p>
                </div>

                {/* Row Height Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Zeilenhöhe</label>
                    <span className="text-xs font-black text-primary">{rowHeight}px</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setRowHeight(Math.max(60, rowHeight - 10))}
                      className="p-2 bg-muted rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <Slider
                      value={[rowHeight]}
                      onValueChange={(value) => setRowHeight(value[0])}
                      min={60}
                      max={200}
                      step={10}
                      className="flex-1"
                    />
                    <button 
                      onClick={() => setRowHeight(Math.min(200, rowHeight + 10))}
                      className="p-2 bg-muted rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Time Interval Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Zeitabschnitte</label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_INTERVALS.map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setTimeInterval(interval)}
                        className={`py-3 px-4 rounded-xl text-xs font-black transition-all ${
                          timeInterval === interval 
                            ? 'bg-primary text-primary-foreground shadow-lg' 
                            : 'bg-muted text-muted-foreground hover:bg-card hover:text-foreground border border-border'
                        }`}
                      >
                        {interval} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Schnellauswahl</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setRowHeight(80); setTimeInterval(30); }}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:bg-card hover:text-foreground border border-border transition-all"
                    >
                      Kompakt
                    </button>
                    <button
                      onClick={() => { setRowHeight(112); setTimeInterval(60); }}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:bg-card hover:text-foreground border border-border transition-all"
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => { setRowHeight(140); setTimeInterval(30); }}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:bg-card hover:text-foreground border border-border transition-all"
                    >
                      Komfortabel
                    </button>
                    <button
                      onClick={() => { setRowHeight(60); setTimeInterval(15); }}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-muted text-muted-foreground hover:bg-card hover:text-foreground border border-border transition-all"
                    >
                      Detailliert
                    </button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-[2rem] overflow-hidden flex flex-col shadow-sm relative">
        {/* Header Row */}
        <div className="flex border-b border-border bg-card sticky top-0 z-20 h-20 items-center">
          <div className="w-20 border-r border-border shrink-0 flex items-center justify-center">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          {viewMode === 'day' ? (
            staff.map(person => (
              <div key={person.id} className="flex-1 px-6 flex items-center gap-4 border-r border-border last:border-r-0 min-w-[150px]">
                <div className="w-10 h-10 rounded-[1.2rem] overflow-hidden border border-border bg-card shrink-0 shadow-sm">
                  <img src={person.avatar} className="w-full h-full object-cover" alt={person.name} />
                </div>
                <p className="font-black text-foreground text-sm tracking-tight truncate">{person.name}</p>
              </div>
            ))
          ) : (
            weekDays.map(day => (
              <div key={day.toString()} className={`flex-1 flex flex-col justify-center text-center border-r border-border last:border-r-0 min-w-[100px] ${isSameDay(day, new Date()) ? 'bg-primary/10' : ''}`}>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{format(day, 'EEE', { locale: de })}</p>
                <p className={`text-xl font-black ${isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</p>
              </div>
            ))
          )}
        </div>

        {/* Scrollable Time Grid */}
        <div className="flex-1 overflow-y-auto relative no-scrollbar">
          <div className="flex" style={{ minHeight: `${totalHeight}px` }}>
            {/* Time Labels Column */}
            <div className="w-20 border-r border-border bg-card/30 shrink-0">
              {timeSlots.map((slot, idx) => (
                <div 
                  key={`${slot.hour}-${slot.minute}`} 
                  className="px-4 text-[10px] font-black text-muted-foreground text-right pr-6 flex items-start pt-2"
                  style={{ height: `${slotHeight}px` }}
                >
                  {slot.minute === 0 || timeInterval < 60 ? slot.label : ''}
                </div>
              ))}
            </div>

            {/* Staff/Day Columns */}
            {viewMode === 'day' ? (
              staff.map(person => (
                <div key={person.id} className="flex-1 relative border-r border-border last:border-r-0 min-w-[150px]">
                  {timeSlots.map((slot) => (
                    <div 
                      key={`${slot.hour}-${slot.minute}`} 
                      onClick={() => onSlotClick(person.id, slot.hour + slot.minute / 60)}
                      className={`border-b hover:bg-muted/30 transition-colors cursor-pointer group flex items-start justify-center pt-2 ${
                        slot.minute === 0 ? 'border-border/80' : 'border-border/30'
                      }`}
                      style={{ height: `${slotHeight}px` }}
                    >
                      <Plus className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {appointments.filter(a => a.staffId === person.id && isSameDay(a.startTime, selectedDate)).map(app => (
                    <AppointmentCard 
                      key={app.id} 
                      app={app} 
                      onEdit={onUpdateAppointment} 
                      slotHeight={slotHeight}
                      timeInterval={timeInterval}
                    />
                  ))}
                </div>
              ))
            ) : (
              weekDays.map(day => (
                <div key={day.toString()} className="flex-1 relative border-r border-border last:border-r-0 min-w-[100px]">
                  {timeSlots.map((slot) => (
                    <div 
                      key={`${slot.hour}-${slot.minute}`} 
                      onClick={() => onSlotClick(selectedStaffId, slot.hour + slot.minute / 60)}
                      className={`border-b hover:bg-muted/30 transition-colors cursor-pointer group flex items-start justify-center pt-2 ${
                        slot.minute === 0 ? 'border-border/80' : 'border-border/30'
                      }`}
                      style={{ height: `${slotHeight}px` }}
                    >
                      <Plus className="w-4 h-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  {appointments.filter(a => a.staffId === selectedStaffId && isSameDay(a.startTime, day)).map(app => (
                    <AppointmentCard 
                      key={app.id} 
                      app={app} 
                      onEdit={onUpdateAppointment} 
                      slotHeight={slotHeight}
                      timeInterval={timeInterval}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AppointmentCardProps {
  app: Appointment;
  onEdit: (app: Appointment) => void;
  slotHeight: number;
  timeInterval: TimeInterval;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ app, onEdit, slotHeight, timeInterval }) => {
  const startHour = app.startTime.getHours();
  const startMin = app.startTime.getMinutes();
  const slotsPerHour = 60 / timeInterval;
  const pixelsPerMinute = slotHeight / timeInterval;
  
  const top = ((startHour - BUSINESS_HOURS.start) * 60 + startMin) * pixelsPerMinute;
  const service = SERVICES.find(s => s.id === app.serviceId);
  const duration = app.isBlock ? (app.durationOverride || 60) : (service?.duration || 60);
  const height = duration * pixelsPerMinute;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onEdit(app); }}
      className={`absolute left-2 right-2 rounded-[1.2rem] p-4 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] border-l-[6px] transition-all cursor-pointer z-10 group overflow-hidden active:scale-[0.98]
        ${app.isBlock ? 'bg-muted border-muted-foreground shadow-none' : 'bg-card border-primary'}
      `}
      style={{ top: `${top + 4}px`, height: `${Math.max(height - 8, 32)}px` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 opacity-40">
          <Clock className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{format(app.startTime, 'HH:mm')}</span>
        </div>
      </div>
      <p className={`font-black text-sm truncate leading-tight ${app.isBlock ? 'text-muted-foreground' : 'text-foreground'}`}>{app.customerName}</p>
      {!app.isBlock && height > 60 && <p className="text-[9px] font-black text-primary uppercase tracking-widest truncate mt-1">{service?.name}</p>}
    </div>
  );
};

export default CalendarView;
