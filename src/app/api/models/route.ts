import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from "@/utils/db";
import { decryptApiKey, encryptApiKey } from "@/lib/security/api-key-encryption";

export const GET = withAuth(async (req, { auth }) => {
  try {
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    
    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    // Get user record to check permissions
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions: QZEN_ADMIN can access any org, ORG_ADMIN can only access their own
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can access any organization's models
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === organizationId) {
      // ORG_ADMIN can only access their own organization's models
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const models = await prismaClient.aiModel.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });

    // Decrypt API keys before returning
    const decryptedModels = models.map(model => {
      try {
        return {
          ...model,
          apiKey: decryptApiKey(model.apiKey),
        };
      } catch (error) {
        console.error('Failed to decrypt API key for model:', model.id, error);
        return {
          ...model,
          apiKey: '', // Return empty string if decryption fails
        };
      }
    });

    return NextResponse.json({ models: decryptedModels });
  } catch (error: any) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: error.message || "Failed to fetch models" }, { status: 500 });
  }
}, { requireUser: true });

export const POST = withAuth(async (req, { auth }) => {
  try {
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, providerName, modelName, apiKey } = body || {};
    
    if (!organizationId || !providerName || !modelName || !apiKey) {
      return NextResponse.json({ error: "organizationId, providerName, modelName, apiKey are required" }, { status: 400 });
    }

    // Get user record to check permissions
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions: QZEN_ADMIN can create for any org, ORG_ADMIN can only create for their own
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can create models for any organization
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === organizationId) {
      // ORG_ADMIN can only create models for their own organization
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encryptApiKey(String(apiKey).trim());

    const created = await prismaClient.aiModel.create({
      data: {
        organizationId,
        providerName: String(providerName).trim(),
        modelName: String(modelName).trim(),
        apiKey: encryptedApiKey,
      },
    });

    // Decrypt the API key before returning (for UI display)
    const decryptedModel = {
      ...created,
      apiKey: decryptApiKey(created.apiKey),
    };

    return NextResponse.json({ model: decryptedModel }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating model:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "A model with this name already exists for this organization" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create model" }, { status: 500 });
  }
}, { requireUser: true });


