import { prismaClient } from "@/utils/db";
import { withAuth } from '@/lib/auth-gateway';



export const GET = withAuth(async (req: Request, { auth }) => {
    try {
        // auth context is provided by withAuth wrapper
        
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId: auth.userId! },
        });
        
        if (!userRecord) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ success: false, error: "ID is required" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }



        // Check permissions based on role
        if (userRecord.role !== 'QZEN_ADMIN') {
            const useCase = await prismaClient.useCase.findUnique({
                where: { id },
            });
            
            if (!useCase) {
                return new Response(JSON.stringify({ error: 'Use case not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
            }
            
            if (userRecord.role === 'USER') {
                // USER can only access their own use cases
                if (useCase.userId !== userRecord.id) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
                // ORG_ADMIN and ORG_USER can only access use cases in their organization
                if (useCase.organizationId !== userRecord.organizationId) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            }
        }

        const useCase = await prismaClient.useCase.findUnique({
            where: { id },
            select: {
                id: true,
                aiucId: true,
                title: true,
                problemStatement: true,
                proposedAISolution: true,
                keyBenefits: true,
                primaryStakeholders: true,
                secondaryStakeholders: true,
                successCriteria: true,
                problemValidation: true,
                solutionHypothesis: true,
                keyAssumptions: true,
                initialCost: true,
                initialROI: true,
                confidenceLevel: true,
                operationalImpactScore: true,
                productivityImpactScore: true,
                revenueImpactScore: true,
                implementationComplexity: true,
                estimatedTimeline: true,
                plannedStartDate: true,
                estimatedTimelineMonths: true,
                requiredResources: true,
                priority: true,
                stage: true,
                businessFunction: true,
                userId: true,
                legalApprover: true,
                riskApprover: true,
                governanceApprover: true,
                businessOwner: true,
                requirementsReviewStatus: true,
                technicalReviewStatus: true,
                businessReviewStatus: true,
                responsibleEthicalReviewStatus: true,
                legalRegulatoryReviewStatus: true,
                dataReadinessReviewStatus: true,
                finopsReviewStatus: true,
                aiType: true,
                executiveSponsor: true,
                regulatoryFrameworks: true,
                industryStandards: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!useCase) {
            return new Response(JSON.stringify({ success: false, error: "Use case not found" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }



        // Add cache header
        return new Response(JSON.stringify(useCase), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error('Error fetching use case:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}, { requireUser: true });