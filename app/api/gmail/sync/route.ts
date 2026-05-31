import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// HELPER TYPES
// ============================================================

interface ParsedTransaction {
  amount: number;
  type: "expense" | "income";
  description: string;
  date: string;
}

// ============================================================
// PHONE NUMBER DETECTOR
// ============================================================
function isPhoneNumber(str: string): boolean {
  const cleaned = str.replace(/[\s\-\.]/g, "");
  return /^(\+?62|0)[0-9]{8,13}$/.test(cleaned);
}

// ============================================================
// BRI NOTIFICATION BODY PARSER
// Extracts real description from BRI email body.
//
// BRI income format:
//   "Dana Rp 1.000.000,00 masuk ke rekening ***6506 pada 25/05/26. Ket.: NBMB KASTUM ABADI TO NABATH NUUR MUHAM"
//
// BRI expense format:
//   "Dana Rp 100.000,00 keluar dari rekening ***6506 ... Ket.: ..."
//   OR the warning text appears because the real info is elsewhere
// ============================================================
interface BriInfo {
  description: string;
  isGajian: boolean;
  transferTo?: string;
}

function parseBriBody(bodyText: string): BriInfo | null {
  // Match "Ket.: SOME TEXT" — the real keterangan
  const ketRegex = /Ket\.?:?\s*([^\r\n]+)/i;
  const ketMatch = bodyText.match(ketRegex);

  if (!ketMatch) return null;

  const ket = ketMatch[1].trim();

  // Check if this is a "KASTUM ABADI" / salary transfer
  // Pattern: "NBMB KASTUM ABADI TO <name>" or just contains "KASTUM ABADI"
  if (/kastum\s*abadi/i.test(ket)) {
    // Extract destination name after "TO" if present (for outgoing)
    const toMatch = ket.match(/\bto\s+(.+)$/i);
    const transferTo = toMatch ? toMatch[1].trim() : undefined;
    return { description: "Gajian", isGajian: true, transferTo };
  }

  // Extract meaningful name: "NBMB SENDER TO RECIPIENT" → use after "TO" for income, before "TO" for expense
  const toMatch = ket.match(/^(.+?)\s+to\s+(.+)$/i);
  if (toMatch) {
    const sender = toMatch[1].replace(/^nbmb\s+/i, "").trim();
    const recipient = toMatch[2].trim();
    return { description: ket, isGajian: false, transferTo: recipient };
  }

  // Return cleaned ket as description
  const cleaned = ket.replace(/^nbmb\s+/i, "").trim();
  return { description: cleaned, isGajian: false };
}

// ============================================================
// DESCRIPTION NORMALIZER
// ============================================================
function normalizeDescription(description: string, bodyText: string, type: "expense" | "income"): string {
  // If description is the BRI security warning → extract real info from body
  if (/siapapun termasuk petugas bri/i.test(description)) {
    const briInfo = parseBriBody(bodyText);
    if (briInfo) {
      if (briInfo.isGajian) return "Gajian";

      // For expense: "Transfer ke <recipient>"
      if (type === "expense" && briInfo.transferTo) {
        return `Transfer ke ${briInfo.transferTo}`;
      }
      return briInfo.description;
    }
    // Last resort fallback if no Ket found
    return type === "income" ? "Transfer Masuk" : "Transfer Keluar";
  }

  // If description matches "***6506 pada ..." pattern → Gajian
  if (/\*+\d{4}(?:\s+pada\b.*)?/i.test(description)) {
    // But check body for KASTUM ABADI first
    const briInfo = parseBriBody(bodyText);
    if (briInfo?.isGajian) return "Gajian";
    // Generic income with Ket
    if (briInfo?.description) return briInfo.description;
    return "Gajian";
  }

  return description;
}

