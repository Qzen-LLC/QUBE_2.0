// Server-side vendor service that uses Prisma
import { prismaClient as prisma } from '@/utils/db';

export interface VendorData {
  id: string;
  name: string;
  category: string;
  website: string;
  contactPerson: string;
  contactEmail: string;
  assessmentDate: string;
  overallScore: number;
  status: 'In Assessment' | 'Approved' | 'Rejected' | 'On Hold';
  notes: string;
  scores: { [key: string]: number };
  comments: { [key: string]: string };
  approvals: {
    [key in 'Procurement' | 'Legal' | 'Governance' | 'Compliance']: {
      status: 'Pending' | 'Approved' | 'Rejected';
      approvedBy: string | null;
      approvedDate: string | null;
      comments: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

// Map database enums to frontend strings
const statusMap = {
  'IN_ASSESSMENT': 'In Assessment',
  'APPROVED': 'Approved', 
  'REJECTED': 'Rejected',
  'ON_HOLD': 'On Hold'
} as const;

const reverseStatusMap = {
  'In Assessment': 'IN_ASSESSMENT',
  'Approved': 'APPROVED',
  'Rejected': 'REJECTED', 
  'On Hold': 'ON_HOLD'
} as const;

const approvalAreaMap = {
  'PROCUREMENT': 'Procurement',
  'LEGAL': 'Legal',
  'GOVERNANCE': 'Governance',
  'COMPLIANCE': 'Compliance'
} as const;

const reverseApprovalAreaMap = {
  'Procurement': 'PROCUREMENT',
  'Legal': 'LEGAL',
  'Governance': 'GOVERNANCE',
  'Compliance': 'COMPLIANCE'
} as const;

type ApprovalAreaObj = {
  area: string;
  status: string;
  approvedBy: string | null;
  approvedDate: Date | null;
  comments: string | null;
};



export const vendorServiceServer = {
  // Get all vendors
  async getVendors(filter?: { role?: string; organizationId?: string; userId?: string }) {
    try {
      const where: any = {};
      if (filter) {
        if (filter.role === 'QZEN_ADMIN') {
          // No filter, return all vendors
        } else if ((filter.role === 'ORG_ADMIN' || filter.role === 'ORG_USER') && filter.organizationId) {
          where.organizationId = filter.organizationId;
        } else if (filter.role === 'USER' && filter.userId) {
          where.userId = filter.userId;
        }
      }
      const vendors = await prisma.vendor.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          website: true,
          contactPerson: true,
          contactEmail: true,
          assessmentDate: true,
          overallScore: true,
          status: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          assessmentScores: {
            select: {
              category: true,
              subcategory: true,
              score: true,
              comment: true
            }
          },
          approvalAreas: {
            select: {
              area: true,
              status: true,
              approvedBy: true,
              approvedDate: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Debug: Log raw vendor data from database
      console.log('[CRUD_LOG] Raw vendors from database:', vendors.length, 'vendors');
      if (vendors.length > 0) {
        console.log('[CRUD_LOG] First vendor raw data:', vendors[0]);
        console.log('[CRUD_LOG] First vendor website:', vendors[0].website);
        console.log('[CRUD_LOG] First vendor approval areas:', vendors[0].approvalAreas);
      }

      // Transform the data to match the frontend format
      const transformedData: VendorData[] = vendors.map((vendor: any) => {
        const scores = vendor.assessmentScores.reduce((acc: Record<string, number>, score: {
          category: string;
          subcategory: string;
          score: number;
          comment: string | null;
        }) => {
          const key = `${score.category}-${score.subcategory}`;
          acc[key] = score.score;
          return acc;
        }, {});

        const comments = vendor.assessmentScores.reduce((acc: Record<string, string>, score: {
          category: string;
          subcategory: string;
          score: number;
          comment: string | null;
        }) => {
          const key = `${score.category}-${score.subcategory}`;
          acc[key] = score.comment || '';
          return acc;
        }, {});

        const approvals: Record<string, any> = {};
        const approvalAreas = vendor.approvalAreas as ApprovalAreaObj[];
        
        for (let i = 0; i < approvalAreas.length; i++) {
          const approval: ApprovalAreaObj = approvalAreas[i];
          const areaKey = approvalAreaMap[approval.area as keyof typeof approvalAreaMap];
          approvals[areaKey] = {
            status: approval.status === 'PENDING' ? 'Pending' : approval.status === 'APPROVED' ? 'Approved' : approval.status === 'REJECTED' ? 'Rejected' : approval.status,
            approvedBy: approval.approvedBy,
            approvedDate: approval.approvedDate?.toISOString() || null,
            comments: approval.comments || ''
          };
        }

        // Ensure all approval areas exist
        const defaultApprovals = {
          'Procurement': { status: 'Pending' as const, approvedBy: null, approvedDate: null, comments: '' },
          'Legal': { status: 'Pending' as const, approvedBy: null, approvedDate: null, comments: '' },
          'Governance': { status: 'Pending' as const, approvedBy: null, approvedDate: null, comments: '' },
          'Compliance': { status: 'Pending' as const, approvedBy: null, approvedDate: null, comments: '' }
        };

        const finalApprovals = { ...defaultApprovals, ...approvals };
        
        // Debug: Log approval data transformation
        console.log(`[CRUD_LOG] Vendor ${vendor.id} approval transformation:`, {
          rawApprovalAreas: vendor.approvalAreas,
          processedApprovals: approvals,
          finalApprovals
        });

        // Debug: Log website field transformation
        console.log(`[CRUD_LOG] Vendor ${vendor.id} website transformation:`, {
          rawWebsite: vendor.website,
          transformedWebsite: vendor.website || ''
        });

        return {
          id: vendor.id,
          name: vendor.name || '',
          category: vendor.category || '',
          website: vendor.website || '',
          contactPerson: vendor.contactPerson || '',
          contactEmail: vendor.contactEmail || '',
          assessmentDate: vendor.assessmentDate?.toISOString().split('T')[0] || '',
          overallScore: vendor.overallScore || 0,
          status: statusMap[vendor.status as keyof typeof statusMap] || 'In Assessment',
          notes: vendor.notes || '',
          scores,
          comments,
          approvals: finalApprovals as any,
          createdAt: vendor.createdAt?.toISOString() || new Date().toISOString(),
          updatedAt: vendor.updatedAt?.toISOString() || new Date().toISOString()
        };
      });

      return { data: transformedData, error: null };
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      return { data: null, error: error.message };
    }
  },

  // Create a new vendor
  async createVendor(vendorData: Partial<VendorData> & { userId?: string; organizationId?: string }) {
    try {
      console.log('[CRUD_LOG] Creating vendor with data:', {
        name: vendorData.name,
        website: vendorData.website,
        category: vendorData.category,
        userId: vendorData.userId,
        organizationId: vendorData.organizationId
      });
      
      // Create the vendor first
      const createData = {
        name: vendorData.name!,
        category: vendorData.category!,
        website: vendorData.website || null,
        contactPerson: vendorData.contactPerson || null,
        contactEmail: vendorData.contactEmail || null,
        assessmentDate: vendorData.assessmentDate ? new Date(vendorData.assessmentDate) : null,
        overallScore: vendorData.overallScore || 0,
        status: vendorData.status ? reverseStatusMap[vendorData.status as keyof typeof reverseStatusMap] : 'IN_ASSESSMENT',
        notes: vendorData.notes || null,
        userId: vendorData.userId || null,
        organizationId: vendorData.organizationId || null
      };
      
      console.log('[CRUD_LOG] Prisma create data:', createData);
      
      const vendor = await prisma.vendor.create({
        data: createData
      });
      
      console.log('[CRUD_LOG] Vendor created:', { 
        id: vendor.id, 
        name: vendor.name, 
        category: vendor.category, 
        website: vendor.website,
        status: vendor.status 
      });
      
      // Initialize approval areas for the new vendor in a separate operation
      try {
        const approvalAreas = ['PROCUREMENT', 'LEGAL', 'GOVERNANCE', 'COMPLIANCE'] as const;
        
        const createPromises = approvalAreas.map(area => 
          prisma.approvalArea.create({
            data: {
              vendorId: vendor.id,
              area,
              status: 'PENDING'
            }
          })
        );

        await Promise.all(createPromises);
        console.log('[CRUD_LOG] Vendor approval areas initialized:', { vendorId: vendor.id, areas: approvalAreas });
      } catch (approvalError) {
        console.warn('[CRUD_LOG] Failed to initialize approval areas, but vendor was created:', approvalError);
        // Don't fail the entire operation if approval areas fail
      }
      
      return { data: vendor, error: null };
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      return { data: null, error: error.message };
    }
  },

  // Update an existing vendor
  async updateVendor(vendorId: string, vendorData: Partial<VendorData>) {
    try {
      console.log('[CRUD_LOG] Updating vendor with data:', {
        vendorId,
        name: vendorData.name,
        website: vendorData.website,
        category: vendorData.category
      });
      
      // Update the vendor - only include fields that are provided
      const updateData: any = {};
      
      // Only include fields that are provided
      if (vendorData.name !== undefined) updateData.name = vendorData.name;
      if (vendorData.category !== undefined) updateData.category = vendorData.category;
      if (vendorData.website !== undefined) updateData.website = vendorData.website || null;
      if (vendorData.contactPerson !== undefined) updateData.contactPerson = vendorData.contactPerson || null;
      if (vendorData.contactEmail !== undefined) updateData.contactEmail = vendorData.contactEmail || null;
      if (vendorData.assessmentDate !== undefined) updateData.assessmentDate = vendorData.assessmentDate ? new Date(vendorData.assessmentDate) : null;
      if (vendorData.overallScore !== undefined) updateData.overallScore = vendorData.overallScore;
      if (vendorData.status !== undefined) updateData.status = vendorData.status ? reverseStatusMap[vendorData.status as keyof typeof reverseStatusMap] : undefined;
      if (vendorData.notes !== undefined) updateData.notes = vendorData.notes || null;
      
      console.log('[CRUD_LOG] Prisma update data:', updateData);
      
      const vendor = await prisma.vendor.update({
        where: { id: vendorId },
        data: updateData
      });

      console.log('[CRUD_LOG] Vendor updated:', { 
        id: vendor.id, 
        name: vendor.name, 
        category: vendor.category, 
        website: vendor.website,
        status: vendor.status 
      });

      // Update approval areas if provided
      if (vendorData.approvals) {
        try {
          const approvalUpdates = Object.entries(vendorData.approvals).map(([area, approvalData]) => {
            const dbArea = reverseApprovalAreaMap[area as keyof typeof reverseApprovalAreaMap];
            const dbStatus = approvalData.status === 'Pending' ? 'PENDING' : 
                            approvalData.status === 'Approved' ? 'APPROVED' : 'REJECTED';

            return prisma.approvalArea.upsert({
              where: {
                vendorId_area: {
                  vendorId,
                  area: dbArea
                }
              },
              update: {
                status: dbStatus,
                approvedBy: approvalData.approvedBy || null,
                approvedDate: approvalData.approvedDate ? new Date(approvalData.approvedDate) : null,
                comments: approvalData.comments || null
              },
              create: {
                vendorId,
                area: dbArea,
                status: dbStatus,
                approvedBy: approvalData.approvedBy || null,
                approvedDate: approvalData.approvedDate ? new Date(approvalData.approvedDate) : null,
                comments: approvalData.comments || null
              }
            });
          });

          await Promise.all(approvalUpdates);
          console.log('[CRUD_LOG] Vendor approval areas updated:', { vendorId, areas: Object.keys(vendorData.approvals) });
        } catch (approvalError) {
          console.warn('[CRUD_LOG] Failed to update approval areas, but vendor was updated:', approvalError);
          // Don't fail the entire operation if approval areas fail
        }
      }

      console.log('[CRUD_LOG] Vendor updated:', { id: vendorId, name: vendor.name, category: vendor.category, status: vendor.status, updatedAt: vendor.updatedAt });

      return { data: vendor, error: null };
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      return { data: null, error: error.message };
    }
  },

  // Delete a vendor
  async deleteVendor(vendorId: string) {
    try {
      await prisma.vendor.delete({
        where: { id: vendorId }
      });
      console.log('[CRUD_LOG] Vendor deleted:', { id: vendorId });

      return { error: null };
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      return { error: error.message };
    }
  },

  // Update assessment scores
  async updateAssessmentScore(vendorId: string, category: string, subcategory: string, score: number, comment: string) {
    try {
      await prisma.assessmentScore.upsert({
        where: {
          vendorId_category_subcategory: {
            vendorId,
            category,
            subcategory
          }
        },
        update: {
          score,
          comment: comment || null
        },
        create: {
          vendorId,
          category,
          subcategory,
          score,
          comment: comment || null
        }
      });
      console.log('[CRUD_LOG] Vendor assessment score upserted:', { vendorId, category, subcategory, score });

      return { data: true, error: null };
    } catch (error: any) {
      console.error('Error updating assessment score:', error);
      return { data: null, error: error.message };
    }
  },

  // Calculate and update overall score for a vendor
  async calculateOverallScore(vendorId: string) {
    try {
      const scores = await prisma.assessmentScore.findMany({
        where: { 
          vendorId,
          score: { gt: 0 }
        },
        select: {
          score: true
        }
      });

      if (scores.length === 0) {
        return { data: 0, error: null };
      }

      // Calculate average
      const total = scores.reduce((sum: number, item: { score: number }) => sum + item.score, 0);
      const average = Math.round((total / scores.length) * 10) / 10;

      // Update vendor with new overall score
      await prisma.vendor.update({
        where: { id: vendorId },
        data: { overallScore: average }
      });
      console.log('[CRUD_LOG] Vendor overall score updated:', { id: vendorId, overallScore: average });

      return { data: average, error: null };
    } catch (error: any) {
      console.error('Error calculating overall score:', error);
      return { data: null, error: error.message };
    }
  },

  // Initialize approval areas for a vendor
  async initializeApprovalAreas(vendorId: string) {
    try {
      const approvalAreas = ['PROCUREMENT', 'LEGAL', 'GOVERNANCE', 'COMPLIANCE'] as const;
      
      const createPromises = approvalAreas.map(area => 
        prisma.approvalArea.upsert({
          where: {
            vendorId_area: {
              vendorId,
              area
            }
          },
          update: {},
          create: {
            vendorId,
            area,
            status: 'PENDING'
          }
        })
      );

      await Promise.all(createPromises);
      console.log('[CRUD_LOG] Vendor approval areas initialized:', { vendorId, areas: approvalAreas });

      return { error: null };
    } catch (error: any) {
      console.error('Error initializing approval areas:', error);
      return { error: error.message };
    }
  },

  // Initialize approval areas for all vendors that don't have them
  async initializeAllMissingApprovalAreas() {
    try {
      console.log('[CRUD_LOG] Starting to initialize missing approval areas for all vendors');
      
      // Get all vendors
      const vendors = await prisma.vendor.findMany({
        select: { id: true, name: true }
      });
      
      console.log(`[CRUD_LOG] Found ${vendors.length} vendors to check`);
      
      for (const vendor of vendors) {
        // Check if vendor has all required approval areas
        const existingAreas = await prisma.approvalArea.findMany({
          where: { vendorId: vendor.id },
          select: { area: true }
        });
        
        const existingAreaNames = existingAreas.map(area => area.area);
        const requiredAreas = ['PROCUREMENT', 'LEGAL', 'GOVERNANCE', 'COMPLIANCE'];
        const missingAreas = requiredAreas.filter(area => !existingAreaNames.includes(area));
        
        if (missingAreas.length > 0) {
          console.log(`[CRUD_LOG] Vendor ${vendor.id} (${vendor.name}) missing approval areas:`, missingAreas);
          
          // Create missing approval areas
          const createPromises = missingAreas.map(area => 
            prisma.approvalArea.create({
              data: {
                vendorId: vendor.id,
                area,
                status: 'PENDING'
              }
            })
          );
          
          await Promise.all(createPromises);
          console.log(`[CRUD_LOG] Created missing approval areas for vendor ${vendor.id}`);
        } else {
          console.log(`[CRUD_LOG] Vendor ${vendor.id} (${vendor.name}) already has all approval areas`);
        }
      }
      
      console.log('[CRUD_LOG] Finished initializing missing approval areas');
      return { error: null };
    } catch (error: any) {
      console.error('Error initializing missing approval areas:', error);
      return { error: error.message };
    }
  },


  // Check if all approval areas are approved and update vendor status
  async checkAndUpdateVendorStatus(vendorId: string) {
    try {
      const approvals = await prisma.approvalArea.findMany({
        where: { vendorId }
      });

      const allApproved = approvals.length === 4 && approvals.every((approval: any) => approval.status === 'APPROVED');
      const anyRejected = approvals.some((approval: any) => approval.status === 'REJECTED');

      let newStatus: 'IN_ASSESSMENT' | 'APPROVED' | 'REJECTED' = 'IN_ASSESSMENT';
      if (allApproved) {
        newStatus = 'APPROVED';
      } else if (anyRejected) {
        newStatus = 'REJECTED';
      }

      await prisma.vendor.update({
        where: { id: vendorId },
        data: { status: newStatus }
      });
      console.log('[CRUD_LOG] Vendor status updated:', { id: vendorId, status: newStatus });

      return { error: null };
    } catch (error: any) {
      console.error('Error checking vendor status:', error);
      return { error: error.message };
    }
  },

  // Get dashboard statistics
  async getDashboardStats(userRole?: string, userId?: string, organizationId?: string) {
    try {
      let vendors;
      if (userRole === 'QZEN_ADMIN') {
        vendors = await prisma.vendor.findMany({
          select: {
            category: true,
            status: true,
            overallScore: true
          }
        });
      } else if (organizationId) {
        vendors = await prisma.vendor.findMany({
          where: { organizationId },
          select: {
            category: true,
            status: true,
            overallScore: true
          }
        });
      } else if (userId) {
        vendors = await prisma.vendor.findMany({
          where: { userId },
          select: {
            category: true,
            status: true,
            overallScore: true
          }
        });
      } else {
        vendors = await prisma.vendor.findMany({
          select: {
            category: true,
            status: true,
            overallScore: true
          }
        });
      }

      const categories = [
        'LLM/Foundation Models',
        'LLM Orchestration',
        'Agentic Frameworks',
        'Conversational AI',
        'Document Intelligence',
        'Code Generation',
        'Content Generation',
        'Analytics & Insights',
        'MLOps Platform',
        'Speech & Audio AI',
        'Robotic Process Automation',
        'Edge AI & IoT',
        'AI Hardware & Infrastructure',
        'Data Labeling & Annotation',
        'AI Testing & Validation',
        'AI Governance & Risk',
        'Other'
      ];

      const categoryData = categories.map(category => {
        const categoryVendors = vendors.filter((v: any) => v.category === category);
        return {
          category,
          total: categoryVendors.length,
          approved: categoryVendors.filter((v: any) => v.status === 'APPROVED').length,
          inAssessment: categoryVendors.filter((v: any) => v.status === 'IN_ASSESSMENT').length,
          rejected: categoryVendors.filter((v: any) => v.status === 'REJECTED').length,
          onHold: categoryVendors.filter((v: any) => v.status === 'ON_HOLD').length,
          avgScore: categoryVendors.length > 0 ? 
            Math.round((categoryVendors.reduce((sum: number, v: any) => sum + (v.overallScore || 0), 0) / categoryVendors.length) * 10) / 10 : 0
        };
      });

      const overallStats = {
        totalVendors: vendors.length,
        approved: vendors.filter((v: any) => v.status === 'APPROVED').length,
        inAssessment: vendors.filter((v: any) => v.status === 'IN_ASSESSMENT').length,
        rejected: vendors.filter((v: any) => v.status === 'REJECTED').length,
        onHold: vendors.filter((v: any) => v.status === 'ON_HOLD').length,
        avgScore: vendors.length > 0 ? 
          Math.round((vendors.reduce((sum: number, v: any) => sum + (v.overallScore || 0), 0) / vendors.length) * 10) / 10 : 0,
        highPerformers: vendors.filter((v: any) => v.overallScore >= 4).length,
        needsAttention: vendors.filter((v: any) => v.overallScore > 0 && v.overallScore < 3).length
      };

      return { data: { categoryData, overallStats }, error: null };
    } catch (error: any) {
      console.error('Error getting dashboard stats:', error);
      return { data: null, error: error.message };
    }
  }
};