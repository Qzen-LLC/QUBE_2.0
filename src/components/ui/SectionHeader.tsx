"use client";

import React from "react";

interface SectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({ icon, title, description, className, actions }: SectionHeaderProps) {
  return (
    <div className={`mb-2 flex items-start justify-between gap-3 ${className || ""}`}> 
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export default SectionHeader;




