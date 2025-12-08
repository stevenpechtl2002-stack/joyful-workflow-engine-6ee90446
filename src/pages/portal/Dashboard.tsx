import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  FileText, 
  Bell, 
  CheckCircle2, 
  Plus,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const statCards = [
    { 
      label: 'Anstehende Termine', 
      value: 0, 
      icon: Calendar, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/portal/appointments'
    },
    { 
      label: 'Dokumente', 
      value: 0, 
      icon: FileText, 
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/portal/documents'
    },
    { 
      label: 'Ungelesene Nachrichten', 
      value: 0, 
      icon: Bell, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      link: '/portal/notifications'
    },
    { 
      label: 'Erledigte Aufgaben', 
      value: 0, 
      icon: CheckCircle2, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/portal'
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Benutzer'}!
        </h1>
        <p className="text-muted-foreground">
          Willkommen in Ihrem Portal.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments - Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="glass border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display">Anstehende Termine</CardTitle>
                <CardDescription>Ihre nächsten geplanten Termine</CardDescription>
              </div>
              <Link to="/portal/appointments">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Termin
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Noch keine Termine vorhanden</p>
                <Link to="/portal/appointments">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ersten Termin erstellen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity - Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass border-border/50 h-full">
            <CardHeader>
              <CardTitle className="text-xl font-display">Letzte Aktivitäten</CardTitle>
              <CardDescription>Ihre neuesten Aktionen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Inbox className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Noch keine Aktivitäten</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-6"
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-display">Schnellaktionen</CardTitle>
            <CardDescription>Häufig verwendete Funktionen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/portal/appointments">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 hover:border-primary/50">
                  <Calendar className="w-6 h-6" />
                  <span>Termin buchen</span>
                </Button>
              </Link>
              <Link to="/portal/documents">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 hover:border-primary/50">
                  <FileText className="w-6 h-6" />
                  <span>Dokument hochladen</span>
                </Button>
              </Link>
              <Link to="/portal/notifications">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 hover:border-primary/50">
                  <Bell className="w-6 h-6" />
                  <span>Nachrichten</span>
                </Button>
              </Link>
              <Link to="/portal/profile">
                <Button variant="outline" className="w-full h-24 flex-col gap-2 hover:border-primary/50">
                  <TrendingUp className="w-6 h-6" />
                  <span>Status ansehen</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
