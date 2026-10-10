import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await getSession();
  if (profile?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const db = createAdminClient();
  const { data: order } = await db.from("orders").select("receipt_path").eq("id", id).single();
  if (!order?.receipt_path) return NextResponse.json({ error: "Sin comprobante" }, { status: 404 });
  const { data } = await db.storage.from("receipts").createSignedUrl(order.receipt_path, 300);
  return NextResponse.redirect(data!.signedUrl);
}
