import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QubeFeatureBoxProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function QubeFeatureBox({ icon: Icon, title, description }: QubeFeatureBoxProps) {
  return (
    <div className="group bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all duration-150 hover:-translate-y-1">
      <div className="flex flex-col items-center text-center">
        {/* Icon with colored background */}
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-150">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        
        {/* Content */}
        <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

