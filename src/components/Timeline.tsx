import React from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimelineProps {
  timeOffset: number;
  setTimeOffset: (offset: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ timeOffset, setTimeOffset, isPlaying, setIsPlaying }) => {
  const hours = Array.from({ length: 31 }, (_, i) => i - 6); // -6 to +24

  return (
    <div className="h-24 bg-brand-panel border-t border-brand-border flex items-center px-8 gap-8 flex-row-reverse">
      <div className="flex items-center gap-4 flex-row-reverse">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 transition-transform"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current mr-1 transform scale-x-[-1]" />}
        </button>
        <div className="flex gap-2 flex-row-reverse">
          <button className="p-2 text-text-muted hover:text-text-primary transition-colors"><Rewind className="w-4 h-4 transform scale-x-[-1]" /></button>
          <button className="p-2 text-text-muted hover:text-text-primary transition-colors"><FastForward className="w-4 h-4 transform scale-x-[-1]" /></button>
        </div>
      </div>

      <div className="flex-1 relative pt-6 text-right">
        <div className="absolute top-0 left-0 w-full flex justify-between px-2 flex-row-reverse">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">آخر 6س</span>
          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">الآن مباشر</span>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">توقعات +24س</span>
        </div>
        
        <div className="h-1.5 w-full bg-brand-border rounded-full relative overflow-hidden">
          <div 
            className="absolute h-full bg-brand-accent transition-all duration-300 right-0"
            style={{ width: `${((timeOffset + 6) / 30) * 100}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 px-1 flex-row-reverse">
          {hours.filter((_, i) => i % 3 === 0).map((h) => (
            <div key={h} className="flex flex-col items-center">
              <div className={cn("w-px h-2 mb-1", h === 0 ? "bg-brand-accent h-3" : "bg-brand-border")} />
              <span className={cn(
                "text-[9px] font-mono",
                h === 0 ? "text-brand-accent font-bold" : "text-text-muted"
              )}>
                {h === 0 ? 'الآن' : h > 0 ? `+${h}س` : `${h}س`}
              </span>
            </div>
          ))}
        </div>

        <input 
          type="range" 
          min="-6" 
          max="24" 
          step="1"
          value={timeOffset}
          onChange={(e) => setTimeOffset(parseInt(e.target.value))}
          className="absolute top-6 left-0 w-full h-1.5 opacity-0 cursor-pointer z-10"
        />
      </div>

      <div className="w-48 text-left">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">الوقت المحدد</div>
        <div className="text-xl font-mono font-bold text-text-primary">
          {timeOffset === 0 ? 'الوقت الفعلي' : `${timeOffset > 0 ? '+' : ''}${timeOffset} ساعة`}
        </div>
      </div>
    </div>
  );
};
