'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Shield,
  Edit2,
  Check,
  X,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Save,
  RotateCcw,
  Star,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuardrailRule {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  description: string;
  rationale?: string;
  implementation: any;
  conditions?: any;
  exceptions?: any;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EDITED';
  isCustom?: boolean;
  isEdited?: boolean;
  originalValue?: any;
  editedBy?: string;
  editedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface EditableGuardrailCardProps {
  rule: GuardrailRule;
  editMode?: boolean;
  onEdit: (rule: GuardrailRule) => void;
  onApprove: (ruleId: string) => void;
  onReject: (ruleId: string, reason: string) => void;
  onDelete?: (ruleId: string) => void;
  onComment?: (ruleId: string, comment: string) => void;
  canEdit?: boolean;
  canApprove?: boolean;
  currentUser?: string;
}

export default function EditableGuardrailCard({
  rule,
  editMode = false,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  onComment,
  canEdit = true,
  canApprove = true,
  currentUser = 'User'
}: EditableGuardrailCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRule, setEditedRule] = useState<GuardrailRule>(rule);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedRule(rule);
  }, [rule]);

  useEffect(() => {
    const hasModifications = JSON.stringify(editedRule) !== JSON.stringify(rule);
    setHasChanges(hasModifications);
  }, [editedRule, rule]);

  const handleSave = () => {
    onEdit(editedRule);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRule(rule);
    setIsEditing(false);
  };

  const handleApprove = () => {
    console.log('Approve button clicked for rule:', rule.id);
    onApprove(rule.id);
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rule.id, rejectReason);
      setShowRejectDialog(false);
      setRejectReason('');
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this guardrail?')) {
      onDelete(rule.id);
    }
  };

  const handleAddComment = () => {
    if (comment.trim() && onComment) {
      onComment(rule.id, comment);
      setComment('');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = () => {
    if (!rule.status) return null;
    
    switch (rule.status) {
      case 'APPROVED':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'EDITED':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Edit2 className="w-3 h-3 mr-1" />
            Edited
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getTypeIcon = () => {
    switch (rule.type) {
      case 'content_safety': return <Shield className="w-5 h-5" />;
      case 'data_protection': return <Shield className="w-5 h-5" />;
      case 'performance': return <AlertTriangle className="w-5 h-5" />;
      case 'ethical': return <Info className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      isEditing && "ring-2 ring-blue-500",
      rule.status === 'REJECTED' && "opacity-75"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn("p-2 rounded-lg", getSeverityColor(rule.severity) + " bg-opacity-20")}>
              {getTypeIcon()}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editedRule.rule}
                  onChange={(e) => setEditedRule({ ...editedRule, rule: e.target.value })}
                  className="font-semibold text-lg mb-2"
                  placeholder="Rule name"
                />
              ) : (
                <CardTitle className="text-lg flex items-center gap-2">
                  {rule.rule}
                  {rule.isCustom && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Star className="w-4 h-4 text-purple-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Custom guardrail</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {rule.isEdited && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edited by {rule.editedBy} at {rule.editedAt}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </CardTitle>
              )}
              <div className="flex items-center gap-2 mt-1">
                {isEditing ? (
                  <Select
                    value={editedRule.severity}
                    onValueChange={(value: any) => setEditedRule({ ...editedRule, severity: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={getSeverityColor(rule.severity)}>
                    {rule.severity}
                  </Badge>
                )}
                <Badge variant="outline">{rule.type}</Badge>
                {getStatusBadge()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {editMode && canEdit && !isEditing && rule.status !== 'APPROVED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Construct
              </Button>
            )}
            
            {isEditing && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges}
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
            
            {!isEditing && canApprove && (rule.status === 'PENDING' || rule.status === 'EDITED') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 hover:bg-green-50 border-green-600"
                  onClick={handleApprove}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 border-red-600"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Guardrail</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejecting this guardrail.
                      </DialogDescription>
                    </DialogHeader>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter rejection reason..."
                      className="min-h-[100px]"
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleReject} disabled={!rejectReason.trim()}>
                        Reject
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            
            {onDelete && canEdit && rule.status !== 'APPROVED' && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          {isEditing ? (
            <Textarea
              value={editedRule.description}
              onChange={(e) => setEditedRule({ ...editedRule, description: e.target.value })}
              placeholder="Description"
              className="min-h-[80px]"
            />
          ) : (
            <p className="text-muted-foreground">{rule.description}</p>
          )}
        </div>
        
        {(rule.rationale || isEditing) && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-1">Rationale:</p>
            {isEditing ? (
              <Textarea
                value={editedRule.rationale || ''}
                onChange={(e) => setEditedRule({ ...editedRule, rationale: e.target.value })}
                placeholder="Why is this guardrail necessary?"
                className="min-h-[60px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{rule.rationale}</p>
            )}
          </div>
        )}
        
        {rule.rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <p className="text-sm font-medium mb-1 text-red-600 dark:text-red-400">Rejection Reason:</p>
            <p className="text-sm">{rule.rejectionReason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Rejected by {rule.rejectedBy} at {rule.rejectedAt}
            </p>
          </div>
        )}
        
        {(onComment || rule.originalValue) && (
          <div className="flex items-center gap-2">
            {onComment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Comments
              </Button>
            )}
            
            {rule.originalValue && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View Original
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-md">
                    <pre className="text-xs">{JSON.stringify(rule.originalValue, null, 2)}</pre>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
        
        {showComments && onComment && (
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button onClick={handleAddComment} disabled={!comment.trim()}>
                Send
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}