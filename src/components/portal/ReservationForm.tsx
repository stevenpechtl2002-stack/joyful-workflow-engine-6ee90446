import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStaffMembers } from '@/hooks/useStaffMembers';

interface ReservationData {
  id?: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  reservation_date: string;
  reservation_time: string;
  end_time?: string | null;
  party_size: number;
  notes?: string | null;
  status?: string;
  staff_member_id?: string | null;
}

interface ReservationFormProps {
  onSuccess: () => void;
  defaultValues?: {
    reservation_date?: string;
    reservation_time?: string;
    staff_member_id?: string;
  };
  editData?: ReservationData;
  mode?: 'create' | 'edit';
}

const ReservationForm = ({ onSuccess, defaultValues, editData, mode = 'create' }: ReservationFormProps) => {
  const { user } = useAuth();
  const { staffMembers } = useStaffMembers();
  const activeStaffMembers = staffMembers.filter(s => s.is_active);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    editData?.reservation_date 
      ? new Date(editData.reservation_date) 
      : defaultValues?.reservation_date 
        ? new Date(defaultValues.reservation_date) 
        : undefined
  );
  
  const [formData, setFormData] = useState({
    customer_name: editData?.customer_name || '',
    customer_phone: editData?.customer_phone || '',
    customer_email: editData?.customer_email || '',
    party_size: editData?.party_size || 2,
    reservation_time: editData?.reservation_time?.slice(0, 5) || defaultValues?.reservation_time || '19:00',
    end_time: editData?.end_time?.slice(0, 5) || '',
    notes: editData?.notes || '',
    staff_member_id: editData?.staff_member_id || defaultValues?.staff_member_id || '',
    status: editData?.status || 'pending',
  });

  useEffect(() => {
    if (editData) {
      setDate(new Date(editData.reservation_date));
      setFormData({
        customer_name: editData.customer_name || '',
        customer_phone: editData.customer_phone || '',
        customer_email: editData.customer_email || '',
        party_size: editData.party_size || 2,
        reservation_time: editData.reservation_time?.slice(0, 5) || '19:00',
        end_time: editData.end_time?.slice(0, 5) || '',
        notes: editData.notes || '',
        staff_member_id: editData.staff_member_id || '',
        status: editData.status || 'pending',
      });
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !date || !formData.customer_name) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }
    
    setSubmitting(true);
    try {
      if (mode === 'edit' && editData?.id) {
        const { error } = await supabase
          .from('reservations')
          .update({
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone || null,
            customer_email: formData.customer_email || null,
            party_size: formData.party_size,
            reservation_date: format(date, 'yyyy-MM-dd'),
            reservation_time: formData.reservation_time,
            end_time: formData.end_time || null,
            notes: formData.notes || null,
            staff_member_id: formData.staff_member_id || null,
            status: formData.status,
          })
          .eq('id', editData.id);

        if (error) throw error;
        toast.success('Reservierung aktualisiert');
      } else {
        const { error } = await supabase
          .from('reservations')
          .insert({
            user_id: user.id,
            customer_name: formData.customer_name,
            customer_phone: formData.customer_phone || null,
            customer_email: formData.customer_email || null,
            party_size: formData.party_size,
            reservation_date: format(date, 'yyyy-MM-dd'),
            reservation_time: formData.reservation_time,
            end_time: formData.end_time || null,
            notes: formData.notes || null,
            source: 'manual',
            status: 'pending',
            staff_member_id: formData.staff_member_id || null,
          });

        if (error) throw error;
        toast.success('Reservierung erstellt');
      }

      onSuccess();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label>Kundenname *</Label>
          <Input
            value={formData.customer_name}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
            placeholder="Max Mustermann"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Telefon</Label>
          <Input
            value={formData.customer_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
            placeholder="+49 123 456789"
          />
        </div>

        <div className="space-y-2">
          <Label>E-Mail</Label>
          <Input
            type="email"
            value={formData.customer_email}
            onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label>Datum *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: de }) : "Datum wählen"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={de}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Uhrzeit *</Label>
          <Input
            type="time"
            value={formData.reservation_time}
            onChange={(e) => setFormData(prev => ({ ...prev, reservation_time: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>End-Zeit</Label>
          <Input
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Personen *</Label>
          <Select 
            value={formData.party_size.toString()} 
            onValueChange={(v) => setFormData(prev => ({ ...prev, party_size: parseInt(v) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? 'Person' : 'Personen'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeStaffMembers.length > 0 && (
          <div className="space-y-2">
            <Label>Mitarbeiter</Label>
            <Select 
              value={formData.staff_member_id} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, staff_member_id: v === 'none' ? '' : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nicht zugewiesen</SelectItem>
                {activeStaffMembers.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: staff.color }} />
                      {staff.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === 'edit' && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Notizen / Dienstleistung</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Besondere Wünsche, Dienstleistung, etc."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : null}
        {mode === 'edit' ? 'Reservierung speichern' : 'Reservierung erstellen'}
      </Button>
    </form>
  );
};

export default ReservationForm;
