'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Database,
  Plus,
  Upload,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Info,
  Sparkles,
  FileText
} from 'lucide-react';
import EntryCollector from './EntryCollector';
import { GoldenDataset, GoldenEntry } from '@/lib/golden/types';

interface GoldenDatasetDashboardProps {
  useCaseId: string;
}

const GoldenDatasetDashboard: React.FC<GoldenDatasetDashboardProps> = ({ useCaseId }) => {
  const [activeTab, setActiveTab] = useState('entries');
  const [datasets, setDatasets] = useState<GoldenDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<GoldenDataset | null>(null);
  const [entries, setEntries] = useState<GoldenEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCollector, setShowCollector] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, [useCaseId]);

  useEffect(() => {
    if (selectedDataset) {
      fetchEntries(selectedDataset.id);
    }
  }, [selectedDataset]);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/golden/datasets?useCaseId=${useCaseId}`);
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
        if (data.length > 0 && !selectedDataset) {
          setSelectedDataset(data[0]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch datasets' }));
        console.error('Failed to fetch datasets:', errorData);
        alert(`Failed to load datasets: ${errorData.error}${errorData.details ? ' - ' + errorData.details : ''}`);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      alert('Error loading datasets. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (datasetId: string) => {
    try {
      const response = await fetch(`/api/golden/entries?datasetId=${datasetId}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const createDataset = async () => {
    const name = prompt('Enter dataset name:');
    if (!name) return;

    try {
      const response = await fetch('/api/golden/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId,
          name,
          description: `Golden dataset for ${name}`,
          metadata: {
            domain: 'general',
            useCase: name,
            modelType: 'generation',
            createdBy: 'user'
          }
        })
      });

      if (response.ok) {
        await fetchDatasets();
        alert(`Dataset "${name}" created successfully!`);
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to create dataset:', errorData);
        const errorMsg = `Failed to create dataset: ${errorData.error || 'Unknown error'}${errorData.details ? '\n\nDetails: ' + errorData.details : ''}`;
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error creating dataset:', error);
      alert('Error creating dataset. Please check the console for details.');
    }
  };

  const collectFromProduction = async () => {
    if (!selectedDataset) return;

    setRefreshing(true);
    try {
      const response = await fetch('/api/golden/collect/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          filters: {},
          limit: 50
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Collected ${result.entriesCreated} entries from production`);
        await fetchEntries(selectedDataset.id);
      }
    } catch (error) {
      console.error('Error collecting from production:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const generateSynthetic = async () => {
    if (!selectedDataset) return;

    setRefreshing(true);
    try {
      const response = await fetch('/api/golden/collect/synthetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset.id,
          count: 20,
          strategy: 'augmentation'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Generated ${result.entriesCreated} synthetic entries`);
        await fetchEntries(selectedDataset.id);
      }
    } catch (error) {
      console.error('Error generating synthetic entries:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const exportDataset = async () => {
    if (!selectedDataset) return;
    window.open(`/api/golden/datasets/export?id=${selectedDataset.id}&format=json`, '_blank');
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;

    try {
      const response = await fetch(`/api/golden/entries?id=${entryId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setEntries(entries.filter(e => e.id !== entryId));
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      functional: 'default',
      edge_case: 'secondary',
      adversarial: 'destructive',
      safety: 'destructive',
      performance: 'outline'
    };
    return colors[category] || 'default';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'outline',
      medium: 'secondary',
      hard: 'default',
      expert: 'destructive'
    };
    return colors[difficulty] || 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Golden Dataset Collection
          </span>
          <div className="flex gap-2">
            {selectedDataset && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCollector(!showCollector)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={collectFromProduction}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  From Production
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateSynthetic}
                  disabled={refreshing}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Synthetic
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportDataset}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={createDataset}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Dataset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Dataset selector */}
        {datasets.length > 0 && (
          <div className="mb-6">
            <Tabs 
              value={selectedDataset?.id || ''} 
              onValueChange={(value) => {
                const dataset = datasets.find(d => d.id === value);
                if (dataset) setSelectedDataset(dataset);
              }}
            >
              <TabsList>
                {datasets.map(dataset => (
                  <TabsTrigger key={dataset.id} value={dataset.id}>
                    {dataset.name}
                    <Badge variant="secondary" className="ml-2">
                      {dataset.statistics?.totalEntries || 0}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Entry collector */}
        {showCollector && selectedDataset && (
          <div className="mb-6">
            <EntryCollector
              datasetId={selectedDataset.id}
              onSave={() => {
                setShowCollector(false);
                fetchEntries(selectedDataset.id);
              }}
              onCancel={() => setShowCollector(false)}
            />
          </div>
        )}

        {/* Main content - Simple entries view */}
        {selectedDataset ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{entries.length}</div>
                  <p className="text-xs text-muted-foreground">Total Entries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {entries.filter(e => e.validation?.isValid).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Validated</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {entries.filter(e => e.metadata?.source === 'production').length}
                  </div>
                  <p className="text-xs text-muted-foreground">From Production</p>
                </CardContent>
              </Card>
            </div>

            {/* Entries List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Dataset Entries</h3>
              {entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getCategoryColor(entry.category) as any}>
                            {entry.category}
                          </Badge>
                          {entry.metadata?.difficulty && (
                            <Badge variant={getDifficultyColor(entry.metadata.difficulty) as any}>
                              {entry.metadata.difficulty}
                            </Badge>
                          )}
                          {entry.metadata?.isEdgeCase && (
                            <Badge variant="outline">Edge Case</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {(entry.input?.prompt || entry.inputSpec?.prompt) ? (
                            <>
                              {(entry.input?.prompt || entry.inputSpec?.prompt).substring(0, 200)}
                              {(entry.input?.prompt || entry.inputSpec?.prompt).length > 200 && '...'}
                            </>
                          ) : (
                            <span className="text-muted-foreground">No input provided</span>
                          )}
                        </p>
                        {entry.expectedOutputs?.[0]?.content && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Expected: {entry.expectedOutputs[0].content.substring(0, 150)}
                            {entry.expectedOutputs[0].content.length > 150 && '...'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            alert(`Entry Details:\n\nCategory: ${entry.category}\nInput: ${JSON.stringify(entry.input || entry.inputSpec, null, 2)}\nExpected Output: ${JSON.stringify(entry.expectedOutputs, null, 2)}\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}`);
                          }}
                          title="View entry details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            alert('Edit functionality coming soon!\n\nFor now, please delete and recreate the entry.');
                          }}
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteEntry(entry.id)}
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {entries.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No entries yet. Add entries manually or collect from production data.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {loading ? 'Loading datasets...' : 'Create a dataset to start collecting golden data'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GoldenDatasetDashboard;