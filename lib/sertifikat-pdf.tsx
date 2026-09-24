import "server-only";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { SITUS } from "@/lib/konstanta";

export type DataSertifikat = {
  nomor: string;
  namaSantri: string;
  judulKelas: string;
  jenjang: string | null;
  predikat: string | null;
  nilaiRata: number | null;
  tglTerbit: string;
  tokenVerifikasi: string;
  /** Nama & jabatan yang tercetak di blok tanda tangan. */
  penandatangan: { nama: string; peran: string };
};

/**
 * Warna & ukuran sengaja ditulis sebagai nilai mentah, bukan token CSS:
 * @react-pdf punya mesin gaya sendiri dan tidak mengenal variabel CSS.
 */
const HIJAU = "#2f5d4f";
const EMAS = "#b08628";
const TINTA = "#1f2a26";
const ABU = "#6b7772";

const g = StyleSheet.create({
  halaman: {
    paddingTop: 46,
    paddingBottom: 40,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    color: TINTA,
    backgroundColor: "#ffffff",
  },
  bingkaiLuar: {
    flex: 1,
    borderWidth: 2,
    borderColor: HIJAU,
    padding: 6,
  },
  bingkaiDalam: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: EMAS,
    paddingVertical: 30,
    paddingHorizontal: 36,
    alignItems: "center",
  },
  lembaga: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: HIJAU,
    letterSpacing: 1.6,
    textAlign: "center",
  },
  subLembaga: {
    fontSize: 8.5,
    color: ABU,
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: "center",
  },
  garis: {
    width: 58,
    height: 2,
    backgroundColor: EMAS,
    marginVertical: 18,
  },
  judul: {
    fontSize: 25,
    fontFamily: "Helvetica-Bold",
    color: HIJAU,
    letterSpacing: 3,
    textAlign: "center",
  },
  nomor: {
    fontSize: 8.5,
    color: ABU,
    marginTop: 7,
    letterSpacing: 0.6,
  },
  pengantar: {
    fontSize: 10,
    color: ABU,
    marginTop: 26,
    textAlign: "center",
  },
  nama: {
    fontSize: 27,
    fontFamily: "Helvetica-Bold",
    color: TINTA,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  garisNama: {
    width: 300,
    height: 0.8,
    backgroundColor: EMAS,
    marginBottom: 16,
  },
  keterangan: {
    fontSize: 10.5,
    color: ABU,
    textAlign: "center",
    lineHeight: 1.6,
    maxWidth: 380,
  },
  kelas: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: HIJAU,
    marginTop: 8,
    textAlign: "center",
  },
  barisNilai: {
    flexDirection: "row",
    gap: 34,
    marginTop: 22,
    justifyContent: "center",
  },
  kotakNilai: { alignItems: "center" },
  labelNilai: { fontSize: 7.5, color: ABU, letterSpacing: 1, marginBottom: 3 },
  isiNilai: { fontSize: 12, fontFamily: "Helvetica-Bold", color: TINTA },
  kaki: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "auto",
  },
  kolomKaki: { alignItems: "center", width: 150 },
  garisTtd: { width: 130, height: 0.8, backgroundColor: ABU, marginBottom: 5 },
  teksKaki: { fontSize: 8, color: ABU, textAlign: "center" },
  namaTtd: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: TINTA },
  qr: { width: 62, height: 62 },
  teksQr: { fontSize: 6.5, color: ABU, marginTop: 4, textAlign: "center", maxWidth: 92 },
});

function tanggalPanjang(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/**
 * Nama program pada lembar sertifikat.
 *
 * Jenjang hanya diimbuhkan bila belum termuat di judul kelas — tanpa ini,
 * "Tahsin Dasar" berjenjang "Dasar" tercetak menjadi "Tahsin Dasar — Dasar".
 */
function namaProgram(data: DataSertifikat): string {
  const jenjang = data.jenjang?.trim();
  if (!jenjang) return data.judulKelas;
  const sudahAda = data.judulKelas.toLowerCase().includes(jenjang.toLowerCase());
  return sudahAda ? data.judulKelas : `${data.judulKelas} — ${jenjang}`;
}

function Lembar({ data, qr }: { data: DataSertifikat; qr: string }) {
  return (
    <Document
      title={`Sertifikat ${data.nomor}`}
      author={SITUS.nama}
      subject={`Sertifikat kelulusan ${data.judulKelas}`}
    >
      <Page size="A4" orientation="landscape" style={g.halaman}>
        <View style={g.bingkaiLuar}>
          <View style={g.bingkaiDalam}>
            <Text style={g.lembaga}>MADRASAH QURAN NURUL MUSTHOFA</Text>
            <Text style={g.subLembaga}>PERUM SAFIRA</Text>
            <Text style={g.subLembaga}>PROGRAM PEMBELAJARAN AL-QUR&apos;AN DARING</Text>

            <View style={g.garis} />

            <Text style={g.judul}>SERTIFIKAT</Text>
            <Text style={g.nomor}>Nomor: {data.nomor}</Text>

            <Text style={g.pengantar}>Dengan ini menyatakan bahwa</Text>
            <Text style={g.nama}>{data.namaSantri}</Text>
            <View style={g.garisNama} />

            <Text style={g.keterangan}>
              telah menyelesaikan seluruh rangkaian pembelajaran, mengikuti
              halaqah setoran bacaan, dan dinyatakan lulus pada program
            </Text>
            <Text style={g.kelas}>{namaProgram(data)}</Text>

            <View style={g.barisNilai}>
              {data.predikat && (
                <View style={g.kotakNilai}>
                  <Text style={g.labelNilai}>PREDIKAT</Text>
                  <Text style={g.isiNilai}>{data.predikat}</Text>
                </View>
              )}
              {data.nilaiRata !== null && (
                <View style={g.kotakNilai}>
                  <Text style={g.labelNilai}>NILAI RATA-RATA</Text>
                  <Text style={g.isiNilai}>{data.nilaiRata.toFixed(1)}</Text>
                </View>
              )}
              <View style={g.kotakNilai}>
                <Text style={g.labelNilai}>TANGGAL TERBIT</Text>
                <Text style={g.isiNilai}>{tanggalPanjang(data.tglTerbit)}</Text>
              </View>
            </View>

            <View style={g.kaki}>
              <View style={g.kolomKaki}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image src={qr} style={g.qr} />
                <Text style={g.teksQr}>Pindai untuk memverifikasi keaslian</Text>
              </View>

              <View style={g.kolomKaki}>
                <View style={g.garisTtd} />
                <Text style={[g.teksKaki, g.namaTtd]}>{data.penandatangan.nama}</Text>
                <Text style={g.teksKaki}>{data.penandatangan.peran}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

/** Menghasilkan berkas PDF sertifikat sebagai buffer, siap dikirim sebagai unduhan. */
export async function buatPdfSertifikat(data: DataSertifikat): Promise<Buffer> {
  const urlVerifikasi = `${SITUS.url}/cek-sertifikat/${data.tokenVerifikasi}`;
  const qr = await QRCode.toDataURL(urlVerifikasi, {
    margin: 0,
    width: 240,
    color: { dark: "#1f2a26", light: "#ffffff" },
  });

  return renderToBuffer(<Lembar data={data} qr={qr} />);
}
