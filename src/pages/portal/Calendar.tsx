import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useReservations } from '@/hooks/usePortalData';
import ReservationForm from '@/components/portal/ReservationForm';
import { StaffCalendarView } from '@/components/portal/StaffCalendarView';

const Calendar = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { refetch } = useReservations();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Kalender</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Reservierungen übersichtlich.
          </p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Neue Reservierung
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Neue Reservierung</DialogTitle>
            </DialogHeader>
            <ReservationForm onSuccess={() => { setIsFormOpen(false); refetch(); }} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StaffCalendarView />
      </motion.div>
    </div>
  );
};

export default Calendar;
