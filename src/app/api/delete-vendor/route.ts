import { prismaClient } from "@/utils/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required' }, { status: 400 });
    }

    await prismaClient.vendor.delete({ where: { id } });
    console.log('[CRUD_LOG] Vendor deleted:', { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vendor' }, { status: 500 });
  }
} 