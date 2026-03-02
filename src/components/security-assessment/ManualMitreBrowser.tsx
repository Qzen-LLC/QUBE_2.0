'use client';

import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, Download, X, Filter } from 'lucide-react';
import { mitreAtlasService } from '@/lib/integrations/mitre-atlas.service';
import type { MitreTechniqueData } from '@/lib/integrations/types';
import { useToast } from '@/hooks/use-toast';
import { SecurityTechniqueCard } from './SecurityTechniqueCard';

interface ManualMitreBrowserProps {
  open: boolean;
  onClose: () => void;
  useCaseId: string;
}

export function ManualMitreBrowser({ open, onClose, useCaseId }: ManualMitreBrowserProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTactic, setSelectedTactic] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedTechniques, setSelectedTechniques] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  // Get all MITRE techniques
  const allTechniques = useMemo(
    () => mitreAtlasService.getAllTechniques(),
    []
  );

  // Get unique tactics
  const uniqueTactics = useMemo(() => {
    const tactics = new Set(allTechniques.map((t) => t.tactic).filter(Boolean));
    return Array.from(tactics).sort();
  }, [allTechniques]);

  // Filter techniques
  const filteredTechniques = useMemo(() => {
    return allTechniques.filter((technique) => {
      // Search filter
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          technique.technique.toLowerCase().includes(searchLower) ||
          technique.description.toLowerCase().includes(searchLower) ||
          technique.techniqueId.toLowerCase().includes(searchLower) ||
          (technique.tactic && technique.tactic.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Tactic filter
      if (selectedTactic !== 'all') {
        if (!technique.tactic || !technique.tactic.toLowerCase().includes(selectedTactic.toLowerCase())) {
          return false;
        }
      }

      // Severity filter
      if (selectedSeverity !== 'all') {
        if (technique.severity !== selectedSeverity) {
          return false;
        }
      }

      return true;
    });
  }, [allTechniques, searchQuery, selectedTactic, selectedSeverity]);

  // Toggle technique selection
  const toggleTechniqueSelection = (techniqueId: string) => {
    const newSelection = new Set(selectedTechniques);
    if (newSelection.has(techniqueId)) {
      newSelection.delete(techniqueId);
    } else {
      newSelection.add(techniqueId);
    }
    setSelectedTechniques(newSelection);
  };

  // Import selected techniques
  const handleImport = async () => {
    if (selectedTechniques.size === 0) {
      toast({
        title: 'No techniques selected',
        description: 'Please select at least one security technique to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // Transform selected techniques into API format
      const techniquesToImport = Array.from(selectedTechniques).map((techniqueId) => ({
        source: 'mitre',
        sourceId: techniqueId,
      }));

      const response = await fetch(`/api/risks/${useCaseId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRisks: techniquesToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import security techniques');
      }

      const result = await response.json();

      toast({
        title: 'Security Techniques Imported',
        description: `Successfully imported ${result.imported} security technique(s) from MITRE ATLAS`,
      });

      // Clear selection and close
      setSelectedTechniques(new Set());
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import security techniques',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Browse MITRE ATLAS Techniques</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Explore all {allTechniques.length} adversarial techniques for AI systems
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search techniques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tactic Filter */}
            <Select value={selectedTactic} onValueChange={setSelectedTactic}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by tactic" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tactics</SelectItem>
                {uniqueTactics.map((tactic) => (
                  <SelectItem key={tactic} value={tactic}>
                    {tactic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Severity Filter */}
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter by severity" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Results Summary */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <span>
              Showing {filteredTechniques.length} of {allTechniques.length} techniques
            </span>
            {(searchQuery || selectedTactic !== 'all' || selectedSeverity !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTactic('all');
                  setSelectedSeverity('all');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Techniques List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {filteredTechniques.map((technique) => (
            <SecurityTechniqueCard
              key={technique.techniqueId}
              technique={technique}
              selected={selectedTechniques.has(technique.techniqueId)}
              onToggle={() => toggleTechniqueSelection(technique.techniqueId)}
            />
          ))}

          {filteredTechniques.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No techniques found matching your filters</p>
              <Button variant="link" onClick={() => {
                setSearchQuery('');
                setSelectedTactic('all');
                setSelectedSeverity('all');
              }} className="mt-2">
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            {selectedTechniques.size} technique{selectedTechniques.size !== 1 ? 's' : ''} selected for import
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedTechniques.size === 0 || importing}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
            >
              {importing ? (
                <>
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Selected Techniques
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
