import { prismaClient } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';


export const POST = withAuth(async (req: Request, { auth }: { auth: any }) => {
    try {
        // auth context is provided by withAuth wrapper
        
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId: auth.userId! },
        });
        
        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { useCaseId, assessData } = await req.json();

        if (!useCaseId || !assessData) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check permissions based on role
        if (userRecord.role !== 'QZEN_ADMIN') {
            const useCase = await prismaClient.useCase.findUnique({
                where: { id: useCaseId },
            });
            
            if (!useCase) {
                return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
            }
            
            if (userRecord.role === 'USER') {
                // USER can only update their own use cases
                if (useCase.userId !== userRecord.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
                // ORG_ADMIN and ORG_USER can only update use cases in their organization
                if (useCase.organizationId !== userRecord.organizationId) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            }
        }

        // Note: assessData is now stored as Answers in the Q&A model
        // The stepsData structure is built from Answers using buildStepsDataFromAnswers
        // This endpoint is kept for backward compatibility but data is now stored in Answer model
        console.log('[CRUD_LOG] Assessment data received (stored as Answers):', { useCaseId, stepsDataKeys: Object.keys(assessData), authoredBy: userRecord.id });
        
        // Return success - actual data is stored via Answer model endpoints
        const result = {
            useCaseId,
            stepsData: assessData,
            updatedAt: new Date(),
        };

        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Error saving assessment data:", error);
        return NextResponse.json(
            { error: "Failed to save assessment data" },
            { status: 500 }
        );
    }
}, { requireUser: true });