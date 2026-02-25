import React from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-foreground">Zahlung erfolgreich!</h1>
        <p className="text-muted-foreground font-medium">
          Vielen Dank für deinen Einkauf. Du erhältst eine Bestätigung per E-Mail.
        </p>
        <button
          onClick={() => navigate('/storefront')}
          className="inline-flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Storefront
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
