import React from 'react';
import { useContacts } from '@/hooks/useContacts';
import { Search, Mail, Phone, Calendar, MoreVertical, TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const CustomerManagement: React.FC = () => {
  const { contacts, loading } = useContacts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-black text-foreground tracking-tight">Kundenstamm</h3>
          <p className="text-muted-foreground font-medium mt-2">Verwalte deine loyale Community und analysiere das Buchungsverhalten.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-emerald-50 px-6 py-4 rounded-[1.8rem] border border-emerald-100 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Kunden</p>
              <p className="text-lg font-black text-foreground">{contacts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[3.5rem] shadow-2xl border border-border overflow-hidden">
        <div className="p-8 border-b border-border flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Kunden suchen..." 
              className="w-full pl-16 pr-8 py-4 bg-muted rounded-2xl border-none font-bold text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kunde</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kontakt</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Besuche</th>
                <th className="px-8 py-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Letzter Besuch</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-muted-foreground">
                    Noch keine Kunden vorhanden.
                  </td>
                </tr>
              ) : (
                contacts.map(contact => (
                  <tr key={contact.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-foreground">{contact.name}</p>
                          {contact.notes && (
                            <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[150px]">{contact.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {contact.phone}
                          </div>
                        )}
                        {!contact.email && !contact.phone && (
                          <span className="text-xs text-muted-foreground">Keine Kontaktdaten</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-4 py-2 bg-muted rounded-xl text-xs font-black text-foreground">
                        {contact.booking_count || 0}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> 
                        {contact.last_visit ? format(new Date(contact.last_visit), 'dd. MMM yyyy', { locale: de }) : 'Nie'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
