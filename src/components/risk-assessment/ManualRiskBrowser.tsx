'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Download,
  X,
  Database,
  ChevronDown,
  Building2,
  GraduationCap,
  Shield,
  Sparkles,
  FileText,
  Scale,
  AlertTriangle,
  Filter,
  ExternalLink,
  Loader2,
  Zap,
  MoreHorizontal,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RiskDetailPanel } from './RiskDetailPanel';

interface ManualRiskBrowserProps {
  open: boolean;
  onClose: () => void;
  useCaseId: string;
}

// QUBE AI Risk Data taxonomy configuration
const TAXONOMY_CONFIG: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  'qube-legacy-mit': { name: 'MIT AI Risk Repository', icon: <GraduationCap className="h-4 w-4" />, color: 'purple' },
  'ai-risk-taxonomy': { name: 'AIR 2024', icon: <FileText className="h-4 w-4" />, color: 'indigo' },
  'ibm-risk-atlas': { name: 'IBM AI Risk Atlas', icon: <Building2 className="h-4 w-4" />, color: 'blue' },
  'qube-legacy-ibm': { name: 'IBM (Extended)', icon: <Building2 className="h-4 w-4" />, color: 'sky' },
  'credo-ai-ucf': { name: 'Credo UCF', icon: <Scale className="h-4 w-4" />, color: 'violet' },
  'nist-ai-rmf': { name: 'NIST AI RMF', icon: <Shield className="h-4 w-4" />, color: 'cyan' },
  'ailuminate-v1.0': { name: 'AILuminate', icon: <Sparkles className="h-4 w-4" />, color: 'amber' },
  'owasp-llm-top-10-2025': { name: 'OWASP Top 10 LLMs', icon: <AlertTriangle className="h-4 w-4" />, color: 'red' },
  'ibm-granite-guardian': { name: 'Granite Guardian', icon: <Shield className="h-4 w-4" />, color: 'emerald' },
  'shieldgemma-taxonomy': { name: 'ShieldGemma', icon: <Shield className="h-4 w-4" />, color: 'teal' },
};

interface AtlasRisk {
  id: string;
  name: string;
  description: string;
  isDefinedByTaxonomy: string;
  tags?: string[];
  dateCreated?: string;
}

