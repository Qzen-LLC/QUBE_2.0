"use client";

import { useState, useEffect } from "react";
import { useStableRender } from "@/hooks/useStableRender";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Users,
  Building2,
  Mail,
  UserPlus,
  Trash2,
  Settings,
  BarChart3,
  Shield,
  ChevronDown,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  domain?: string;
  users: User[];
  useCases: UseCase[];
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
}

interface UseCase {
  id: string;
  title: string;
  stage: string;
  priority: string;
  organizationId: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [activeSection, setActiveSection] = useState<"organizations" | "questions" | "models">("organizations");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDomain, setNewOrgDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [inviteModalOrgId, setInviteModalOrgId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ORG_USER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [allUseCases, setAllUseCases] = useState<UseCase[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [useCasesLoading, setUseCasesLoading] = useState(true);
  const [useCasesError, setUseCasesError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  
  const { isReady } = useStableRender();

  useEffect(() => {
    if (isReady) {
      fetchOrganizations();
    }
  }, [isReady]);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (!searchParams) return;
    const invited = searchParams.get('invited');
    const email = searchParams.get('email');
    if (invited === '1') {
      setGlobalSuccess(email ? `Invitation sent to ${email}` : 'Invitation sent successfully!');
    }
  }, [searchParams]);

  useEffect(() => {
    if (isReady) {
      const fetchUseCases = async () => {
        setUseCasesLoading(true);
        try {
          const res = await fetch(`/api/read-usecases`);
          // If unauthorized, don't throw error - user is likely signing out
          if (res.status === 401) {
            setUseCasesLoading(false);
            return;
          }
          const data = await res.json();
          if (!res.ok)
            throw new Error(data.error || "Failed to fetch use cases");
          setAllUseCases(data.useCases || []);
        } catch (err: any) {
          // Only set error if it's not an auth error
          if (err.message && !err.message.includes('401')) {
            setUseCasesError(err.message || "Unknown error");
          }
        } finally {
          setUseCasesLoading(false);
        }
      };
      fetchUseCases();
    }
  }, [isReady]);

  const orgIdToName = (id: string) => {
    const org = organizations.find((o) => o.id === id);
    return org ? org.name : "Unknown Org";
  };

  const filteredUseCases = selectedOrgId
    ? allUseCases.filter((uc) => uc.organizationId === selectedOrgId)
    : allUseCases;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Initializing admin console...
          </p>
        </div>
      </div>
    );
  }

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const orgRes = await fetch("/api/admin/organizations");
      const orgData = await orgRes.json();
      if (!orgRes.ok)
        throw new Error(orgData.error || "Failed to fetch organizations");
      setOrganizations(orgData.organizations || []);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToQuestionTemplates = () => {
    router.push('/admin/configure-questions');
  };

  const handleNavigateToOrgQuestions = (orgId: string) => {
    router.push(`/dashboard/configure-questions?orgId=${orgId}`);
  };

  const handleNavigateToOrgModels = (orgId: string) => {
    router.push(`/dashboard/configure-models?orgId=${orgId}`);
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim() || !adminEmail.trim()) {
      setError("Organization name and admin email are required");
      return;
    }

    setIsCreatingOrg(true);
    setError(null);
    setOrgSuccess(null);

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName.trim(),
          domain: newOrgDomain.trim() || undefined,
          adminEmail: adminEmail.trim(),
          adminFirstName: adminFirstName.trim() || undefined,
          adminLastName: adminLastName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create organization' }));
        setError(errorData.error || `Failed to create organization (${response.status})`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNewOrgName("");
        setNewOrgDomain("");
        setAdminEmail("");
        setAdminFirstName("");
        setAdminLastName("");
        setShowCreateOrg(false);
        
        // Check if invitation was sent
        if (data.invitation?.sent) {
          setOrgSuccess(
            "Organization created successfully. Invitation email sent to admin. Redirecting to configure questions..."
          );
        } else {
          setOrgSuccess(
            `Organization created successfully. ${data.invitation?.error ? 'Warning: Invitation email failed to send. ' : ''}Redirecting to configure questions...`
          );
          if (data.invitation?.error) {
            console.warn('Invitation email failed:', data.invitation.error);
          }
        }
        
        await fetchOrganizations();
        setTimeout(() => {
          router.push(`/admin/configure-questions?orgId=${data.organization.id}`);
        }, 1500);
      } else {
        setError(data.error || "Failed to create organization");
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      setError("Failed to create organization");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole || !inviteModalOrgId) {
      setInviteError("Email and role are required");
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          organizationId: inviteModalOrgId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        const emailParam = encodeURIComponent(inviteEmail);
        setInviteModalOrgId(null);
        setInviteEmail("");
        setInviteRole("ORG_USER");
        fetchOrganizations();
        router.push(`/admin?invited=1&email=${emailParam}`);
      } else {
        setInviteError(data.error || "Failed to send invitation");
      }
    } catch (error) {
      setInviteError("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${orgName}"? This action cannot be undone and will PERMANENTLY DELETE all associated data including:\n\n- All users in this organization\n- All use cases and their data\n- All vendors and assessments\n- All invitations\n\nThis action is irreversible.`
      )
    ) {
      return;
    }

    setDeleteLoading(orgId);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/organizations?id=${orgId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchOrganizations();
      } else {
        setDeleteError(data.error || "Failed to delete organization");
      }
    } catch (error) {
      setDeleteError("Failed to delete organization");
    } finally {
      setDeleteLoading(null);
    }
  };

  const totalOrgs = organizations.length;
  const totalUsers = organizations.reduce(
    (sum, org) => sum + org.users.length,
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            Loading admin dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error && !showCreateOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-card border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <Shield className="w-4 h-4" />
                Error Loading Admin Dashboard
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-destructive">{error}</p>
              <Button
              size="sm"
              className="w-full"
                onClick={() => {
                  setError(null);
                  fetchOrganizations();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* KPI Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-card border border-border rounded-md hover:shadow-sm transition-shadow duration-150">
            <CardContent className="p-3 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Organizations
                </p>
              <p className="text-xl font-semibold text-foreground">
                  {totalOrgs}
                </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-md hover:shadow-sm transition-shadow duration-150">
            <CardContent className="p-3 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Users
                </p>
              <p className="text-xl font-semibold text-foreground">
                  {totalUsers}
                </p>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-md hover:shadow-sm transition-shadow duration-150">
            <CardContent className="p-3 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  Use Cases
                </p>
              <p className="text-xl font-semibold text-foreground">
                  {allUseCases.length}
                </p>
            </CardContent>
          </Card>
        </section>

        {/* Global Messages */}
        {orgSuccess && (
          <div className="flex items-start gap-2.5 text-xs p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <span className="text-emerald-800 dark:text-emerald-100 font-medium">
              {orgSuccess}
            </span>
          </div>
        )}
        {deleteError && (
          <div className="flex items-start gap-2.5 text-xs p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
            <span className="text-red-800 dark:text-red-100 font-medium">
              {deleteError}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-6 text-xs">
              <button
                onClick={() => setActiveSection("organizations")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeSection === "organizations"
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Organizations
              </button>
              <button
                onClick={() => setActiveSection("questions")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeSection === "questions"
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Question Management
              </button>
              <button
                onClick={() => setActiveSection("models")}
                className={`pb-2 border-b-2 transition-colors ${
                  activeSection === "models"
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Model Management
              </button>
            </div>
            <div className="h-7 mb-2">
              {activeSection === "organizations" && (
                <Button
                  size="sm"
                  onClick={() => setShowCreateOrg(true)}
                  className="text-xs h-7 px-3"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  New Organization
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Organizations Section */}
        {activeSection === "organizations" && (
          <section className="space-y-4">

            {organizations.length === 0 ? (
              <Card className="bg-card border border-border rounded-md">
                <CardContent className="py-8 text-center space-y-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      No organizations yet
                </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Create your first organization to begin onboarding users and
                      mapping AI use cases.
                </p>
                  </div>
                  <Button
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => setShowCreateOrg(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create organization
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {organizations.map((org) => (
                  <Card
                    key={org.id}
                    className="bg-card border border-border rounded-md hover:shadow-sm transition-shadow duration-150"
                  >
                  <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <CardTitle className="text-sm font-semibold truncate">
                            {org.name}
                          </CardTitle>
                        {org.domain && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono px-1.5 py-0.5"
                            >
                            {org.domain}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">
                            {org.users.length}
                          </span>
                          <span className="text-[11px]">
                            user{org.users.length !== 1 ? "s" : ""}
                          </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">
                            {org.useCases.length}
                          </span>
                          <span className="text-[11px]">
                            use case{org.useCases.length !== 1 ? "s" : ""}
                          </span>
                      </div>
                    </div>

                    {org.users.length > 0 && (
                        <div className="pt-2 border-t border-border/70">
                          <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                          Users
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {org.users.map((user) => (
                            <Badge
                              key={user.id}
                              variant="outline"
                                className="text-[10px] font-normal rounded-full px-2 py-0.5"
                            >
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email}
                                {user.role === "ORG_ADMIN" && (
                                  <span className="ml-1 text-[10px] text-primary">
                                    (Admin)
                                  </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                          className="flex-1 text-[11px] justify-center"
                        onClick={() => {
                          setInviteModalOrgId(org.id);
                          setInviteEmail("");
                          setInviteRole("ORG_USER");
                            setInviteError(null);
                            setInviteSuccess(null);
                        }}
                      >
                          <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                          Invite user
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                          className="text-[11px] text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => handleDeleteOrganization(org.id, org.name)}
                        disabled={deleteLoading === org.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </section>
        )}

        {/* Question Management */}
        {activeSection === "questions" && (
          <section>
            <Card className="bg-card border border-border rounded-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold">
                      Question Management
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure global templates and organization-specific
                      assessment questions.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs justify-start sm:justify-center"
                      onClick={handleNavigateToQuestionTemplates}
                    >
                      <Settings className="w-3.5 h-3.5 mr-1.5" />
                      Question templates
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start sm:justify-center"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Organization questions
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 text-xs p-1"
                      >
                        {organizations.length === 0 ? (
                          <DropdownMenuItem disabled className="text-[11px]">
                            No organizations available
                          </DropdownMenuItem>
                        ) : (
                          organizations.map((org) => (
                            <DropdownMenuItem
                              key={org.id}
                              className="cursor-pointer py-1.5"
                              onClick={() =>
                                handleNavigateToOrgQuestions(org.id)
                              }
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-medium">
                                  {org.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {org.users.length} user
                                  {org.users.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </section>
        )}

        {/* Model Management */}
        {activeSection === "models" && (
          <section>
            <Card className="bg-card border border-border rounded-md">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-semibold">
                      Model Management
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Configure organization-specific AI models and providers.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start sm:justify-center"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Organization models
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 text-xs p-1"
                      >
                        {organizations.length === 0 ? (
                          <DropdownMenuItem disabled className="text-[11px]">
                            No organizations available
                          </DropdownMenuItem>
                        ) : (
                          organizations.map((org) => (
                            <DropdownMenuItem
                              key={org.id}
                              className="cursor-pointer py-1.5"
                              onClick={() => handleNavigateToOrgModels(org.id)}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-medium">
                                  {org.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {org.users.length} user
                                  {org.users.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </section>
        )}

        {/* Create Organization Modal */}
        {showCreateOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <Card className="w-full max-w-lg bg-card border border-border rounded-md shadow-lg">
              <CardHeader className="pb-3 border-b border-border/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-semibold">
                        Create organization
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Set up a new tenant and administrator.
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowCreateOrg(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4 space-y-4 text-xs">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-[11px]">
                    Organization name<span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Enter organization name"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgDomain" className="text-[11px]">
                    Organization domain (optional)
                  </Label>
                  <Input
                    id="orgDomain"
                    value={newOrgDomain}
                    onChange={(e) => setNewOrgDomain(e.target.value)}
                    placeholder="example.com"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="border-t border-border/80 pt-3 space-y-3">
                  <p className="text-[11px] font-semibold text-foreground">
                    Admin user
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label
                        htmlFor="adminFirstName"
                        className="text-[11px]"
                      >
                        First name
                      </Label>
                      <Input
                        id="adminFirstName"
                        value={adminFirstName}
                        onChange={(e) => setAdminFirstName(e.target.value)}
                        placeholder="John"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminLastName" className="text-[11px]">
                        Last name
                      </Label>
                      <Input
                        id="adminLastName"
                        value={adminLastName}
                        onChange={(e) => setAdminLastName(e.target.value)}
                        placeholder="Doe"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="text-[11px]">
                      Admin email<span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setShowCreateOrg(false)}
                    disabled={isCreatingOrg}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleCreateOrganization}
                    disabled={
                      isCreatingOrg ||
                      !newOrgName.trim() ||
                      !adminEmail.trim()
                    }
                  >
                    {isCreatingOrg ? "Creating..." : "Create organization"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invite User Modal */}
        {inviteModalOrgId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <Card className="w-full max-w-md bg-card border border-border rounded-md shadow-lg">
              <CardHeader className="pb-3 border-b border-border/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-semibold">
                        Invite user
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Send an invitation to join{" "}
                        <span className="font-medium">
                          {orgIdToName(inviteModalOrgId)}
                        </span>
                        .
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setInviteModalOrgId(null);
                      setInviteEmail("");
                      setInviteRole("ORG_USER");
                      setInviteError(null);
                      setInviteSuccess(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4 space-y-3 text-xs">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail" className="text-[11px]">
                    Email address<span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteRole" className="text-[11px]">
                    Role<span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="inviteRole"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-border rounded-md bg-background"
                  >
                    <option value="ORG_USER">Organization user</option>
                    <option value="ORG_ADMIN">Organization admin</option>
                  </select>
                </div>

                {inviteError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-xs text-red-900 dark:text-red-100 font-medium">
                    {inviteError}
                  </div>
                )}

                {inviteSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-100">
                    {inviteSuccess}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setInviteModalOrgId(null);
                      setInviteEmail("");
                      setInviteRole("ORG_USER");
                      setInviteError(null);
                      setInviteSuccess(null);
                    }}
                    disabled={inviteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={handleInviteUser}
                    disabled={inviteLoading || !inviteEmail.trim()}
                  >
                    {inviteLoading ? "Sending..." : "Send invitation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Invitation Success Modal */}
        {globalSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <Card className="w-full max-w-md bg-card border border-border rounded-md shadow-lg">
              <CardHeader className="pb-3 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-md flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-semibold">
                      Invitation sent
                    </CardTitle>
                    <CardDescription className="text-xs">
                      The user has been invited successfully.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 pb-4 space-y-3 text-xs">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md">
                  <p className="text-emerald-800 dark:text-emerald-100 font-medium">
                    {globalSuccess}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setGlobalSuccess(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
