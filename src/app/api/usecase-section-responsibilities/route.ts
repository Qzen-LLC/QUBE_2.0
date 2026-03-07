import { prismaClient } from '@/utils/db';
import { NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';
import { verifyUseCaseAccess } from '@/lib/org-scope';

// GET: Fetch section responsibilities for a use case
export const GET = withAuth(async (req: Request, { auth }) => {
    try {
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId: auth.userId! },
            include: { organization: true }
        });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const useCaseId = searchParams.get('useCaseId');

        if (!useCaseId) {
            return NextResponse.json({ error: 'useCaseId is required' }, { status: 400 });
        }

        if (!(await verifyUseCaseAccess(auth, useCaseId))) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check permissions
        if (userRecord.role !== 'QZEN_ADMIN') {
            const useCase = await prismaClient.useCase.findUnique({
                where: { id: useCaseId },
            });

            if (!useCase) {
                return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
            }

            if (userRecord.role === 'USER') {
                if (useCase.userId !== userRecord.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } else if (userRecord.role === 'ORG_ADMIN' || userRecord.role === 'ORG_USER') {
                if (useCase.organizationId !== userRecord.organizationId) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            }
        }

        const responsibilities = await prismaClient.useCaseSectionResponsibility.findMany({
            where: { useCaseId },
            include: {
                responsiblePerson: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            },
            orderBy: { section: 'asc' }
        });

        return NextResponse.json({ responsibilities });
    } catch (error) {
        console.error('Error fetching section responsibilities', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}, { requireUser: true });

// POST: Create or update section responsibility
export const POST = withAuth(async (req: Request, { auth }) => {
    try {
        const userRecord = await prismaClient.user.findUnique({
            where: { clerkId: auth.userId! },
        });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { useCaseId, section, responsiblePersonId } = await req.json();

        if (!useCaseId || !section) {
            return NextResponse.json({ error: 'useCaseId and section are required' }, { status: 400 });
        }

        if (!(await verifyUseCaseAccess(auth, useCaseId))) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Validate section enum
        const validSections = ['GOVERNANCE', 'RISK', 'SECURITY', 'TECHNICAL', 'BUSINESS'];
        if (!validSections.includes(section)) {
            return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }

        // Check permissions
        if (userRecord.role !== 'QZEN_ADMIN') {
            const useCase = await prismaClient.useCase.findUnique({
                where: { id: useCaseId },
            });

            if (!useCase) {
                return NextResponse.json({ error: 'Use case not found' }, { status: 404 });
            }

            if (userRecord.role === 'USER') {
                if (useCase.userId !== userRecord.id) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } else if (userRecord.role === 'ORG_ADMIN') {
                if (useCase.organizationId !== userRecord.organizationId) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
            } else if (userRecord.role === 'ORG_USER') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // If responsiblePersonId is provided, verify it exists
        if (responsiblePersonId) {
            const person = await prismaClient.user.findUnique({
                where: { id: responsiblePersonId },
            });
            if (!person) {
                return NextResponse.json({ error: 'Responsible person not found' }, { status: 404 });
            }
        }

        // Upsert the responsibility
        const responsibility = await prismaClient.useCaseSectionResponsibility.upsert({
            where: {
                useCaseId_section: {
                    useCaseId,
                    section: section as any,
                }
            },
            update: {
                responsiblePersonId: responsiblePersonId || null,
                updatedAt: new Date(),
            },
            create: {
                useCaseId,
                section: section as any,
                responsiblePersonId: responsiblePersonId || null,
            },
            include: {
                responsiblePerson: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                }
            }
        });

        return NextResponse.json({ success: true, responsibility });
    } catch (error) {
        console.error('Error updating section responsibility', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}, { requireUser: true });

