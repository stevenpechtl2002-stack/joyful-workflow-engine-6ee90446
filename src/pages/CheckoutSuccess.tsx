import React from 'react';
import { CheckCircle2, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-black text-foreground">Zahlung erfolgreich!</h1>
        <p className="text-muted-foreground font-medium">
          Vielen Dank! Deine Buchung wurde bestätigt und die Zahlung erfolgreich verarbeitet.
          Du erhältst eine Bestätigung per E-Mail.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/storefront')}
            className="inline-flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Zum Marktplatz
          </button>
          <button
            onClick={() => navigate('/storefront/profile')}
            className="inline-flex items-center gap-2 px-6 py-4 bg-muted text-foreground rounded-xl font-black text-sm transition-all hover:bg-muted/80"
          >
            <Calendar className="w-4 h-4" /> Meine Termine
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
