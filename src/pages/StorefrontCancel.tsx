import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/zenbook/Logo';

const StorefrontCancel = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [status, setStatus] = useState<'loading' | 'confirm' | 'cancelling' | 'success' | 'error'>('loading');
  const [booking, setBooking] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!bookingId) return;
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    // We need to fetch via edge function since RLS may block direct access
    // For now, try direct fetch (works if user is logged in as customer)
    const { data, error } = await supabase
      .from('storefront_bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error || !data) {
      setErrorMessage('Buchung nicht gefunden.');
      setStatus('error');
      return;
    }

    if (data.status === 'cancelled') {
      setErrorMessage('Diese Buchung wurde bereits storniert.');
      setStatus('error');
      return;
    }

    setBooking(data);
    setStatus('confirm');
  };

  const handleCancel = async () => {
    setStatus('cancelling');
    try {
      const { data, error } = await supabase.functions.invoke('storefront-cancel', {
        body: { booking_id: bookingId },
      });

      if (error) {
        const msg = (data as any)?.error || error.message || 'Stornierung fehlgeschlagen';
        setErrorMessage(msg);
        setStatus('error');
        return;
      }

      if (data?.error) {
        setErrorMessage(data.error);
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch (e: any) {
      setErrorMessage(e.message || 'Ein Fehler ist aufgetreten');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-6">
        <Logo />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Buchung laden...'}
            {status === 'confirm' && 'Termin stornieren'}
            {status === 'cancelling' && 'Wird storniert...'}
            {status === 'success' && 'Stornierung bestätigt'}
            {status === 'error' && 'Stornierung nicht möglich'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          )}

          {status === 'confirm' && booking && (
            <>
              <div className="text-center space-y-2 w-full">
                <p className="text-muted-foreground">Möchtest du folgenden Termin wirklich stornieren?</p>
                <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                  <p><strong>Name:</strong> {booking.customer_name}</p>
                  <p><strong>Datum:</strong> {booking.booking_date}</p>
                  <p><strong>Uhrzeit:</strong> {booking.booking_time?.slice(0, 5)}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/storefront">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Zurück
                  </Link>
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancel}>
                  Stornieren
                </Button>
              </div>
            </>
          )}

          {status === 'cancelling' && (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-muted-foreground">
                Dein Termin wurde erfolgreich storniert. Du erhältst eine Bestätigung per E-Mail.
              </p>
              <Button asChild>
                <Link to="/storefront">Zurück zum Marktplatz</Link>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{errorMessage}</p>
              <Button variant="outline" asChild>
                <Link to="/storefront">Zurück zum Marktplatz</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorefrontCancel;
