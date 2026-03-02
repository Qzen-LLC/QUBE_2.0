import React from 'react';

export function QubeValuePillars() {
  const pillars = ['CLARITY', 'CONTROL', 'GOVERNANCE', 'VALUE'];
  
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {pillars.map((pillar) => (
        <div
          key={pillar}
          className="px-4 py-2 bg-muted text-muted-foreground text-xs font-medium rounded-full hover:bg-muted/80 transition-colors duration-150"
        >
          {pillar}
        </div>
      ))}
    </div>
  );
}

