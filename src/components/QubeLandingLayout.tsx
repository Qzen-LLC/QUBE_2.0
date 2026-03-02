import React from 'react';
import Image from 'next/image';
import { QubeFeatureBox } from './QubeFeatureBox';
import { QubeValuePillars } from './QubeValuePillars';
import { 
  Brain, 
  BarChart3, 
  Shield, 
  DollarSign, 
  AlertTriangle, 
  Building2,
  Target,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface QubeLandingLayoutProps {
  children: React.ReactNode;
  subtitleOverride?: string;
}

export function QubeLandingLayout({ children, subtitleOverride }: QubeLandingLayoutProps) {
  const features = [
    {
      icon: Brain,
      title: "AI Use‑Case Assessment",
      description: "Structured scoring with feasibility & ethics checks."
    },
    {
      icon: BarChart3,
      title: "Executive Dashboard",
      description: "Portfolio KPIs, risk analytics & ROI."
    },
    {
      icon: Shield,
      title: "Regulatory Compliance",
      description: "EU AI Act & ISO 42001 etc mapping with evidence."
    },
    {
      icon: DollarSign,
      title: "FinOps Projections",
      description: "Cost/ROI models, budgets & forecasts."
    },
    {
      icon: AlertTriangle,
      title: "Risk Management",
      description: "Multi‑dimensional scoring & monitoring."
    },
    {
      icon: Building2,
      title: "Vendor Assessment",
      description: "Third‑party diligence & contracts."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Hero Layout */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
        
        {/* Header Section - Clean & Minimal */}
        <div className="text-center mb-16 max-w-4xl">
          <div className="flex items-center justify-center mb-8">
            <div className="mr-3">
              <Image 
                src="https://vgwacd4qotpurdv6.public.blob.vercel-storage.com/logo/logo.png" 
                alt="QUBE Logo" 
                width={32} 
                height={32} 
                className="rounded-lg object-contain" 
              />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">QUBE™</h1>
          </div>
          
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            AI Command Center
          </h2>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            {subtitleOverride ?? 'For AI leaders Managing Risk, Compliance, and ROI at Scale.'}
          </p>
        </div>

        {/* Authentication Section - Simplified */}
        <div className="w-full max-w-md mb-16">
          {children}
        </div>

        {/* Horizontal Divider - Subtle */}
        <div className="w-full max-w-4xl mb-16">
          <div className="border-t border-border"></div>
        </div>

        {/* Feature Grid - Clean Cards */}
        <div className="w-full max-w-6xl mb-16">
          <h3 className="text-2xl font-semibold text-foreground mb-8 text-center tracking-tight">
            Why QUBE?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <QubeFeatureBox
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>

        {/* Value Pillars - Modern Pills */}
        <div className="w-full max-w-4xl">
          <QubeValuePillars />
        </div>
      </div>
    </div>
  );
}


