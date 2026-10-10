import { NextResponse, type NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";

const NAVY = rgb(0.086, 0.129, 0.353);
const GOLD = rgb(0.765, 0.573, 0.2);
const GRAY = rgb(0.35, 0.35, 0.35);

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { user, profile } = await getSession();
  if (!user) return NextResponse.redirect(new URL("/ingresar", request.url));

  const db = createAdminClient();
  const { data: cert } = await db.from("certificates").select("*").eq("code", code).maybeSingle();
  if (!cert || (cert.user_id !== user.id && profile?.role !== "admin")) {
    return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });
  }
  const { data: student } = await db.from("profiles").select("document_number").eq("id", cert.user_id).single();

  const site = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const verifyUrl = `${site}/verificar/${cert.code}`;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado ${cert.code}`);
  const page = pdf.addPage([842, 595]); // A4 apaisado
  const { width, height } = page.getSize();
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.984, 0.973, 0.945) });
  page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: NAVY, borderWidth: 6 });
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: GOLD, borderWidth: 1.5 });

  const center = (text: string, y: number, font = serif, size = 14, color = NAVY) => {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font, color });
  };
  const fit = (text: string, font: typeof serif, max: number, size: number) => {
    while (size > 12 && font.widthOfTextAtSize(text, size) > max) size -= 1;
    return size;
  };

  try {
    const logoBytes = await fetch(new URL("/logo-instituto-shema.png", request.nextUrl.origin)).then((r) => r.arrayBuffer());
    const logo = await pdf.embedPng(logoBytes);
    page.drawImage(logo, { x: width / 2 - 50, y: height - 150, width: 100, height: 100 });
  } catch {
    // sin logo si no se pudo cargar
  }

  center("INSTITUTO SHEMA", height - 178, serifBold, 26, NAVY);
  center("Congregación Shema Israel · Paraguay", height - 198, serifItalic, 12, GOLD);
  center("CERTIFICADO DE APROBACIÓN", height - 240, serifBold, 18, GOLD);
  center("Se otorga el presente certificado a", height - 272, serif, 13, GRAY);

  const name = cert.student_name.toUpperCase();
  center(name, height - 312, serifBold, fit(name, serifBold, width - 160, 30), NAVY);
  page.drawLine({ start: { x: 200, y: height - 322 }, end: { x: width - 200, y: height - 322 }, thickness: 0.8, color: GOLD });
  if (student?.document_number) center(`C.I. N° ${student.document_number}`, height - 340, sans, 10, GRAY);

  center("por haber completado y aprobado el curso", height - 366, serif, 13, GRAY);
  const title = `“${cert.course_title}”`;
  center(title, height - 396, serifBold, fit(title, serifBold, width - 160, 22), NAVY);
  center(
    `con una calificación final de ${cert.final_score}%. Asunción, ${formatDate(cert.issued_at)}.`,
    height - 422,
    serif,
    12,
    GRAY,
  );

  // Firma
  page.drawLine({ start: { x: 120, y: 105 }, end: { x: 320, y: 105 }, thickness: 0.8, color: NAVY });
  page.drawText("Pastor Félix Guerrero", { x: 220 - serifBold.widthOfTextAtSize("Pastor Félix Guerrero", 12) / 2, y: 90, size: 12, font: serifBold, color: NAVY });
  page.drawText("Pastor Presidente", { x: 220 - serif.widthOfTextAtSize("Pastor Presidente", 10) / 2, y: 76, size: 10, font: serif, color: GRAY });

  // QR de verificación
  const qr = await pdf.embedPng(await QRCode.toBuffer(verifyUrl, { margin: 1, width: 240, color: { dark: "#16215a" } }));
  page.drawImage(qr, { x: width - 190, y: 60, width: 80, height: 80 });
  page.drawText("Verificar en:", { x: width - 340, y: 112, size: 8, font: sans, color: GRAY });
  page.drawText(`${site.replace(/^https?:\/\//, "")}/verificar`, { x: width - 340, y: 101, size: 7, font: sans, color: GRAY });
  page.drawText(`Código: ${cert.code}`, { x: width - 340, y: 86, size: 9, font: sans, color: NAVY });

  center("“Escucha, Israel: el Señor nuestro Dios, el Señor uno es.” — Deuteronomio 6:4", 44, serifItalic, 9, GOLD);

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${cert.code}.pdf"`,
    },
  });
}
