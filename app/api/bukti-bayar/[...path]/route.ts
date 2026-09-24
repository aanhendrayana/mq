import { NextRequest, NextResponse } from "next/server";
import { penggunaSekarang } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const pengguna = await penggunaSekarang();

  if (!pengguna) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const relativePath = segments.join("/");
  // Hanya admin atau santri pemilik berkas (path diawali id santri) yang boleh membuka
  const isOwner = relativePath.startsWith(pengguna.id);
  const isAdmin = pengguna.profil.peranList.includes("admin") || pengguna.profil.peranList.includes("ummi");

  if (!isOwner && !isAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", "bukti-bayar", ...segments);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
      ? "image/webp"
      : ext === ".pdf"
      ? "application/pdf"
      : "image/jpeg";

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
