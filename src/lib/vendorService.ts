// Client-side vendor service that calls API routes
export interface Vendor {
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

export const vendorService = {
  // Get all vendors
  async getVendors() {
    try {
      const response = await fetch('/api/vendors', {
        cache: 'no-store',
      });
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to fetch vendors' };
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      return { data: null, error: error.message };
    }
  },

  // Create a new vendor
  async createVendor(vendorData: Partial<Vendor>) {
    try {
      console.log('[VendorService] Creating vendor:', {
        vendorData: {
          name: vendorData.name,
          website: vendorData.website,
          category: vendorData.category,
          contactPerson: vendorData.contactPerson,
          contactEmail: vendorData.contactEmail
        }
      });
      
      console.log('[VendorService] Full vendor data being sent:', vendorData);
      
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to create vendor' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      return { data: null, error: error.message };
    }
  },

  // Update an existing vendor
  async updateVendor(vendorId: string, vendorData: Partial<Vendor>) {
    try {
      console.log('[VendorService] Updating vendor:', {
        vendorId,
        vendorData: {
          name: vendorData.name,
          website: vendorData.website,
          category: vendorData.category,
          contactPerson: vendorData.contactPerson,
          contactEmail: vendorData.contactEmail
        }
      });
      
      console.log('[VendorService] Full vendor data being sent:', vendorData);
      
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to update vendor' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      return { data: null, error: error.message };
    }
  },

  // Delete a vendor
  async deleteVendor(vendorId: string) {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { error: error.error || 'Failed to delete vendor' };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      return { error: error.message };
    }
  },

  // Update assessment scores
  async updateAssessmentScore(vendorId: string, category: string, subcategory: string, score: number, comment: string) {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subcategory, score, comment })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to update assessment score' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating assessment score:', error);
      return { data: null, error: error.message };
    }
  },

  // Calculate and update overall score for a vendor
  async calculateOverallScore(vendorId: string) {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/calculate-score`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to calculate overall score' };
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error calculating overall score:', error);
      return { data: null, error: error.message };
    }
  },

  // Initialize approval areas for a vendor (called automatically on vendor creation)
  async initializeApprovalAreas(_vendorId: string) {
    // This is handled automatically by the API when creating a vendor
    return { error: null };
  },


  // Get dashboard statistics
  async getDashboardStats() {
    try {
      const response = await fetch('/api/vendor-dashboard');
      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: error.error || 'Failed to fetch dashboard stats' };
      }
      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error getting dashboard stats:', error);
      return { data: null, error: error.message };
    }
  }
};