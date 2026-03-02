import { NextRequest, NextResponse } from "next/server";
import { withAuth } from '@/lib/auth-gateway';
import { prismaClient } from "@/utils/db";
import { decryptApiKey, encryptApiKey } from "@/lib/security/api-key-encryption";

export const PUT = withAuth(async (req, { auth, params }: { auth: any, params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const { providerName, modelName, apiKey } = body || {};
    const data: any = {};
    if (typeof providerName === "string") data.providerName = providerName.trim();
    if (typeof modelName === "string") data.modelName = modelName.trim();
    if (typeof apiKey === "string") data.apiKey = encryptApiKey(apiKey.trim());
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Get user record to check permissions
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the model to check organization
    const model = await prismaClient.aiModel.findUnique({
      where: { id },
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Check permissions: QZEN_ADMIN can update any org's models, ORG_ADMIN can only update their own
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can update models for any organization
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === model.organizationId) {
      // ORG_ADMIN can only update models for their own organization
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const updated = await prismaClient.aiModel.update({ where: { id }, data });
    
    // Decrypt the API key before returning (for UI display)
    const decryptedModel = {
      ...updated,
      apiKey: decryptApiKey(updated.apiKey),
    };

    return NextResponse.json({ model: decryptedModel });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "A model with this name already exists for this organization" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to update model" }, { status: 500 });
  }
}, { requireUser: true });

export const DELETE = withAuth(async (req, { auth, params }: { auth: any, params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    // Get user record to check permissions
    const userRecord = await prismaClient.user.findUnique({
      where: { clerkId: auth.userId! },
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the model to check organization
    const model = await prismaClient.aiModel.findUnique({
      where: { id },
    });

    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Check permissions: QZEN_ADMIN can delete any org's models, ORG_ADMIN can only delete their own
    if (userRecord.role === 'QZEN_ADMIN') {
      // QZEN_ADMIN can delete models for any organization
    } else if (userRecord.role === 'ORG_ADMIN' && userRecord.organizationId === model.organizationId) {
      // ORG_ADMIN can only delete models for their own organization
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await prismaClient.aiModel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete model" }, { status: 500 });
  }
}, { requireUser: true });


