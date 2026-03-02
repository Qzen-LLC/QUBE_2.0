import { prismaClient } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';

export const POST = withAuth(async (req, { auth }) => {
    try {
        // auth context is provided by withAuth wrapper
        const clerkId = auth.userId!;
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId },
        });
        
        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { useCaseId, newStage } = await req.json();

        if (!useCaseId || !newStage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
            } else if (userRecord.role === 'ORG_ADMIN') {
                // ORG_ADMIN can only update use cases in their organization
                if (useCase.organizationId !== userRecord.organizationId) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } else if (userRecord.role === 'ORG_USER') {
                // ORG_USER can update use cases in their organization or their own use cases
                if (useCase.organizationId !== userRecord.organizationId && useCase.userId !== userRecord.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            }
        }

        await prismaClient.useCase.update({
            where: {
                id: useCaseId,
            },
            data: {
                stage: newStage,
            }
        });
        console.log('[CRUD_LOG] UseCase stage updated:', { id: useCaseId, stage: newStage, updatedAt: new Date(), authoredBy: userRecord.id });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unable to update stage", error);
        return NextResponse.json({ success: false, error: 'Unable to update stage' }, { status: 500 });
    }
}, { requireUser: true });