// ============================================================
// MAIN EMAIL PARSER
// ============================================================
export function parseEmail(
  subject: string,
  bodyText: string,
  emailDate: Date
): ParsedTransaction | null {
  // ── Amount extraction ───────────────────────────────────
  let amount = 0;
  const rpRegex =
    /(?:Rp|IDR|Nominal)\s*\.?\s*([0-9]+(?:[\.,][0-9]{3})*(?:[\.,][0-9]{2})?)/i;
  const matchRp = bodyText.match(rpRegex) || subject.match(rpRegex);

  if (matchRp) {
    let amtStr = matchRp[1];
    if (amtStr.endsWith(",00") || amtStr.endsWith(".00")) {
      amtStr = amtStr.slice(0, -3);
    }
    amount = parseFloat(amtStr.replace(/[\.,]/g, ""));
  }

  if (!amount || isNaN(amount)) {
    const totalRegex = /Total Transaksi[\s\r\n]+([0-9]+(?:[\.,][0-9]{3})*)/i;
    const matchTotal = bodyText.match(totalRegex);
    if (matchTotal) {
      amount = parseFloat(matchTotal[1].replace(/[\.,]/g, ""));
    }
  }

  if (!amount || isNaN(amount)) return null;

  // ── Type: expense / income ──────────────────────────────
  let type: "expense" | "income" = "expense";
  const incomeKeywords = [
    "diterima", "masuk", "incoming", "kredit", "credit",
    "transfer dari", "receive", "didapat", "diteruskan",
    "ditambahkan", "top up", "topup", "cash-in", "cashin",
  ];
  const combinedText = subject + " " + bodyText;
  if (incomeKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(combinedText))) {
    type = "income";
  }

  // ── Description extraction ──────────────────────────────
  let description = "";

  const briMerchantRegex = /Nama Merchant[ \t]*:?[ \t]*([^\r\n]+)/i;
  const briTujuanRegex = /Tujuan[\s\r\n]+(?:Product\.png[\s\r\n]+)?([^\r\n]+)/i;
  const briTransferRegex = /(?:Ke Rekening|Kepada)[ \t]*:?[ \t]*([^\r\n]+)/i;
  const briJenisRegex = /Jenis Transaksi[ \t]*:?[ \t]*([^\r\n]+)/i;
  const briKetRegex = /Ket\.?[ \t]*:?[ \t]*([^\r\n]+)/i;

  if (briMerchantRegex.test(bodyText)) {
    description = bodyText.match(briMerchantRegex)![1].trim();
  } else if (briTujuanRegex.test(bodyText)) {
    description = bodyText.match(briTujuanRegex)![1].trim();
  } else if (briTransferRegex.test(bodyText)) {
    description = bodyText.match(briTransferRegex)![1].trim();
  } else if (briJenisRegex.test(bodyText)) {
    description = bodyText.match(briJenisRegex)![1].trim();
  } else if (briKetRegex.test(bodyText)) {
    description = bodyText.match(briKetRegex)![1].trim();
  } else {
    const genericRegex =
      /(?:merchant|ke|penerima|ke tujuan|destination|recipient|payee|merchant name|beli di|keterangan)[ \t]*:?[ \t]*([^\r\n]+)/i;
    const matchGeneric = bodyText.match(genericRegex);
    description = matchGeneric
      ? matchGeneric[1].trim()
      : subject.replace(/[\r\n]+/g, " ").trim();
  }

  description = description.replace(/fwd:/i, "").trim();
  if (description.length > 255) description = description.slice(0, 252) + "...";

  // ── Post-process description (pass bodyText for BRI re-parse) ──
  description = normalizeDescription(description, bodyText, type);

  // ── Date extraction ─────────────────────────────────────
  let dateStr = emailDate.toISOString().split("T")[0];

  const dateRegex1 = /(?:Tanggal Transaksi|Tanggal)[ \t]*:?[ \t]*([0-9]{1,2} [A-Za-z]+ [0-9]{4})/i;
  const dateRegex2 = /(?:Tanggal Transaksi|Tanggal)[ \t]*:?[ \t]*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i;

  const matchDate1 = bodyText.match(dateRegex1);
  const matchDate2 = bodyText.match(dateRegex2);

  if (matchDate1) {
    const d = new Date(matchDate1[1]);
    if (!isNaN(d.getTime())) dateStr = d.toISOString().split("T")[0];
  } else if (matchDate2) {
    const parts = matchDate2[1].split(/[\/\-]/);
    if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  return { amount, type, description, date: dateStr };
}

