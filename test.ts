const fs = require('fs');

interface ParsedTransaction {
  amount: number;
  type: "expense" | "income";
  description: string;
  date: string;
}

function parseEmail(subject: string, bodyText: string, emailDate: Date): ParsedTransaction | null {
  // Try to find amount: Rp24.000, Rp. 150.000 or Nominal Rp 150.000
  let amount = 0;
  const rpRegex = /(?:Rp|IDR|Nominal)\s*\.?\s*([0-9]+(?:[\.,][0-9]{3})*(?:[\.,][0-9]{2})?)/i;
  const matchRp = bodyText.match(rpRegex) || subject.match(rpRegex);
  
  if (matchRp) {
    let amtStr = matchRp[1];
    if (amtStr.endsWith(",00") || amtStr.endsWith(".00")) {
      amtStr = amtStr.slice(0, -3);
    }
    const cleanAmt = amtStr.replace(/[\.,]/g, "");
    amount = parseFloat(cleanAmt);
  }

  // Fallback: Total Transaksi \n 24.000
  if (!amount || isNaN(amount)) {
    const totalRegex = /Total Transaksi[\s\r\n]+([0-9]+(?:[\.,][0-9]{3})*)/i;
    const matchTotal = bodyText.match(totalRegex);
    if (matchTotal) {
      amount = parseFloat(matchTotal[1].replace(/[\.,]/g, ""));
    }
  }

  if (!amount || isNaN(amount)) {
    return null;
  }

  let type: "expense" | "income" = "expense";
  const incomeKeywords = [
    "diterima", "masuk", "incoming", "kredit", "credit", "transfer dari", "receive",
    "didapat", "diteruskan", "ditambahkan", "top up", "topup", "cash-in", "cashin"
  ];
  
  const textToAnalyze = `${subject} ${bodyText}`.toLowerCase();
  const isIncome = incomeKeywords.some(keyword => textToAnalyze.includes(keyword));
  if (isIncome) {
    type = "income";
  }

  let description = "";
  
  // Try BRI specific formats first
  const briMerchantRegex = /Nama Merchant[ \t]*:?[ \t]*([^\r\n]+)/i;
  const briTujuanRegex = /Tujuan[\s\r\n]+(?:Product\.png[\s\r\n]+)?([^\r\n]+)/i;
  const briTransferRegex = /(?:Ke Rekening|Kepada)[ \t]*:?[ \t]*([^\r\n]+)/i;
  
  if (bodyText.match(briMerchantRegex)) {
    description = bodyText.match(briMerchantRegex)![1].trim();
  } else if (bodyText.match(briTujuanRegex)) {
    description = bodyText.match(briTujuanRegex)![1].trim();
  } else if (bodyText.match(briTransferRegex)) {
    description = bodyText.match(briTransferRegex)![1].trim();
  } else {
    // Generic fallback
    const genericRegex = /(?:merchant|ke|penerima|untuk|ke tujuan|destination|recipient|payee|merchant name|beli di|keterangan)[ \t]*:?[ \t]*([^\r\n]+)/i;
    const matchGeneric = bodyText.match(genericRegex);
    if (matchGeneric) {
      description = matchGeneric[1].trim();
    } else {
      description = subject.replace(/[\r\n]+/g, " ").trim();
    }
  }

  description = description.replace(/fwd:/i, "").trim();
  if (description.length > 255) {
    description = description.slice(0, 252) + "...";
  }

  let dateStr = emailDate.toISOString().split("T")[0];
  
  const dateRegex1 = /(?:Tanggal Transaksi|Tanggal)[ \t]*:?[ \t]*([0-9]{1,2} [A-Za-z]+ [0-9]{4})/i;
  const dateRegex2 = /(?:Tanggal Transaksi|Tanggal)[ \t]*:?[ \t]*([0-9]{2}[\/\-][0-9]{2}[\/\-][0-9]{4})/i;
  
  const matchDate1 = bodyText.match(dateRegex1);
  const matchDate2 = bodyText.match(dateRegex2);
  
  if (matchDate1) {
    const d = new Date(matchDate1[1]);
    if (!isNaN(d.getTime())) {
      dateStr = d.toISOString().split("T")[0];
    }
  } else if (matchDate2) {
    const parts = matchDate2[1].split(/[\/\-]/);
    if (parts.length === 3) {
      dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return {
    amount,
    type,
    description,
    date: dateStr,
  };
}

let raw = fs.readFileSync('temp.json', 'utf16le');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const data = JSON.parse(raw);
console.log('Total threads:', data.data.length);

let successCount = 0;
for (const msg of data.data) {
  const d = new Date(msg.date);
  const res = parseEmail(msg.subject, msg.bodyText, d);
  if (res) {
    console.log("Success:", res);
    successCount++;
  } else {
    console.log("Failed:", msg.subject);
  }
}
console.log('Total successfully parsed:', successCount);
