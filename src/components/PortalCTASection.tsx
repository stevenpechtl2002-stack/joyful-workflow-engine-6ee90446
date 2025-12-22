import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  FileText, 
  BarChart3, 
  ArrowRight, 
  Shield,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Termine verwalten',
    description: 'Alle Ihre Termine auf einen Blick'
  },
  {
    icon: FileText,
    title: 'Dokumente',
    description: 'Sichere Dokumentenverwaltung'
  },
  {
    icon: BarChart3,
    title: 'Statistiken',
    description: 'Echtzeit-Daten und Analysen'
  },
  {
    icon: Shield,
    title: 'Sicher',
    description: 'Höchste Sicherheitsstandards'
  }
];

const PortalCTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Mitgliederbereich</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
            Ihr persönliches <span className="text-gradient">Portal</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Als Mitglied erhalten Sie Zugang zu Ihrem personalisierten Dashboard mit 
            Echtzeit-Daten, Terminverwaltung und vielem mehr.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass p-6 rounded-2xl border border-border/50 text-center hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card p-8 md:p-12 rounded-3xl border border-primary/20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              
              <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
                Jetzt kostenlos registrieren
              </h3>
              
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Erstellen Sie Ihren Account und erhalten Sie sofort Zugang zu allen Features 
                Ihres persönlichen Dashboards.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/portal/auth">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Jetzt registrieren
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/portal/auth">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Anmelden
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PortalCTASection;