// ============================================================
// CATEGORY KEYWORDS
// Keys EXACTLY match DB category names.
// ============================================================
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Kopi: [
    "coffee", "cafe", "café", "kopi", "espresso", "latte",
    "cappuccino", "barista", "brewhouse", "coffeehouse",
    "jam tujuh", "sarijan", "cs coffee", "tweehander",
    "medcafe", "umayumcha", "boba", "bubble tea",
    "toko kopi", "kedai kopi", "o/r",
  ],
  Makanan: [
    "food", "makan", "resto", "restaurant", "warung", "kantin",
    "starbucks", "mcdonald", "kfc", "pizza", "burger",
    "gofood", "grabfood", "sop", "ayam", "bakso", "geprek",
    "padang", "macaroni", "sambel", "nasi", "mie", "bakmie",
    "seafood", "sate", "pecel", "rawon", "soto",
    "rm ", "roda baru", "esb restaurant", "esb rest",
    "aventree", "turned in", "bb -", "kk-",
    "cincau", "aiciro",
  ],
  Transportasi: [
    "gojek", "goride", "gocar", "grab", "uber", "taxi",
    "mrt", "lrt", "krl", "kereta", "bus",
    "pertamina", "shell", "bensin", "spbu", "bbm",
    "toll", "tol", "parkir", "flight", "tiket",
  ],
  Belanja: [
    "shopee", "tokopedia", "pt tokopedia", "lazada", "blibli",
    "supermarket", "indomaret", "alfamart", "hypermart", "transmart",
    "mall", "fashion", "baju", "pakaian", "sepatu",
    "toko fajar", "toko ",
  ],
  Tagihan: [
    "listrik", "pln", "pdam", "wifi", "internet",
    "indihome", "telkomsel", "xl ", "tri ", "axis",
    "pulsa", "bpjs", "asuransi", "insurance",
    "pajak", "tagihan", "cicilan", "angsuran",
    "seabank", "bank bri",
    "satulink", "lintas indonesia",
    // BRI outgoing transfers also land here
    "transfer ke",
  ],
  Hiburan: [
    "netflix", "spotify", "disney", "youtube premium",
    "bioskop", "cgv", "xxi", "cinema",
    "game", "steam", "playstation", "nintendo",
    "karaoke", "entertainment", "nonton",
  ],
  Kesehatan: [
    "apotek", "apotik", "rumah sakit", "klinik",
    "dokter", "obat", "medika", "medical",
    "kimia farma", "k24", "sanada farma", "sanada",
    "puskesmas", "rs ", "rsud", "rsia",
  ],
  Pendidikan: [
    "sekolah", "kampus", "spp", "kursus",
    "buku", "gramedia", "kuliah",
    "fotocopy", "fotokopi", "print", "alat tulis",
    "express fotocopy",
  ],
  Perawatan: [
    "barbershop", "barber", "salon", "spa",
    "pangkas", "nail", "kecantikan", "skincare",
    "nagoya barbershop", "maklor",
  ],
};

const MATCH_ORDER = [
  "Kopi", "Makanan", "Transportasi", "Belanja",
  "Tagihan", "Hiburan", "Kesehatan", "Pendidikan", "Perawatan",
];

