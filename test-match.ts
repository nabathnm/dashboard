const text = `Berikut detail transaksi kamu di BRImo:
Total Transaksi
24.000
Tujuan
Product.png
sambel bejo bangdo, LWKWR
QRIS Bayar
9360000210088812680
Nomor Referensi 150520261426
Tanggal Transaksi 29 May 2026, 18:16:22 WIB
Rekening Sumber Dana 0051 **** **** 506
Nama Sumber Dana NABATH NUUR MUHAMMAD
Jenis Transaksi QRIS Bayar
Nama Merchant sambel bejo bangdo, LWKWR
Lokasi Merchant MALANG
Nama Penerbit BRI
Nama Pengakuisisi GoPay
Kode PAN Pelanggan 9360000210088812680
Merchant PAN 936009143408624045
ID Terminal A01
Catatan -
Nominal Rp24.000
Biaya Admin Rp0
INFORMASI:
Biaya Termasuk PPN (Apabila Dikenakan/Apabila Ada)
PT. Bank Rakyat Indonesia (Persero) Tbk.
Kantor Pusat BRI - Jakarta Pusat
NPWP : 01.001.608.7-093.000`.toLowerCase();

const keywords = ['diterima', 'masuk', 'incoming', 'kredit', 'credit', 'transfer dari', 'receive', 'didapat', 'diteruskan', 'ditambahkan', 'top up', 'topup', 'cash-in', 'cashin'];
const matched = keywords.filter(k => text.includes(k));
console.log('Matched:', matched);
