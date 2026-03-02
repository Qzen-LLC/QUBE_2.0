import { prismaClient } from "@/utils/db";
import { NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';

export const POST = withAuth(async (
    req: Request,
    { auth }: { auth: any }
) => {
    try {
        // auth context is provided by withAuth wrapper
        
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId: auth.userId! },
        });
        
        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await req.json();
        const {
            useCaseId,
            ROI,
            netValue,
            apiCostBase,
            cumOpCost,
            cumValue,
            devCostBase,
            infraCostBase,
            opCostBase,
            totalInvestment,
            valueBase,
            valueGrowthRate,
            budgetRange,
            source,
            lastAggregatedAt,
        } = body;

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
                // ORG_USER cannot update FinOps data
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const upsertData: any = {
            ROI,
            netValue,
            apiCostBase,
            cumOpCost,
            cumValue,
            devCostBase,
            infraCostBase,
            opCostBase,
            totalInvestment,
            valueBase,
            valueGrowthRate,
            budgetRange,
        };
        if (source !== undefined) upsertData.source = source;
        if (lastAggregatedAt !== undefined) upsertData.lastAggregatedAt = new Date(lastAggregatedAt);

        await prismaClient.finOps.upsert({
            where: { useCaseId },
            update: upsertData,
            create: { useCaseId, ...upsertData },
        });
        console.log('[CRUD_LOG] FinOps data upserted:', { useCaseId, ROI, netValue, totalInvestment, authoredBy: userRecord.id });


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating FinOps:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}, { requireUser: true });