export function ManualRiskBrowser({ open, onClose, useCaseId }: ManualRiskBrowserProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisks, setSelectedRisks] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [allRisks, setAllRisks] = useState<AtlasRisk[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-select taxonomy filter
  const [selectedTaxonomies, setSelectedTaxonomies] = useState<Set<string>>(new Set());

  // AI Search state
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<AtlasRisk[] | null>(null);
  const [relevanceScores, setRelevanceScores] = useState<Record<string, number>>({});
  const [aiSearchQuery, setAiSearchQuery] = useState('');

  // Risk Detail Panel state
  const [selectedRiskForDetails, setSelectedRiskForDetails] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Fetch risks from QUBE AI Risk Data API
  useEffect(() => {
    if (open) {
      fetchRisks();
    }
  }, [open]);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      // Fetch all risks from QUBE AI Risk Data
      const response = await fetch('/api/qube-ai-nexus/risks?limit=5000');

      if (response.ok) {
        const data = await response.json();
        setAllRisks(data.risks || []);
      } else {
        console.error('Failed to fetch risks');
      }
    } catch (error) {
      console.error('Error fetching risks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group risks by taxonomy
  const risksByTaxonomy = useMemo(() => {
    const grouped: Record<string, AtlasRisk[]> = {};
    allRisks.forEach(risk => {
      const taxonomy = risk.isDefinedByTaxonomy || 'unknown';
      if (!grouped[taxonomy]) {
        grouped[taxonomy] = [];
      }
      grouped[taxonomy].push(risk);
    });
    return grouped;
  }, [allRisks]);

  // Get taxonomy list with counts
  const taxonomyList = useMemo(() => {
    return Object.entries(risksByTaxonomy)
      .map(([taxonomy, risks]) => ({
        id: taxonomy,
        name: TAXONOMY_CONFIG[taxonomy]?.name || taxonomy,
        count: risks.length,
        icon: TAXONOMY_CONFIG[taxonomy]?.icon || <Database className="h-4 w-4" />,
        color: TAXONOMY_CONFIG[taxonomy]?.color || 'gray',
      }))
      .sort((a, b) => b.count - a.count);
  }, [risksByTaxonomy]);

  // Filter risks based on search query and selected taxonomies
  const filteredRisks = useMemo(() => {
    // If AI search results are active, use those
    if (aiSearchResults) {
      return aiSearchResults;
    }

    let risks = allRisks;

    // Apply multi-taxonomy filter
    if (selectedTaxonomies.size > 0) {
      risks = risks.filter(risk => selectedTaxonomies.has(risk.isDefinedByTaxonomy));
    }

    // Apply keyword search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      risks = risks.filter(risk =>
        risk.name?.toLowerCase().includes(lowerQuery) ||
        risk.description?.toLowerCase().includes(lowerQuery) ||
        risk.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return risks;
  }, [allRisks, selectedTaxonomies, searchQuery, aiSearchResults]);

  // Toggle taxonomy selection
  const toggleTaxonomy = (taxonomyId: string) => {
    const newSelection = new Set(selectedTaxonomies);
    if (newSelection.has(taxonomyId)) {
      newSelection.delete(taxonomyId);
    } else {
      newSelection.add(taxonomyId);
    }
    setSelectedTaxonomies(newSelection);
    // Clear AI search when changing filters
    setAiSearchResults(null);
    setRelevanceScores({});
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTaxonomies(new Set());
    setSearchQuery('');
    setAiSearchResults(null);
    setRelevanceScores({});
    setAiSearchQuery('');
  };

  // AI Semantic Search
  const handleAISearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter a search query',
        description: 'Please enter a search term to use AI search',
        variant: 'destructive',
      });
      return;
    }

    setIsAISearching(true);
    setAiSearchQuery(searchQuery);

    try {
      const response = await fetch('/api/qube-ai-nexus/risks/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          taxonomies: selectedTaxonomies.size > 0 ? Array.from(selectedTaxonomies) : undefined,
          limit: 30,
        }),
      });

      if (!response.ok) {
        throw new Error('AI search failed');
      }

      const data = await response.json();
      setAiSearchResults(data.risks);
      setRelevanceScores(data.relevanceScores || {});

      toast({
        title: 'AI Search Complete',
        description: `Found ${data.risks.length} semantically relevant risks`,
      });
    } catch (error) {
      console.error('AI search error:', error);
      toast({
        title: 'AI Search Failed',
        description: 'Could not perform semantic search. Using keyword search instead.',
        variant: 'destructive',
      });
    } finally {
      setIsAISearching(false);
    }
  };

  // Toggle risk selection
  const toggleRiskSelection = (riskId: string) => {
    const newSelection = new Set(selectedRisks);
    if (newSelection.has(riskId)) {
      newSelection.delete(riskId);
    } else {
      newSelection.add(riskId);
    }
    setSelectedRisks(newSelection);
  };

  // View risk details
  const handleViewDetails = (riskId: string) => {
    // Only open detail panel for Atlas risks (not MITRE or AIID)
    if (!riskId.startsWith('mitre-') && !riskId.startsWith('aiid-')) {
      setSelectedRiskForDetails(riskId);
      setShowDetailPanel(true);
    } else {
      toast({
        title: 'Details not available',
        description: 'Detailed view is only available for QUBE AI Risk Data entries',
      });
    }
  };

  // Import selected risks
  const handleImport = async () => {
    if (selectedRisks.size === 0) {
      toast({
        title: 'No risks selected',
        description: 'Please select at least one risk to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      // Get selected risk details
      const selectedRiskDetails = allRisks.filter(r => selectedRisks.has(r.id));

      // Transform to import format with proper source detection
      const risksToImport = selectedRiskDetails.map(risk => {
        let source: string;
        let sourceId: string;

        if (risk.id.startsWith('mitre-')) {
          source = 'mitre';
          sourceId = risk.id.replace('mitre-', '');
        } else if (risk.id.startsWith('aiid-')) {
          source = 'aiid';
          sourceId = risk.id.replace('aiid-', '');
        } else {
          source = 'atlas';
          sourceId = risk.id;
        }

        return {
          source,
          sourceId,
          name: risk.name,
          description: risk.description,
          taxonomy: risk.isDefinedByTaxonomy,
        };
      });

      const response = await fetch(`/api/risks/${useCaseId}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRisks: risksToImport }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import risks');
      }

      const result = await response.json();

      toast({
        title: 'Risks Imported',
        description: `Successfully imported ${result.imported} risk(s) to your use case`,
      });

      setSelectedRisks(new Set());
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import risks',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const hasActiveFilters = selectedTaxonomies.size > 0 || aiSearchResults !== null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-2xl font-bold">Browse QUBE AI Risk Data</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Explore and select risks from {allRisks.length}+ entries across {taxonomyList.length} sources
            </p>

            {/* Search Bar with AI Search */}
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search risks by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Clear AI results when typing new query
                    if (aiSearchResults && e.target.value !== aiSearchQuery) {
                      setAiSearchResults(null);
                      setRelevanceScores({});
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleAISearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleAISearch}
                disabled={!searchQuery.trim() || isAISearching}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {isAISearching ? (
                  <>
                    Searching...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    AI Search
                  </>
                )}
              </Button>
            </div>
          </DialogHeader>

          {/* Horizontal Filter Bar - Single Line with More Dropdown */}
          <div className="flex items-center gap-2 pb-4 border-b flex-wrap">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              <Filter className="h-3 w-3 inline mr-1" />
              Sources:
            </span>

            {/* First 5 sources as chips */}
            {taxonomyList.slice(0, 5).map(taxonomy => {
              const isSelected = selectedTaxonomies.has(taxonomy.id);
              return (
                <button
                  key={taxonomy.id}
                  onClick={() => toggleTaxonomy(taxonomy.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {taxonomy.icon}
                  <span>{taxonomy.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {taxonomy.count}
                  </span>
                </button>
              );
            })}

            {/* More dropdown for remaining sources */}
            {taxonomyList.length > 5 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    taxonomyList.slice(5).some(t => selectedTaxonomies.has(t.id))
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                    <MoreHorizontal className="h-3 w-3" />
                    <span>More</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      taxonomyList.slice(5).some(t => selectedTaxonomies.has(t.id))
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {taxonomyList.length - 5}
                    </span>
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {taxonomyList.slice(5).map(taxonomy => (
                    <DropdownMenuCheckboxItem
                      key={taxonomy.id}
                      checked={selectedTaxonomies.has(taxonomy.id)}
                      onCheckedChange={() => toggleTaxonomy(taxonomy.id)}
                    >
                      <span className="flex items-center gap-2 w-full">
                        {taxonomy.icon}
                        <span className="flex-1">{taxonomy.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {taxonomy.count}
                        </Badge>
                      </span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* AI Search indicator */}
            {aiSearchResults && (
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                <Zap className="h-3 w-3 mr-1" />
                AI: {aiSearchResults.length}
              </Badge>
            )}

            {/* Clear filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}

            {/* Results count */}
            <div className="ml-auto text-sm text-muted-foreground">
              {filteredRisks.length} found
            </div>
          </div>

          {/* Risk List */}
          <div className="flex-1 mt-4 overflow-y-auto h-[calc(90vh-320px)] pr-2 border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="ml-3 text-muted-foreground">Loading risks...</span>
              </div>
            ) : filteredRisks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No risks found matching your criteria</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {filteredRisks.map((risk) => (
                  <RiskCard
                    key={risk.id}
                    risk={risk}
                    selected={selectedRisks.has(risk.id)}
                    onToggle={() => toggleRiskSelection(risk.id)}
                    onViewDetails={() => handleViewDetails(risk.id)}
                    taxonomyConfig={TAXONOMY_CONFIG[risk.isDefinedByTaxonomy]}
                    relevanceScore={relevanceScores[risk.id]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedRisks.size} risk(s) selected for import
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedRisks.size === 0 || importing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                {importing ? (
                  <>
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import Selected Risks
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Detail Panel */}
      <RiskDetailPanel
        riskId={selectedRiskForDetails}
        open={showDetailPanel}
        onClose={() => {
          setShowDetailPanel(false);
          setSelectedRiskForDetails(null);
        }}
      />
    </>
  );
}

// Enhanced Risk Card Component
function RiskCard({
  risk,
  selected,
  onToggle,
  onViewDetails,
  taxonomyConfig,
  relevanceScore,
}: {
  risk: AtlasRisk;
  selected: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  taxonomyConfig?: { name: string; icon: React.ReactNode; color: string };
  relevanceScore?: number;
}) {
  const color = taxonomyConfig?.color || 'gray';
  const taxonomyName = taxonomyConfig?.name || risk.isDefinedByTaxonomy;
  const isAtlasRisk = !risk.id.startsWith('mitre-') && !risk.id.startsWith('aiid-');

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all relative ${
        selected ? 'ring-2 ring-purple-500 shadow-lg bg-purple-50 dark:bg-purple-950/30' : 'hover:shadow-md bg-white dark:bg-gray-900'
      }`}
      onClick={onToggle}
    >
      {/* Relevance Score Badge */}
      {relevanceScore !== undefined && (
        <Badge
          className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white"
        >
          {Math.round(relevanceScore * 100)}% match
        </Badge>
      )}

      <div className="flex items-start gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle()}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-xs bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 border-${color}-300 dark:border-${color}-700`}
            >
              {taxonomyName}
            </Badge>
            {risk.tags?.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h4 className="font-semibold text-foreground mb-2 pr-20">{risk.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">{risk.description}</p>

          {/* View Details button - only for Atlas risks */}
          {isAtlasRisk && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Details & Related Items
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
