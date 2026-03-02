'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';

export default function ThemeTest() {
  const { theme, setTheme, isDark, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading theme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Dark Mode Test</h1>
          <p className="text-muted-foreground text-lg">
            Test component to verify dark mode implementation
          </p>
        </div>

        {/* Theme Controls */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Theme Controls</CardTitle>
            <CardDescription className="text-muted-foreground">
              Current theme: {theme} | Is Dark: {isDark ? 'Yes' : 'No'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => setTheme('light')}
                variant={theme === 'light' ? 'default' : 'outline'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Light Mode
              </Button>
              <Button 
                onClick={() => setTheme('dark')}
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Dark Mode
              </Button>
              <Button 
                onClick={() => setTheme('system')}
                variant={theme === 'system' ? 'default' : 'outline'}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Background Colors */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Background Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 bg-background rounded border border-border flex items-center px-3">
                <span className="text-foreground text-sm">bg-background</span>
              </div>
              <div className="h-8 bg-card rounded border border-border flex items-center px-3">
                <span className="text-foreground text-sm">bg-card</span>
              </div>
              <div className="h-8 bg-muted rounded border border-border flex items-center px-3">
                <span className="text-muted-foreground text-sm">bg-muted</span>
              </div>
            </CardContent>
          </Card>

          {/* Text Colors */}
          <Card className="bg-card border border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Text Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-foreground">text-foreground</p>
              <p className="text-muted-foreground">text-muted-foreground</p>
              <p className="text-primary">text-primary</p>
              <p className="text-success">text-success</p>
              <p className="text-warning">text-warning</p>
              <p className="text-destructive">text-destructive</p>
            </CardContent>
          </Card>
        </div>

        {/* Component Examples */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Component Examples</CardTitle>
            <CardDescription className="text-muted-foreground">
              These components should automatically adapt to the current theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buttons */}
            <div className="space-y-2">
              <h3 className="text-foreground font-semibold">Buttons</h3>
              <div className="flex gap-2 flex-wrap">
                <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Primary
                </Button>
                <Button variant="secondary" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                  Secondary
                </Button>
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  Outline
                </Button>
                <Button variant="destructive" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Destructive
                </Button>
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-2">
              <h3 className="text-foreground font-semibold">Badges</h3>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  Primary
                </Badge>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Secondary
                </Badge>
                <Badge variant="outline" className="border-border text-foreground">
                  Outline
                </Badge>
                <Badge variant="destructive" className="bg-destructive text-destructive-foreground">
                  Destructive
                </Badge>
              </div>
            </div>

            {/* Form Elements */}
            <div className="space-y-2">
              <h3 className="text-foreground font-semibold">Form Elements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Input placeholder" 
                  className="w-full px-3 py-2 border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                />
                <select className="w-full px-3 py-2 border border-border rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSS Variables Display */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="text-foreground">CSS Variables</CardTitle>
            <CardDescription className="text-muted-foreground">
              Current CSS variable values (check browser dev tools)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-2">Background</p>
                <div className="h-6 bg-background rounded border border-border"></div>
                <p className="text-xs text-muted-foreground mt-1">--background</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Foreground</p>
                <div className="h-6 bg-foreground rounded border border-border"></div>
                <p className="text-xs text-muted-foreground mt-1">--foreground</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Card</p>
                <div className="h-6 bg-card rounded border border-border"></div>
                <p className="text-xs text-muted-foreground mt-1">--card</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



