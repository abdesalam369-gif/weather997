import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { KARAK_CENTER } from '../constants';
import { Incident, IncidentType } from '../types';
import { cn } from '../lib/utils';
import { Plus, X, AlertCircle, AlertTriangle, CheckCircle2, Trash2, Move, Save, Info } from 'lucide-react';

// Fix Leaflet icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  incidents: Incident[];
  showRadar: boolean;
  showWind: boolean;
  timeOffset: number;
  onAddIncident?: (incident: Omit<Incident, 'id' | 'timestamp'>) => void;
  onUpdateIncident?: (incident: Incident) => void;
  onDeleteIncident?: (id: string) => void;
}

const MapEvents = ({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const Isobars = () => {
  // Mock isobars for visual effect
  const center = KARAK_CENTER;
  const lines = [
    [ [center[0] - 0.5, center[1] - 0.5], [center[0] + 0.5, center[1] + 0.5] ],
    [ [center[0] - 0.4, center[1] - 0.6], [center[0] + 0.6, center[1] + 0.4] ],
    [ [center[0] - 0.6, center[1] - 0.4], [center[0] + 0.4, center[1] + 0.6] ],
  ];

  return (
    <>
      {lines.map((line, i) => (
        <Polyline 
          key={i} 
          positions={line as any} 
          pathOptions={{ color: 'rgba(255,255,255,0.1)', weight: 1, dashArray: '5, 10' }} 
        />
      ))}
    </>
  );
};

const WeatherRadar = ({ show, timeOffset }: { show: boolean; timeOffset: number }) => {
  if (!show) return null;
  
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') return null;
  
  return (
    <TileLayer
      url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`}
      opacity={0.6}
    />
  );
};

const INCIDENT_TYPES: { type: IncidentType; label: string; severity: Incident['severity'] }[] = [
  { type: 'road_closed_total', label: 'طريق مغلق كلياً', severity: 'critical' },
  { type: 'road_closed_partial', label: 'طريق مغلق جزئياً', severity: 'warning' },
  { type: 'culvert_blocked_total', label: 'عبارة مغلقة كلياً', severity: 'critical' },
  { type: 'culvert_blocked_partial', label: 'عبارة مغلقة جزئياً', severity: 'warning' },
  { type: 'water_accumulation', label: 'تجمع مياه', severity: 'warning' },
  { type: 'landslide', label: 'انهيار تربة/صخور', severity: 'critical' },
  { type: 'manual', label: 'بلاغ عام', severity: 'normal' },
];

const CursorFollower = ({ type, moving }: { type: IncidentType | null, moving: boolean }) => {
  const [pos, setPos] = useState<L.LatLng | null>(null);
  useMapEvents({
    mousemove: (e) => {
      setPos(e.latlng);
    },
    mouseout: () => {
      setPos(null);
    }
  });

  if (!pos || (!type && !moving)) return null;

  return (
    <CircleMarker 
      center={pos} 
      radius={12} 
      pathOptions={{ 
        color: '#3b82f6', 
        fillColor: '#3b82f6', 
        fillOpacity: 0.3, 
        dashArray: '5, 5',
        weight: 2
      }} 
      interactive={false}
    />
  );
};

export const DashboardMap: React.FC<MapViewProps> = ({ 
  incidents, 
  showRadar, 
  showWind, 
  timeOffset, 
  onAddIncident,
  onUpdateIncident,
  onDeleteIncident
}) => {
  const [reportingType, setReportingType] = useState<IncidentType | null>(null);
  const [movingIncidentId, setMovingIncidentId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [isReportingPanelVisible, setIsReportingPanelVisible] = useState(true);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  const handleMapClick = (latlng: L.LatLng) => {
    setSelectedIncidentId(null); // Deselect on map click
    if (reportingType && onAddIncident) {
      const typeInfo = INCIDENT_TYPES.find(t => t.type === reportingType);
      onAddIncident({
        title: typeInfo?.label || 'بلاغ جديد',
        description: 'تمت إضافة هذا البلاغ يدوياً من قبل المشغل عبر الخريطة.',
        location: [latlng.lat, latlng.lng],
        severity: typeInfo?.severity || 'normal',
        type: reportingType
      });
      setReportingType(null);
    } else if (movingIncidentId && onUpdateIncident) {
      const incident = incidents.find(inc => inc.id === movingIncidentId);
      if (incident) {
        onUpdateIncident({
          ...incident,
          location: [latlng.lat, latlng.lng]
        });
      }
      setMovingIncidentId(null);
    }
  };

  const handleSelectReportingType = (type: IncidentType) => {
    setReportingType(type);
    setIsReportingPanelVisible(false); // Close panel to clear view
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#10b981';
      default: return '#3b82f6';
    }
  };

  return (
    <div className={cn(
      "relative w-full h-full bg-brand-bg transition-all",
      (reportingType || movingIncidentId) && "cursor-crosshair ring-4 ring-brand-accent ring-inset z-10"
    )}>
      {(reportingType || movingIncidentId) && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] bg-brand-accent px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-sm font-bold text-white tracking-wide">
            {movingIncidentId ? 'انقر على الموقع الجديد لنقل البلاغ' : 'انقر على الخريطة لتحديد موقع البلاغ'}
          </span>
          <button 
            onClick={() => { setReportingType(null); setMovingIncidentId(null); }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold text-white transition-colors border border-white/30"
          >
            إلغاء
          </button>
        </div>
      )}

      <MapContainer 
        center={KARAK_CENTER} 
        zoom={11} 
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onMapClick={handleMapClick} />
        <CursorFollower type={reportingType} moving={!!movingIncidentId} />
        <WeatherRadar show={showRadar} timeOffset={timeOffset} />
        <Isobars />

        {incidents.map((incident) => (
          <CircleMarker
            key={incident.id}
            center={incident.location}
            radius={selectedIncidentId === incident.id ? 16 : 12}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                setSelectedIncidentId(incident.id);
              }
            }}
            pathOptions={{
              color: getSeverityColor(incident.severity),
              fillColor: getSeverityColor(incident.severity),
              fillOpacity: selectedIncidentId === incident.id ? 0.8 : 0.6,
              weight: (movingIncidentId === incident.id || selectedIncidentId === incident.id) ? 4 : 2,
              dashArray: movingIncidentId === incident.id ? '5, 5' : '0',
              className: cn(
                "transition-all duration-300",
                selectedIncidentId === incident.id && "drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              )
            }}
          >
            <Popup>
              <div className="p-3 min-w-[240px] text-right" dir="rtl">
                <div className="flex items-center justify-between mb-2">
                  <button 
                    onClick={() => {
                      setEditingIncidentId(incident.id);
                      setEditForm({ title: incident.title, description: incident.description });
                    }}
                    className="p-1.5 rounded-lg bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-all"
                    title="تعديل التفاصيل"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className={cn(
                    "text-[10px] font-bold uppercase tracking-wider flex items-center justify-end gap-1.5",
                    incident.severity === 'critical' ? 'text-red-500' : incident.severity === 'warning' ? 'text-amber-500' : 'text-emerald-500'
                  )}>
                    {incident.severity === 'critical' ? 'حادث حرج' : incident.severity === 'warning' ? 'تنبيه' : 'تم الحل'}
                    <div className={cn("w-1.5 h-1.5 rounded-full", 
                      incident.severity === 'critical' ? 'bg-red-500' : incident.severity === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                    )} />
                  </div>
                </div>
                
                <h3 className="text-brand-bg font-bold text-base mb-1">{incident.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed mb-4">{incident.description}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button 
                    onClick={() => onUpdateIncident?.({ ...incident, severity: 'critical' })}
                    className="text-[10px] py-1.5 rounded bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >حرج</button>
                  <button 
                    onClick={() => onUpdateIncident?.({ ...incident, severity: 'warning' })}
                    className="text-[10px] py-1.5 rounded bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition-colors"
                  >تنبيه</button>
                  <button 
                    onClick={() => onUpdateIncident?.({ ...incident, severity: 'success' })}
                    className="text-[10px] py-1.5 rounded bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors"
                  >تم الحل</button>
                  <button 
                    onClick={() => onUpdateIncident?.({ ...incident, severity: 'normal' })}
                    className="text-[10px] py-1.5 rounded bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-colors"
                  >عادي</button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setMovingIncidentId(incident.id)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-brand-accent/10 hover:text-brand-accent transition-all"
                      title="نقل الموقع"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteIncident?.(incident.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      title="إلغاء البلاغ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {new Date(incident.timestamp).toLocaleTimeString('ar-JO')}
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Edit Incident Modal */}
      {editingIncidentId && (
        <div className="absolute inset-0 z-[3000] bg-brand-bg/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-brand-panel border border-brand-border rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-300" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">تعديل تفاصيل البلاغ</h3>
              <button 
                onClick={() => setEditingIncidentId(null)}
                className="p-2 rounded-xl hover:bg-brand-bg/50 text-text-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">عنوان البلاغ</label>
                <input 
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all"
                  placeholder="أدخل عنواناً واضحاً..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest px-1">الوصف التفصيلي</label>
                <textarea 
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all min-h-[120px] resize-none"
                  placeholder="اشرح حالة الموقع بالتفصيل..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    const incident = incidents.find(inc => inc.id === editingIncidentId);
                    if (incident && onUpdateIncident) {
                      onUpdateIncident({
                        ...incident,
                        title: editForm.title,
                        description: editForm.description
                      });
                    }
                    setEditingIncidentId(null);
                  }}
                  className="flex-1 bg-brand-accent text-white font-bold py-3 rounded-xl hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ التغييرات
                </button>
                <button 
                  onClick={() => setEditingIncidentId(null)}
                  className="px-6 py-3 rounded-xl bg-brand-bg/50 text-text-secondary font-bold hover:bg-brand-bg transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Incident Reporting Controls */}
      <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3 items-end">
        <button 
          onClick={() => setIsReportingPanelVisible(!isReportingPanelVisible)}
          className={cn(
            "w-12 h-12 bg-brand-panel/90 backdrop-blur-xl border border-brand-border rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:text-brand-accent",
            isReportingPanelVisible ? "text-brand-accent" : "text-text-muted"
          )}
          title={isReportingPanelVisible ? "إخفاء لوحة البلاغات" : "إظهار لوحة البلاغات"}
        >
          <Plus className={cn("w-6 h-6 transition-transform duration-300", isReportingPanelVisible && "rotate-45")} />
        </button>

        {isReportingPanelVisible && (
          <div className="bg-brand-panel/90 backdrop-blur-xl border border-brand-border p-3 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[200px] animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-end gap-2 mb-2 px-1">
              <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">إضافة بلاغ جديد</h4>
              <Plus className="w-3 h-3 text-brand-accent" />
            </div>
            
            <div className="space-y-1">
              {INCIDENT_TYPES.map((item) => (
                <button 
                  key={item.type}
                  onClick={() => handleSelectReportingType(item.type)}
                  className={cn(
                    "w-full px-3 py-2 rounded-xl flex items-center justify-end gap-3 transition-all text-right group",
                    reportingType === item.type 
                      ? "bg-brand-accent text-white" 
                      : "bg-brand-bg/50 text-text-secondary hover:bg-brand-accent/10 hover:text-brand-accent"
                  )}
                >
                  <span className="text-[11px] font-bold">{item.label}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    item.severity === 'critical' ? 'bg-red-500' : item.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  )} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className={cn(
        "absolute bottom-6 right-6 z-[1000] bg-brand-panel/90 backdrop-blur-xl border border-brand-border rounded-2xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden",
        isLegendCollapsed ? "w-12 h-12 p-0" : "p-5 min-w-[180px]"
      )}>
        {isLegendCollapsed ? (
          <button 
            onClick={() => setIsLegendCollapsed(false)}
            className="w-full h-full flex items-center justify-center text-brand-accent hover:bg-brand-accent/10 transition-colors"
            title="إظهار مفتاح الخريطة"
          >
            <Info className="w-6 h-6" />
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-4 flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">دليل الخريطة</h4>
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
              </div>
              <button 
                onClick={() => setIsLegendCollapsed(true)}
                className="p-1 text-text-muted hover:text-brand-danger transition-colors"
                title="إخفاء"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-end gap-3 group cursor-help">
                <span className="text-[11px] text-text-secondary font-medium group-hover:text-text-primary transition-colors">حادث حرج</span>
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-brand-danger" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-brand-danger animate-ping opacity-20" />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 group cursor-help">
                <span className="text-[11px] text-text-secondary font-medium group-hover:text-text-primary transition-colors">تحذير / تنبيه</span>
                <div className="w-3 h-3 rounded-full bg-brand-warning" />
              </div>
              
              <div className="flex items-center justify-end gap-3 group cursor-help">
                <span className="text-[11px] text-text-secondary font-medium group-hover:text-text-primary transition-colors">طبيعي / تم الحل</span>
                <div className="w-3 h-3 rounded-full bg-brand-success" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
