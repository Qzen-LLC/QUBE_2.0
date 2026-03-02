import { prismaClient } from "@/utils/db";
import { withAuth } from '@/lib/auth-gateway';

// Removed: import redis from '@/lib/redis';

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
            return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        // Removed Redis cache check and cacheKey logic
        // Check use case ownership for USER role
        if (userRecord.role === 'USER') {
            const useCase = await prismaClient.useCase.findUnique({
                where: { id },
            });
            if (!useCase || useCase.userId !== userRecord.id) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
            }
        }
        const res = await prismaClient.finOps.findMany({
            where: {
                useCaseId: id,
            },
        });
        // Removed Redis set logic
        return new Response(JSON.stringify(res), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
            }
        });
    } catch(error) {
        console.error("Unable to fetch FinOps", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}, { requireUser: true });