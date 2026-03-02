
import { prismaClient } from '@/utils/db';
import { NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';


export const GET = withAuth(async (req: Request, { auth }) => {
    try {
        // auth context is provided by withAuth wrapper

        // Get user data from database
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId: auth.userId! },
            include: { organization: true }
        });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }



        // Admin: return all use cases
        let useCases = [];
        if (userRecord.role === 'QZEN_ADMIN') {
            useCases = await prismaClient.useCase.findMany({
                select: {
                    id: true,
                    title: true,
                    problemStatement: true,
                    proposedAISolution: true,
                    currentState: true,
                    desiredState: true,
                    primaryStakeholders: true,
                    secondaryStakeholders: true,
                    successCriteria: true,
                    problemValidation: true,
                    solutionHypothesis: true,
                    keyAssumptions: true,
                    initialROI: true,
                    confidenceLevel: true,
                    operationalImpactScore: true,
                    productivityImpactScore: true,
                    revenueImpactScore: true,
                    implementationComplexity: true,
                    estimatedTimeline: true,
                    requiredResources: true,
                    createdAt: true,
                    updatedAt: true,
                    priority: true,
                    stage: true,
                    businessFunction: true,
                    aiucId: true,
                    estimatedTimelineMonths: true,
                    initialCost: true,
                    keyBenefits: true,
                    plannedStartDate: true,
                    organizationId: true,
                    userId: true,
                    aiType: true,
                    executiveSponsor: true,
                    requirementsReviewStatus: true,
                    technicalReviewStatus: true,
                    businessReviewStatus: true,
                    responsibleEthicalReviewStatus: true,
                    legalRegulatoryReviewStatus: true,
                    dataReadinessReviewStatus: true,
                    finopsReviewStatus: true,
                    regulatoryFrameworks: true,
                    industryStandards: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    organization: {
                        select: {
                            name: true
                        }
                    },
                },
                orderBy: { updatedAt: 'desc' }
            });
        } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
            useCases = await prismaClient.useCase.findMany({
                where: { organizationId: userRecord.organizationId },
                select: {
                    id: true,
                    title: true,
                    problemStatement: true,
                    proposedAISolution: true,
                    currentState: true,
                    desiredState: true,
                    primaryStakeholders: true,
                    secondaryStakeholders: true,
                    successCriteria: true,
                    problemValidation: true,
                    solutionHypothesis: true,
                    keyAssumptions: true,
                    initialROI: true,
                    confidenceLevel: true,
                    operationalImpactScore: true,
                    productivityImpactScore: true,
                    revenueImpactScore: true,
                    implementationComplexity: true,
                    estimatedTimeline: true,
                    requiredResources: true,
                    createdAt: true,
                    updatedAt: true,
                    priority: true,
                    stage: true,
                    businessFunction: true,
                    aiucId: true,
                    estimatedTimelineMonths: true,
                    initialCost: true,
                    keyBenefits: true,
                    plannedStartDate: true,
                    organizationId: true,
                    userId: true,
                    aiType: true,
                    executiveSponsor: true,
                    requirementsReviewStatus: true,
                    technicalReviewStatus: true,
                    businessReviewStatus: true,
                    responsibleEthicalReviewStatus: true,
                    legalRegulatoryReviewStatus: true,
                    dataReadinessReviewStatus: true,
                    finopsReviewStatus: true,
                    regulatoryFrameworks: true,
                    industryStandards: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    organization: {
                        select: {
                            name: true
                        }
                    },
                },
                orderBy: { updatedAt: 'desc' }
            });
        } else if (userRecord.role === 'USER') {
            // Only return use cases for this user
            useCases = await prismaClient.useCase.findMany({
                where: { userId: userRecord.id },
                select: {
                    id: true,
                    title: true,
                    problemStatement: true,
                    proposedAISolution: true,
                    currentState: true,
                    desiredState: true,
                    primaryStakeholders: true,
                    secondaryStakeholders: true,
                    successCriteria: true,
                    problemValidation: true,
                    solutionHypothesis: true,
                    keyAssumptions: true,
                    initialROI: true,
                    confidenceLevel: true,
                    operationalImpactScore: true,
                    productivityImpactScore: true,
                    revenueImpactScore: true,
                    implementationComplexity: true,
                    estimatedTimeline: true,
                    requiredResources: true,
                    createdAt: true,
                    updatedAt: true,
                    priority: true,
                    stage: true,
                    businessFunction: true,
                    aiucId: true,
                    estimatedTimelineMonths: true,
                    initialCost: true,
                    keyBenefits: true,
                    plannedStartDate: true,
                    organizationId: true,
                    userId: true,
                    aiType: true,
                    executiveSponsor: true,
                    requirementsReviewStatus: true,
                    technicalReviewStatus: true,
                    businessReviewStatus: true,
                    responsibleEthicalReviewStatus: true,
                    legalRegulatoryReviewStatus: true,
                    dataReadinessReviewStatus: true,
                    finopsReviewStatus: true,
                    regulatoryFrameworks: true,
                    industryStandards: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    organization: {
                        select: {
                            name: true
                        }
                    },
                },
                orderBy: { updatedAt: 'desc' }
            });
        } else {
            // Fallback: restrict to userId
            useCases = await prismaClient.useCase.findMany({
                where: { userId: userRecord.id },
                select: {
                    id: true,
                    title: true,
                    problemStatement: true,
                    proposedAISolution: true,
                    currentState: true,
                    desiredState: true,
                    primaryStakeholders: true,
                    secondaryStakeholders: true,
                    successCriteria: true,
                    problemValidation: true,
                    solutionHypothesis: true,
                    keyAssumptions: true,
                    initialROI: true,
                    confidenceLevel: true,
                    operationalImpactScore: true,
                    productivityImpactScore: true,
                    revenueImpactScore: true,
                    implementationComplexity: true,
                    estimatedTimeline: true,
                    requiredResources: true,
                    createdAt: true,
                    updatedAt: true,
                    priority: true,
                    stage: true,
                    businessFunction: true,
                    aiucId: true,
                    estimatedTimelineMonths: true,
                    initialCost: true,
                    keyBenefits: true,
                    plannedStartDate: true,
                    organizationId: true,
                    userId: true,
                    aiType: true,
                    executiveSponsor: true,
                    requirementsReviewStatus: true,
                    technicalReviewStatus: true,
                    businessReviewStatus: true,
                    responsibleEthicalReviewStatus: true,
                    legalRegulatoryReviewStatus: true,
                    dataReadinessReviewStatus: true,
                    finopsReviewStatus: true,
                    regulatoryFrameworks: true,
                    industryStandards: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    organization: {
                        select: {
                            name: true
                        }
                    },
                },
                orderBy: { updatedAt: 'desc' }
            });
        }


        
        const response = NextResponse.json({ useCases });
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
    } catch (error) {
        console.error('Error Reading UseCases', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}, { requireUser: true });