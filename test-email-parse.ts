import { parseEmail } from "./app/api/gmail/sync/route";

const subject = "Pemberitahuan Transaksi";
const bodyText = `Sobat BRI!
Dana Rp 1.000.000,00 masuk ke rekening ***6506 pada 25/05/26 13:22:56. Ket.: NBMB KASTUM ABADI TO NABATH NUUR MUHAM

JANGAN MEMBERIKAN DATA PRIBADI KEPADA SIAPAPUN TERMASUK PETUGAS BRI seperti Username, Password, PIN, Kode OTP, M-Token & CVC/CVV.

Tips untuk terhindar dari Modus Kejahatan Perbankan, klik link : bri.co.id/briedukasi`;

const d = new Date("2026-05-25T17:06:00Z");

const result = parseEmail(subject, bodyText, d);
console.log(result);
