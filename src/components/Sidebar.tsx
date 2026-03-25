import React from 'react';
import { Thermometer, Droplets, Wind, Gauge, CloudRain, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { WeatherData } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  weather: WeatherData;
  alerts: { type: string; severity: 'red' | 'yellow' | 'green'; message: string }[];
  isCollapsed?: boolean;
  width?: number;
  isResizing?: boolean;
}

const MetricCard = ({ icon: Icon, label, value, unit, colorClass, isCollapsed }: any) => (
  <div className={cn(
    "p-3 rounded-xl flex flex-col gap-1.5 transition-all hover:bg-brand-bg/50 group border border-transparent hover:border-brand-border/50",
    isCollapsed && "items-center p-2"
  )}>
    <div className={cn("flex items-center justify-between flex-row-reverse w-full", isCollapsed && "justify-center")}>
      <Icon className={cn("w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity", colorClass.split(' ')[1])} />
      {!isCollapsed && <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.1em]">{label}</div>}
    </div>

    {!isCollapsed && (
      <>
        <div className="flex items-baseline justify-end gap-1 flex-row-reverse">
          <span className="text-xl font-mono font-bold text-text-primary tracking-tight">{value}</span>
          <span className="text-[11px] text-text-muted font-medium">{unit}</span>
        </div>

        <div className="h-[1.5px] w-full bg-brand-border/30 rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-1000 ease-out", colorClass.split(' ')[0])}
            style={{ width: `${Math.min(100, (parseFloat(value) / (unit === '°م' ? 50 : unit === '%' ? 100 : unit === 'كم/س' ? 120 : 1100)) * 100)}%` }}
          />
        </div>
      </>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ weather, alerts, isCollapsed, width = 288, isResizing }) => {
  return (
    <div 
      className={cn(
        "h-full bg-brand-panel border-r border-brand-border flex flex-col p-6 overflow-y-auto text-right",
        !isResizing && "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-0 p-0 opacity-0 pointer-events-none border-none" : ""
      )}
      style={{ width: isCollapsed ? 0 : width }}
    >
      {!isCollapsed && (
        <>
          <div className="mb-8 relative">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-brand-accent/5 blur-3xl rounded-full" />
            <h2 className="text-[11px] font-bold text-brand-accent uppercase tracking-[0.2em] mb-1.5">بلدية مؤتة والمزار</h2>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight leading-tight">غرفة الطوارئ<br />المركزية</h1>
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest text-right">تحديث مباشر: {new Date().toLocaleTimeString('ar-JO')}</span>
              <div className="flex gap-1 shrink-0">
                <div className="w-1 h-1 rounded-full bg-brand-success animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-brand-success animate-pulse delay-75" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-10">
            <MetricCard 
              icon={Thermometer} 
              label="الحرارة" 
              value={weather.temp.toFixed(1)} 
              unit="°م" 
              colorClass="bg-orange-500 text-orange-500" 
              isCollapsed={isCollapsed}
            />
            <MetricCard 
              icon={Droplets} 
              label="الرطوبة" 
              value={weather.humidity} 
              unit="%" 
              colorClass="bg-blue-500 text-blue-500" 
              isCollapsed={isCollapsed}
            />
            <MetricCard 
              icon={Wind} 
              label="الرياح" 
              value={weather.windSpeed.toFixed(1)} 
              unit="كم/س" 
              colorClass="bg-cyan-500 text-cyan-500" 
              isCollapsed={isCollapsed}
            />
            <MetricCard 
              icon={CloudRain} 
              label="الأمطار" 
              value={weather.rainfall.toFixed(1)} 
              unit="ملم" 
              colorClass="bg-indigo-500 text-indigo-500" 
              isCollapsed={isCollapsed}
            />
            <div className="col-span-2">
              <MetricCard 
                icon={Gauge} 
                label="الضغط الجوي" 
                value={weather.pressure} 
                unit="هـ.ب" 
                colorClass="bg-purple-500 text-purple-500" 
                isCollapsed={isCollapsed}
              />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-[12px] font-bold text-text-muted uppercase tracking-widest mb-4">التنبيهات النشطة</h3>
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "p-4 rounded-xl border flex gap-3 items-start flex-row-reverse relative overflow-hidden group transition-all hover:bg-brand-panel/80",
                    alert.severity === 'red' ? "bg-red-500/5 border-red-500/20" : 
                    alert.severity === 'yellow' ? "bg-amber-500/5 border-amber-500/20" : 
                    "bg-emerald-500/5 border-emerald-500/20"
                  )}
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-1.5 h-full",
                    alert.severity === 'red' ? "bg-red-500" : 
                    alert.severity === 'yellow' ? "bg-amber-500" : 
                    "bg-emerald-500"
                  )} />
                  
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    alert.severity === 'red' ? "bg-red-500/10 text-red-500" : 
                    alert.severity === 'yellow' ? "bg-amber-500/10 text-amber-500" : 
                    "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {alert.severity === 'red' ? <ShieldAlert className="w-5 h-5" /> : 
                     alert.severity === 'yellow' ? <AlertTriangle className="w-5 h-5" /> : 
                     <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.1em] mb-1",
                      alert.severity === 'red' ? "text-red-500" : 
                      alert.severity === 'yellow' ? "text-amber-500" : 
                      "text-emerald-500"
                    )}>
                      {alert.type}
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed font-medium line-clamp-3">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-brand-border">
            <div className="flex justify-between items-center mb-4 flex-row-reverse">
              <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">مصدر البيانات</span>
              <span className="text-[12px] font-bold text-text-primary uppercase">OpenWeatherMap API</span>
            </div>
            <div className="text-[11px] text-text-muted leading-relaxed">
              بيانات تشغيلية لغرفة عمليات طوارئ الكرك. 
              للموظفين المصرح لهم فقط. يتم تحديث البيانات تلقائياً كل 5 دقائق.
            </div>
          </div>
        </>
      )}
    </div>
  );
};
