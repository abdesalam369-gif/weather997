import React, { useState, useEffect, useCallback } from 'react';
import { DashboardMap } from './components/DashboardMap';
import { Sidebar } from './components/Sidebar';
import { WeatherData, Incident } from './types';
import { MOCK_INCIDENTS, KARAK_CENTER } from './constants';
import { ShieldAlert, Map as MapIcon, Layers, Activity, Sun, Moon } from 'lucide-react';
import { cn } from './lib/utils';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [weather, setWeather] = useState<WeatherData>({
    temp: 14.5,
    humidity: 78,
    windSpeed: 22.4,
    pressure: 1012,
    rainfall: 12.5,
    description: 'Cloudy with intermittent rain',
    timestamp: Date.now(),
  });

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showRadar, setShowRadar] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const fetchWeather = useCallback(async () => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('OpenWeatherMap API Key missing. Using mock data.');
      return;
    }

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${KARAK_CENTER[0]}&lon=${KARAK_CENTER[1]}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.main || !data.weather || !data.weather[0]) {
        throw new Error('Invalid weather data structure received from API');
      }

      setWeather({
        temp: data.main.temp ?? 0,
        humidity: data.main.humidity ?? 0,
        windSpeed: (data.wind?.speed || 0) * 3.6, // m/s to km/h
        pressure: data.main.pressure ?? 0,
        rainfall: data.rain ? data.rain['1h'] || 0 : 0,
        description: data.weather[0].description || 'N/A',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching weather:', error instanceof Error ? error.message : error);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const alerts = [
    { type: 'خطر فيضانات', severity: 'red' as const, message: 'خطر مرتفع لحدوث فيضانات مفاجئة في وادي الكرك ومنطقة غور الصافي. يرجى توخي الحذر الشديد.' },
    { type: 'تحذير رياح', severity: 'yellow' as const, message: 'من المتوقع هبوب رياح قوية تصل سرعتها إلى 60 كم/س في مرتفعات المزار خلال الـ 4 ساعات القادمة.' },
    { type: 'حالة الطرق', severity: 'green' as const, message: 'جميع الطرق الرئيسية مفتوحة حالياً. الرؤية الأفقية تزيد عن 500 متر.' }
  ];

  const handleAddIncident = useCallback((newIncident: Omit<Incident, 'id' | 'timestamp' | 'status'>) => {
    const incident: Incident = {
      ...newIncident,
      id: `manual-${Date.now()}`,
      status: 'pending',
      timestamp: Date.now(),
    };
    setIncidents(prev => [incident, ...prev]);
  }, []);

  const handleUpdateIncident = useCallback((updatedIncident: Incident) => {
    setIncidents(prev => prev.map(inc => inc.id === updatedIncident.id ? updatedIncident : inc));
  }, []);

  const handleDeleteIncident = useCallback((incidentId: string) => {
    setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-brand-bg text-white overflow-hidden" dir="rtl">
      {/* API Key Warning Overlay (Only visible if key is missing and radar is requested) */}
      {showRadar && (!import.meta.env.VITE_OPENWEATHER_API_KEY || import.meta.env.VITE_OPENWEATHER_API_KEY === 'YOUR_API_KEY_HERE') && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[2000] bg-brand-warning/20 backdrop-blur-md border border-brand-warning/50 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-brand-warning animate-pulse" />
          <span className="text-[10px] font-bold text-brand-warning uppercase tracking-widest">
            وضع المحاكاة: يرجى إضافة مفتاح API لتفعيل رادار الطقس المباشر
          </span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 border-b border-brand-border flex items-center justify-between px-6 bg-brand-panel/50 backdrop-blur-md z-50 flex-row-reverse">
        <div className="flex items-center gap-6 flex-row-reverse">
          <div className="text-left">
            <div className="text-sm font-mono font-bold text-text-primary">{new Date().toLocaleDateString('ar-JO', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{new Date().toLocaleTimeString('ar-JO')} ت ع م+3</div>
          </div>

          <div className="flex items-center gap-1 flex-row-reverse">
            <button 
              onClick={() => setShowRadar(!showRadar)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                showRadar ? "bg-brand-accent border-brand-accent text-white" : "bg-transparent border-brand-border text-text-muted"
              )}
            >
              الرادار
            </button>
            <button 
              onClick={() => setShowWind(!showWind)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                showWind ? "bg-brand-accent border-brand-accent text-white" : "bg-transparent border-brand-border text-text-muted"
              )}
            >
              الرياح
            </button>
          </div>

          <div className="flex items-center gap-2 bg-brand-bg/50 px-3 py-1.5 rounded-full border border-brand-border flex-row-reverse">
            <Activity className="w-3 h-3 text-brand-success" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">حالة الشبكة: طبيعية</span>
          </div>

          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-brand-panel border border-brand-border text-gray-400 hover:text-brand-accent transition-colors"
            title={theme === 'dark' ? 'تفعيل الوضع المضيء' : 'تفعيل الوضع الداكن'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-4 flex-row-reverse">
          <div className="text-right">
            <h1 className="text-lg font-bold tracking-tight text-text-primary">غرفة طوارئ بلدية مؤتة والمزار</h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">نظام إدارة الطوارئ</p>
          </div>
          <div className="bg-brand-danger/20 p-2 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-brand-danger" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-row-reverse relative">
        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 z-[60] w-6 h-12 bg-brand-panel border border-brand-border flex items-center justify-center text-gray-400 hover:text-brand-accent transition-all shadow-xl rounded-l-lg",
            isSidebarCollapsed ? "right-0" : "right-72"
          )}
          title={isSidebarCollapsed ? "إظهار الشريط الجانبي" : "إخفاء الشريط الجانبي"}
        >
          <div className={cn("transition-transform duration-300", isSidebarCollapsed ? "rotate-180" : "rotate-0")}>
            <Activity className="w-4 h-4 rotate-90" />
          </div>
        </button>

        {/* Main Map View */}
        <main className="flex-1 relative">
          <DashboardMap 
            incidents={incidents} 
            showRadar={showRadar} 
            showWind={showWind} 
            timeOffset={0}
            onAddIncident={handleAddIncident}
            onUpdateIncident={handleUpdateIncident}
            onDeleteIncident={handleDeleteIncident}
          />
          
          {/* Map Controls Floating */}
          <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-2">
            <button className="w-10 h-10 bg-brand-panel/90 backdrop-blur-md border border-brand-border rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <MapIcon className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-brand-panel/90 backdrop-blur-md border border-brand-border rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </button>
          </div>
        </main>

        {/* Right Sidebar */}
        <Sidebar weather={weather} alerts={alerts} isCollapsed={isSidebarCollapsed} />
      </div>
    </div>
  );
};

export default App;
