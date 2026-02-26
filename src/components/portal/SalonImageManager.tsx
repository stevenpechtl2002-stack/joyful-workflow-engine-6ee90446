import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Trash2, Upload, Loader2, Plus, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalonImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

const SalonImageManager: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<SalonImage[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: imgs }, { data: cust }] = await Promise.all([
      supabase.from('salon_images' as any).select('*').eq('salon_user_id', user.id).order('sort_order'),
      supabase.from('customers').select('description').eq('id', user.id).single(),
    ]);
    setImages((imgs as any as SalonImage[]) || []);
    setDescription((cust as any)?.description || '');
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.length) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('salon-images').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('salon-images').getPublicUrl(path);

      const { error: insertError } = await supabase.from('salon_images' as any).insert({
        salon_user_id: user.id,
        image_url: publicUrl,
        sort_order: images.length,
      } as any);
      if (insertError) throw insertError;

      toast.success('Bild hochgeladen!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Upload fehlgeschlagen');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDelete = async (img: SalonImage) => {
    try {
      // Extract path from URL
      const urlParts = img.image_url.split('/salon-images/');
      if (urlParts.length > 1) {
        await supabase.storage.from('salon-images').remove([urlParts[1]]);
      }
      await supabase.from('salon_images' as any).delete().eq('id', img.id);
      toast.success('Bild gelöscht');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Fehler');
    }
  };

  const handleSaveDescription = async () => {
    if (!user) return;
    setSavingDesc(true);
    const { error } = await supabase.from('customers').update({ description }).eq('id', user.id);
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Beschreibung gespeichert!');
    }
    setSavingDesc(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salon-Beschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Beschreibe deinen Salon – was macht euch besonders?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleSaveDescription} disabled={savingDesc} size="sm">
            {savingDesc ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Speichern
          </Button>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Salon-Bilder ({images.length})
            </span>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              <Button size="sm" variant="outline" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Bild hochladen
                </span>
              </Button>
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Noch keine Bilder</p>
              <p className="text-xs text-muted-foreground">Lade Bilder hoch, die auf deinem Salon-Profil angezeigt werden.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map(img => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={img.image_url} alt={img.caption || 'Salon'} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDelete(img)}
                      className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SalonImageManager;