export function matchCategoryId(
  description: string,
  categories: { id: string; name: string; type: string }[],
  type: "expense" | "income"
): string | undefined {
  const typedCategories = categories.filter((c) => c.type === type);

  // Income → always "Pemasukan"
  if (type === "income") {
    return (
      typedCategories.find((c) => c.name === "Pemasukan")?.id ||
      typedCategories[0]?.id
    );
  }

  const descLower = description.toLowerCase().trim();

  // Phone number → Tagihan
  if (isPhoneNumber(description)) {
    return (
      typedCategories.find((c) => c.name === "Tagihan")?.id ||
      typedCategories.find((c) => c.name === "Lainnya")?.id
    );
  }

  // Keyword matching in priority order
  for (const catName of MATCH_ORDER) {
    const keywords = CATEGORY_KEYWORDS[catName] ?? [];
    if (keywords.some((kw) => descLower.includes(kw.toLowerCase()))) {
      const cat = typedCategories.find((c) => c.name === catName);
      if (cat) return cat.id;
    }
  }

  // Fallback → "Lainnya"
  return (
    typedCategories.find((c) => c.name === "Lainnya")?.id ||
    typedCategories[0]?.id
  );
}

export async function POST() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    if (!appsScriptUrl) {
      return NextResponse.json(
        { error: "APPS_SCRIPT_URL not configured in environment variables." },
        { status: 400 }
      );
    }

    const { data: accounts, error: accountsError } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No active account found. Please create an account first." },
        { status: 400 }
      );
    }

    const targetAccount =
      accounts.find((a: any) => a.name.toLowerCase().includes("main balance")) ||
      accounts[0];

    const { data: categories } = await supabase
      .from("transaction_categories")
      .select("*");
    const categoryList = categories || [];

    const response = await fetch(appsScriptUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch from Google Apps Script");
    }

    const parsedTransactions: ParsedTransaction[] = [];
    console.log(`Fetched ${result.data?.length || 0} emails from Google Apps Script.`);

    for (const msg of result.data || []) {
      const emailDate = new Date(msg.date);
      const parsed = parseEmail(msg.subject, msg.bodyText, emailDate);

      console.log(`\n--- Parsing Email ---`);
      console.log(`Subject: ${msg.subject}`);
      console.log(`Date: ${msg.date}`);
      console.log(`Parsed Result:`, parsed);

      if (parsed) {
        parsedTransactions.push(parsed);
      } else {
        console.log(`Failed to parse body: ${msg.bodyText.substring(0, 100)}...`);
      }
    }

    console.log(`\nSuccessfully parsed ${parsedTransactions.length} transactions out of ${result.data?.length || 0} emails.`);

    let newSyncCount = 0;
    const syncedItems: any[] = [];

    for (const tx of parsedTransactions) {
      const { data: existing, error: dupError } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("account_id", targetAccount.id)
        .eq("amount", tx.amount)
        .eq("type", tx.type)
        .eq("merchant", tx.description)
        .eq("transaction_date", `${tx.date}T00:00:00Z`)
        .limit(1);

      if (dupError) {
        console.error("Duplicate check error:", dupError);
        continue;
      }

      if (!existing || existing.length === 0) {
        const categoryId = matchCategoryId(tx.description, categoryList, tx.type);

        const { data: inserted, error: insertError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            account_id: targetAccount.id,
            type: tx.type,
            amount: tx.amount,
            transaction_date: `${tx.date}T00:00:00Z`,
            merchant: tx.description,
            note: "Synced from Gmail",
            category_id: categoryId,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
        }

        if (!insertError && inserted) {
          newSyncCount++;
          syncedItems.push(inserted);

          let newBalance = Number(targetAccount.balance || 0);
          if (tx.type === "income") newBalance += Number(tx.amount);
          else if (tx.type === "expense") newBalance -= Number(tx.amount);

          await supabase
            .from("accounts")
            .update({ balance: newBalance })
            .eq("id", targetAccount.id);

          targetAccount.balance = newBalance;
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: newSyncCount,
      transactions: syncedItems,
    });
  } catch (error: any) {
    console.error("Gmail sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync transactions from Gmail" },
      { status: 500 }
    );
  }
}