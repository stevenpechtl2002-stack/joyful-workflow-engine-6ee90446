import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import SalonImageManager from '@/components/portal/SalonImageManager';
import {
  Store, Camera, Save, Loader2, MapPin, Phone, Globe, Instagram, Facebook, ExternalLink, Upload, X
} from 'lucide-react';

const CATEGORIES = ['Friseur', 'Barbershop', 'Kosmetik', 'Nagelstudio', 'Massage', 'Spa & Wellness', 'Tattoo', 'Sonstiges'];

const SalonProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    category: 'Friseur',
    description: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    website_url: '',
    instagram_url: '',
    facebook_url: '',
    logo_url: '',
    cover_image_url: '',
  });

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('customers')
        .select('company_name, category, description, address, postal_code, city, phone, website_url, instagram_url, facebook_url, logo_url, cover_image_url')
        .eq('id', user.id)
        .single();
      if (data) {
        setFormData({
          company_name: (data as any).company_name || '',
          category: (data as any).category || 'Friseur',
          description: (data as any).description || '',
          phone: (data as any).phone || '',
          address: (data as any).address || '',
          postal_code: (data as any).postal_code || '',
          city: (data as any).city || '',
          website_url: (data as any).website_url || '',
          instagram_url: (data as any).instagram_url || '',
          facebook_url: (data as any).facebook_url || '',
          logo_url: (data as any).logo_url || '',
          cover_image_url: (data as any).cover_image_url || '',
        });
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({
        company_name: formData.company_name || null,
        category: formData.category || null,
        description: formData.description || null,
        address: formData.address || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        phone: formData.phone || null,
        website_url: formData.website_url || null,
        instagram_url: formData.instagram_url || null,
        facebook_url: formData.facebook_url || null,
        logo_url: formData.logo_url || null,
        cover_image_url: formData.cover_image_url || null,
      } as any)
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Fehler beim Speichern');
    } else {
      toast.success('Salon-Profil gespeichert!');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingLogo(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/logo.${ext}`;
    const { error } = await supabase.storage.from('salon-logos').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload fehlgeschlagen'); setUploadingLogo(false); return; }
    const { data: urlData } = supabase.storage.from('salon-logos').getPublicUrl(path);
    setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl + '?t=' + Date.now() }));
    setUploadingLogo(false);
    toast.success('Logo hochgeladen!');
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingCover(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/cover.${ext}`;
    const { error } = await supabase.storage.from('salon-logos').upload(path, file, { upsert: true });
    if (error) { toast.error('Upload fehlgeschlagen'); setUploadingCover(false); return; }
    const { data: urlData } = supabase.storage.from('salon-logos').getPublicUrl(path);
    setFormData(prev => ({ ...prev, cover_image_url: urlData.publicUrl + '?t=' + Date.now() }));
    setUploadingCover(false);
    toast.success('Cover-Bild hochgeladen!');
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
              <Store className="w-7 h-7 text-primary" />
              Salon-Profil
            </h1>
            <p className="text-muted-foreground">Gestalte dein öffentliches Marktplatz-Profil</p>
          </div>
          <a
            href={`/storefront/${user?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Live-Vorschau
          </a>
        </div>
      </motion.div>

      <div className="grid gap-6">
        {/* Logo & Cover */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Profilbild & Cover
              </CardTitle>
              <CardDescription>Logo und Titelbild für dein Salon-Profil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              <div>
                <Label className="text-sm font-bold mb-2 block">Cover-Bild</Label>
                <div className="relative rounded-2xl overflow-hidden bg-muted h-48 group">
                  {formData.cover_image_url ? (
                    <>
                      <img src={formData.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Upload className="w-8 h-8 mb-2" />
                      <p className="text-sm">Cover-Bild hochladen</p>
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 bg-black/20 flex items-center justify-center transition-opacity">
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
                    {uploadingCover ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                  </label>
                </div>
              </div>

              {/* Logo */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={formData.logo_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {formData.company_name?.[0]?.toUpperCase() || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 cursor-pointer rounded-full opacity-0 group-hover:opacity-100 bg-black/30 flex items-center justify-center transition-opacity">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                    {uploadingLogo ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  </label>
                </div>
                <div>
                  <p className="font-bold text-foreground">{formData.company_name || 'Dein Salon'}</p>
                  <p className="text-sm text-muted-foreground">Klicke auf das Bild zum Ändern</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Salon Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Salon-Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salon-Name</Label>
                  <Input value={formData.company_name} onChange={e => setFormData(prev => ({ ...prev, company_name: e.target.value }))} placeholder="Mein Salon" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={formData.category} onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Erzähle etwas über deinen Salon..." className="bg-secondary/50 min-h-[100px]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Kontaktdaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={formData.phone} onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))} placeholder="+49 123 456789" className="pl-10 bg-secondary/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adresse</Label>
                  <Input value={formData.address} onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))} placeholder="Musterstraße 1" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>PLZ</Label>
                  <Input value={formData.postal_code} onChange={e => setFormData(prev => ({ ...prev, postal_code: e.target.value }))} placeholder="12345" className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Stadt</Label>
                  <Input value={formData.city} onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))} placeholder="Berlin" className="bg-secondary/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Media */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Social Media & Website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={formData.website_url} onChange={e => setFormData(prev => ({ ...prev, website_url: e.target.value }))} placeholder="https://meinsalon.de" className="pl-10 bg-secondary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={formData.instagram_url} onChange={e => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))} placeholder="https://instagram.com/meinsalon" className="pl-10 bg-secondary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={formData.facebook_url} onChange={e => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))} placeholder="https://facebook.com/meinsalon" className="pl-10 bg-secondary/50" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gallery Manager */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Galerie
              </CardTitle>
              <CardDescription>Bilder für dein öffentliches Profil</CardDescription>
            </CardHeader>
            <CardContent>
              <SalonImageManager />
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salon-Profil speichern
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SalonProfile;
