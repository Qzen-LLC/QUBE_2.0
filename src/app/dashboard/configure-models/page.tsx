'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Edit3, Plus, Building2, ChevronLeft } from 'lucide-react'
import { useUserData } from '@/contexts/UserContext'

type Organization = { id: string; name: string }
type AiModel = { id: string; organizationId: string; modelName: string; apiKey: string; providerName: string }

// Predefined model options organized by provider
const MODEL_OPTIONS = [
  { provider: 'OPENAI', model: 'gpt-4-turbo-preview' },
  { provider: 'OPENAI', model: 'gpt-4' },
  { provider: 'OPENAI', model: 'gpt-4-32k' },
  { provider: 'OPENAI', model: 'gpt-3.5-turbo' },
  { provider: 'OPENAI', model: 'gpt-3.5-turbo-16k' },
  { provider: 'ANTHROPIC', model: 'claude-3-opus-20240229' },
  { provider: 'ANTHROPIC', model: 'claude-3-sonnet-20240229' },
  { provider: 'ANTHROPIC', model: 'claude-3-haiku-20240307' },
  { provider: 'ANTHROPIC', model: 'claude-2.1' },
]

// Get unique providers
const PROVIDERS = Array.from(new Set(MODEL_OPTIONS.map(opt => opt.provider)))

// Get models for a specific provider
const getModelsForProvider = (provider: string) => {
  return MODEL_OPTIONS.filter(opt => opt.provider === provider)
}

export default function ConfigureModelsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialOrgId = searchParams.get('orgId') || ''

  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>(initialOrgId)
  const [models, setModels] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const { userData } = useUserData()

  // Only load all organizations for QZEN_ADMIN
  useEffect(() => {
    if (userData?.role === 'QZEN_ADMIN') {
      const loadOrgs = async () => {
        try {
          const res = await fetch('/api/admin/organizations')
          const data = await res.json()
          if (res.ok) setOrganizations(data.organizations || [])
        } catch {}
      }
      loadOrgs()
    } else if (userData?.organization) {
      // For ORG_ADMIN, use their organization from userData
      setOrganizations([{
        id: userData.organization.id,
        name: userData.organization.name
      }])
    }
  }, [userData])

  // For ORG_ADMINs, default to their organization automatically when not provided via URL
  useEffect(() => {
    if (!selectedOrgId && userData?.organizationId) {
      setSelectedOrgId(userData.organizationId)
    }
  }, [selectedOrgId, userData?.organizationId])

  useEffect(() => {
    if (!selectedOrgId) return
    const loadModels = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/models?organizationId=${encodeURIComponent(selectedOrgId)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load models')
        setModels(data.models || [])
      } catch (e: any) {
        setError(e.message || 'Failed to load models')
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [selectedOrgId])

  const selectedOrg = useMemo(() => {
    // If we have userData with organization, prefer that for ORG_ADMIN
    if (userData?.organization && userData.organization.id === selectedOrgId) {
      return {
        id: userData.organization.id,
        name: userData.organization.name
      }
    }
    return organizations.find(o => o.id === selectedOrgId)
  }, [organizations, selectedOrgId, userData])

  const resetForm = () => {
    setEditingId(null)
    setSelectedProvider('')
    setSelectedModel('')
    setApiKey('')
  }

  const openCreate = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (model: AiModel) => {
    setEditingId(model.id)
    setSelectedProvider(model.providerName)
    setSelectedModel(model.modelName)
    setApiKey(model.apiKey)
    setFormOpen(true)
  }

  const submitForm = async () => {
    if (!selectedOrgId || !selectedProvider || !selectedModel || !apiKey.trim()) return
    
    try {
      const res = await fetch(editingId ? `/api/models/${editingId}` : '/api/models', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingId
            ? { providerName: selectedProvider, modelName: selectedModel, apiKey: apiKey.trim() }
            : { organizationId: selectedOrgId, providerName: selectedProvider, modelName: selectedModel, apiKey: apiKey.trim() }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save model')
      // Refresh list
      const listRes = await fetch(`/api/models?organizationId=${encodeURIComponent(selectedOrgId)}`)
      const listData = await listRes.json()
      setModels(listData.models || [])
      setFormOpen(false)
      resetForm()
    } catch (e: any) {
      alert(e.message || 'Error saving model')
    }
  }

  // When provider changes, reset model selection
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    setSelectedModel('')
  }

  // Get available models for selected provider
  const availableModels = useMemo(() => {
    return selectedProvider ? getModelsForProvider(selectedProvider) : []
  }, [selectedProvider])

  const deleteModel = async (id: string) => {
    if (!confirm('Delete this AI Model?')) return
    try {
      const res = await fetch(`/api/models/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete model')
      setModels(prev => prev.filter(m => m.id !== id))
    } catch (e: any) {
      alert(e.message || 'Error deleting model')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card className="border border-border">
          <div className="p-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="flex-shrink-0 mt-1 hover:bg-muted"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground leading-tight">Configure AI Models</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage organization-specific model names and API keys</p>
                {selectedOrgId && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Organization: {selectedOrg?.name || selectedOrgId}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-end gap-3">
              <Button onClick={openCreate} disabled={!selectedOrgId} className="whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> New Model
              </Button>
            </div>
          </div>
        </Card>

        <Card className="border border-border">
          <div className="p-6">
            {!selectedOrgId ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                <span>No organization selected. If you are a QZEN_ADMIN, navigate here via Admin → Configure Models for an organization. ORG_ADMINs will automatically manage their own organization.</span>
              </div>
            ) : loading ? (
              <div className="text-muted-foreground">Loading models…</div>
            ) : error ? (
              <div className="text-destructive">{error}</div>
            ) : models.length === 0 ? (
              <div className="text-muted-foreground">No models found for {selectedOrg?.name || selectedOrgId}.</div>
            ) : (
              <div className="space-y-3">
                {models.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="min-w-0">
                      {/* <div className="text-xs text-muted-foreground truncate">{m.providerName}</div>   */}
                      <div className="text-sm font-medium text-foreground truncate">{m.providerName} - {m.modelName}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.apiKey}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)}>
                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => deleteModel(m.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="w-full max-w-md border border-border">
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{editingId ? 'Edit Model' : 'New Model'}</h2>
                  <p className="text-xs text-muted-foreground mt-1">For {selectedOrg?.name}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="providerSelect" className="text-sm">Provider</Label>
                    <Select value={selectedProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger id="providerSelect">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="modelSelect" className="text-sm">Model</Label>
                    <Select 
                      value={selectedModel} 
                      onValueChange={setSelectedModel}
                      disabled={!selectedProvider}
                    >
                      <SelectTrigger id="modelSelect">
                        <SelectValue placeholder={selectedProvider ? "Select a model" : "Select a provider first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((option) => (
                          <SelectItem key={option.model} value={option.model}>
                            {option.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="apiKey" className="text-sm">API Key</Label>
                    <Input id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter provider API key" />
                  </div>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={submitForm} disabled={!selectedProvider || !selectedModel || !apiKey.trim()}>{editingId ? 'Save' : 'Create'}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}