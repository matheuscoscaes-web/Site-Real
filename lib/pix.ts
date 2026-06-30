function emv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xffff) >>> 0).toString(16).toUpperCase().padStart(4, "0");
}

export function gerarPixEMV({
  chave,
  nome,
  cidade,
  valor,
  txid = "HEARTSPAY",
}: {
  chave: string;
  nome: string;
  cidade: string;
  valor: number;
  txid?: string;
}): string {
  const merchantAccount = emv("00", "br.gov.bcb.pix") + emv("01", chave);
  const txidClean = txid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "HEARTSPAY";
  const additionalData = emv("05", txidClean);

  const payload = [
    emv("00", "01"),
    emv("01", "12"),
    emv("26", merchantAccount),
    emv("52", "0000"),
    emv("53", "986"),
    emv("54", valor.toFixed(2)),
    emv("58", "BR"),
    emv("59", nome.slice(0, 25)),
    emv("60", cidade.slice(0, 15)),
    emv("62", additionalData),
    "6304",
  ].join("");

  return payload + crc16(payload);
}
