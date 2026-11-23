"use client";

import { Printer } from "lucide-react";

type Props = {
  orderCode: string;
  customerName: string;
  customerPhone?: string | null;
  totalItems: number;
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Etiqueta "RETIRADA EM LOJA" no tamanho 10x15 cm (100x150 mm), o mesmo da etiqueta
 * do Melhor Envio — pra imprimir na térmica (Tomate) e colar na bolsa.
 */
export function EtiquetaRetiradaButton({ orderCode, customerName, customerPhone, totalItems }: Props) {
  function imprimir() {
    const w = window.open("", "_blank", "width=480,height=720");
    if (!w) return;
    const logo = `${window.location.origin}/imagens/logo.png`;
    w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Retirada em loja #${esc(orderCode)}</title>
<style>
  @page { size: 100mm 150mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100mm; height: 150mm; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }
  .label { width: 100mm; height: 150mm; padding: 6mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; border: 0; }
  .logo { width: 30mm; height: auto; filter: grayscale(1) contrast(1.4); }
  .titulo { border: 1.2mm solid #000; padding: 5mm 3mm; width: 100%; }
  .titulo h1 { font-size: 15mm; line-height: 1; font-weight: 900; letter-spacing: 0.5mm; }
  .info { width: 100%; border-top: 0.6mm dashed #000; padding-top: 4mm; }
  .info .lbl { font-size: 3.5mm; text-transform: uppercase; letter-spacing: 0.3mm; }
  .info .nome { font-size: 8mm; font-weight: 700; margin: 1mm 0 3mm; word-break: break-word; }
  .info .cod { font-size: 7mm; font-weight: 700; font-family: "Courier New", monospace; }
  .info .extra { font-size: 4mm; margin-top: 2mm; }
</style></head>
<body>
  <div class="label">
    <img class="logo" src="${logo}" alt="">
    <div class="titulo"><h1>RETIRADA<br>EM LOJA</h1></div>
    <div class="info">
      <div class="lbl">Cliente</div>
      <div class="nome">${esc(customerName)}</div>
      <div class="lbl">Pedido</div>
      <div class="cod">#${esc(orderCode)}</div>
      <div class="extra">${totalItems} ite${totalItems === 1 ? "m" : "ns"}${customerPhone ? " · " + esc(customerPhone) : ""}</div>
    </div>
  </div>
  <script>
    function go(){ setTimeout(function(){ window.print(); }, 150); }
    var img = document.querySelector('.logo');
    if (img.complete) go(); else { img.onload = go; img.onerror = function(){ img.remove(); go(); }; }
    window.onafterprint = function(){ window.close(); };
  </script>
</body></html>`);
    w.document.close();
  }

  return (
    <button type="button" onClick={imprimir} className="btn-outline text-sm py-2 gap-2 w-full justify-center">
      <Printer size={16} /> Imprimir etiqueta &quot;Retirada em loja&quot;
    </button>
  );
}
