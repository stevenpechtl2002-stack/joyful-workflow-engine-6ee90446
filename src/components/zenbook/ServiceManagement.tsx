import React from 'react';
import { Service } from '@/types';
import { Search, Plus, MoreVertical, Clock, Tag } from 'lucide-react';

interface Props {
  services: Service[];
}

const ServiceManagement: React.FC<Props> = ({ services }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Nach Dienstleistungen suchen..." 
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-all shadow-lg">
          <Plus className="w-5 h-5" />
          Service hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow group relative">
            <button className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">{service.category}</span>
                <h4 className="font-bold text-lg text-foreground leading-tight">{service.name}</h4>
              </div>
            </div>
            
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{service.duration} min</span>
              </div>
              <div className="text-xl font-bold text-foreground">
                {service.price} €
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceManagement;