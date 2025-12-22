import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  FileText, 
  Bell, 
  CheckCircle2, 
  Plus,
  TrendingUp,
  Inbox,
  Clock,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  useDashboardStats, 
  useUpcomingAppointments, 
  useRecentActivity,
  useAppointmentStatusStats 
} from '@/hooks/useDashboardData';

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: appointments, isLoading: appointmentsLoading, refetch: refetchAppointments } = useUpcomingAppointments();
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useRecentActivity();
  const { data: statusStats, isLoading: chartLoading } = useAppointmentStatusStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const handleRefresh = () => {
    refetchStats();
    refetchAppointments();
    refetchActivities();
  };

  const statCards = [
    { 
      label: 'Anstehende Termine', 
      value: stats?.upcomingAppointments ?? 0, 
      icon: Calendar, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/portal/appointments'
    },
    { 
      label: 'Dokumente', 
      value: stats?.documents ?? 0, 
      icon: FileText, 
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/portal/documents'
    },
    { 
      label: 'Ungelesene Nachrichten', 
      value: stats?.unreadNotifications ?? 0, 
      icon: Bell, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      link: '/portal/notifications'
    },
    { 
      label: 'Erledigte Termine', 
      value: stats?.completedAppointments ?? 0, 
      icon: CheckCircle2, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/portal/appointments'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bestätigt';
      case 'pending': return 'Ausstehend';
      case 'cancelled': return 'Abgesagt';
      case 'completed': return 'Abgeschlossen';
      default: return status;
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Benutzer'}!
          </h1>
          <p className="text-muted-foreground">
            Willkommen in Ihrem Portal. Hier ist Ihre Übersicht.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Aktualisieren
        </Button>
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
                      {statsLoading ? (
                        <Skeleton className="h-9 w-12" />
                      ) : (
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      )}
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
        {/* Upcoming Appointments */}
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
              {appointmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30">
                      <Skeleton className="w-12 h-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : appointments && appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-medium text-foreground truncate">{apt.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                            {getStatusLabel(apt.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(apt.start_time), 'dd. MMM, HH:mm', { locale: de })}
                          </span>
                          {apt.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {apt.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link to="/portal/appointments">
                    <Button variant="ghost" className="w-full mt-2">
                      Alle Termine anzeigen
                    </Button>
                  </Link>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Chart + Recent Activity */}
        <div className="space-y-6">
          {/* Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-display">Terminübersicht</CardTitle>
                <CardDescription>Status Ihrer Termine</CardDescription>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="h-[180px] flex items-center justify-center">
                    <Skeleton className="w-32 h-32 rounded-full" />
                  </div>
                ) : statusStats && statusStats.length > 0 ? (
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statusStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {statusStats.map((item) => (
                        <div key={item.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex flex-col items-center justify-center text-center">
                    <TrendingUp className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Keine Daten vorhanden</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-display">Letzte Aktivitäten</CardTitle>
                <CardDescription>Ihre neuesten Benachrichtigungen</CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-2 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${activity.read ? 'bg-muted' : 'bg-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'dd. MMM, HH:mm', { locale: de })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Link to="/portal/notifications">
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        Alle anzeigen
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Inbox className="w-6 h-6 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Noch keine Aktivitäten</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
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
                  <span>Profil</span>
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
