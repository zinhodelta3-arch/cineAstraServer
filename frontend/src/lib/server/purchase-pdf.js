import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, PDFString, StandardFonts, PageSizes, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import qrcode from 'qrcode-generator';
import { purchaseDate, purchaseDocumentStatus, purchaseDocumentTotalLabel, purchaseItemLabel, purchaseMoney, purchasePaymentMethods, purchaseSessionDate } from '@/lib/api/purchases.mjs';

const [width, height] = PageSizes.A4;
const edge = 40;
const body = edge + 22;
const right = width - body;
const end = height - 61;
const paper = rgb(.984, .961, .910);
const white = rgb(1, .992, .973);
const wine = rgb(.384, .094, .169);
const gold = rgb(.929, .816, .541);
const parchment = rgb(.941, .890, .800);
const ink = rgb(.169, .114, .094);
const muted = rgb(.416, .318, .275);
const rule = rgb(.788, .702, .592);

export async function generatePurchasePdf(document, verificationUrl) {
  const assets = path.join(process.cwd(), 'public');
  const [displayBytes, logoBytes] = await Promise.all([
    readFile(path.join(assets, 'fonts', 'cinema', 'display.ttf')),
    readFile(path.join(assets, 'CineAstra.png')),
  ]);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const [normal, bold, display, logo] = await Promise.all([
    pdf.embedFont(StandardFonts.Helvetica), pdf.embedFont(StandardFonts.HelveticaBold),
    pdf.embedFont(displayBytes, { subset: true }), pdf.embedPng(logoBytes),
  ]);
  pdf.setTitle('Comprovante de compra CineAstra #' + document.orderId);
  pdf.setAuthor('CineAstra');
  pdf.setLanguage('pt-BR');

  const characterSets = new Map([normal, bold, display].map(font => [font, new Set(font.getCharacterSet())]));
  function clean(value, font) {
    return Array.from(String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim())
      .map(character => characterSets.get(font).has(character.codePointAt(0)) ? character : '?').join('');
  }
  function fit(value, font, size, limit) {
    const text = clean(value, font);
    if (font.widthOfTextAtSize(text, size) <= limit) return text;
    let kept = '';
    for (const character of text) {
      if (font.widthOfTextAtSize(kept + character + '...', size) > limit) break;
      kept += character;
    }
    return kept.trimEnd() + '...';
  }

  let page, cursor;
  const box = (x, top, w, h, color) => page.drawRectangle({ x, y: height - top - h, width: w, height: h, color });
  function write(value, x, top, { font = normal, size = 10, color = ink, max = right - x, align = 'left' } = {}) {
    const text = fit(value, font, size, max);
    const left = align === 'right' ? x - font.widthOfTextAtSize(text, size) : x;
    page.drawText(text, { x: left, y: height - top - size, font, size, color });
  }
  function horizontal(top, dashed = false) {
    page.drawLine({ start: { x: body, y: height - top }, end: { x: right, y: height - top }, thickness: .7,
      color: rule, ...(dashed && { dashArray: [3, 3] }) });
  }
  function band(h, color = paper) { box(edge, cursor, width - edge * 2, h, color); }
  function ticketCap(top, h, color, position) {
    const radius = 10;
    const topCap = position === 'top';
    box(edge + radius, top, width - edge * 2 - radius * 2, h, color);
    box(edge, topCap ? top + radius : top, width - edge * 2, h - radius, color);
    for (const x of [edge+radius, width-edge-radius]) {
      page.drawCircle({ x, y: height - top - (topCap ? radius : h-radius), size: radius, color });
    }
  }

  function start(first) {
    page = pdf.addPage(PageSizes.A4);
    box(0, 0, width, height, white);
    const headerHeight = first ? 169 : 84;
    ticketCap(edge, headerHeight, wine, 'top');
    for (let x = body; x < right - 5; x += 11) box(x, 56, 5, 4, gold);
    if (first) {
      box(body, 69, 42, 32, paper);
      const ratio = Math.min(36 / logo.width, 27 / logo.height);
      page.drawImage(logo, { x: body + (42 - logo.width * ratio) / 2, y: height - 69 - (32 + logo.height * ratio) / 2, width: logo.width * ratio, height: logo.height * ratio });
      write('CineAstra', body + 51, 76, { font: bold, size: 13, color: paper });
      if (document.payment?.simulated) write('PAGAMENTO SIMULADO', right, 76, { font: bold, size: 9, color: gold, max: 145, align: 'right' });
      write('Comprovante de', body, 105, { font: display, size: 38, color: paper });
      write('compra', body, 142, { font: display, size: 38, color: paper });
      write('Pedido #' + document.orderId + (document.createdAt ? ' · ' + purchaseDate(document.createdAt) : ''), body, 185, { size: 10, color: paper, max: 275 });
      const status = purchaseDocumentStatus(document);
      const badgeWidth = Math.min(206, bold.widthOfTextAtSize(clean(status, bold), 9) + 22);
      box(right - badgeWidth, 172, badgeWidth, 20, gold);
      write(status, right - badgeWidth + 11, 176, { font: bold, size: 9, max: badgeWidth - 20 });
    } else {
      write('Comprovante de compra', body, 71, { font: display, size: 24, color: paper });
      write('Pedido #' + document.orderId, right, 97, { align: 'right', max: 260, size: 10, color: gold });
    }
    cursor = edge + headerHeight;
  }
  function space(h) { if (cursor + h > end) start(false); }

  start(true);
  const sessions = new Map();
  for (const item of document.items) {
    if (!item.session) continue;
    if (!sessions.has(item.session.id)) sessions.set(item.session.id, { ...item.session, title: item.name, seats: [] });
    if (item.seat) sessions.get(item.session.id).seats.push(item.seat);
  }
  for (const session of sessions.values()) {
    space(124);
    band(124);
    write(sessions.size === 1 ? 'Sua sessão' : 'Sessão', body, cursor + 13, { font: display, size: 19, color: wine });
    write(session.title, body, cursor + 34, { font: display, size: 28 });
    write([session.cinema, [session.city, session.state].filter(Boolean).join(', ')].filter(Boolean).join(' · '), body, cursor + 65, { font: bold, size: 11 });
    horizontal(cursor + 82, true);
    const facts = [
      ['Data e horário', purchaseSessionDate(session)],
      ['Sala', session.room],
      ['Assentos', session.seats.join(', ')],
      ['Situação', session.status === 'CANCELADA' ? 'Sessão cancelada' : null],
    ].filter(([, value]) => value);
    const column = (right - body) / Math.max(facts.length, 1);
    for (const [index, [label, value]] of facts.entries()) {
      const left = body + index * column;
      write(label, left, cursor + 88, { font: bold, size: 8, color: muted, max: column - 5 });
      write(value, left, cursor + 101, { font: bold, size: 10, max: column - 5 });
    }
    cursor += 124;
  }

  function tableHeading(continued) {
    band(48);
    write(continued ? 'Itens da compra · continuação' : 'Itens da compra', body, cursor + 10, { font: display, size: 20, color: wine });
    box(body, cursor + 33, right - body, 15, parchment);
    write('Item', body + 8, cursor + 35, { font: bold, size: 8, color: muted });
    write('Qtd.', right - 92, cursor + 35, { font: bold, size: 8, color: muted, max: 32, align: 'right' });
    write('Valor', right - 8, cursor + 35, { font: bold, size: 8, color: muted, max: 55, align: 'right' });
    cursor += 48;
  }
  space(78);
  tableHeading(false);
  if (!document.items.length) {
    band(30);
    write('Nenhum item registrado neste pedido.', body + 8, cursor + 8, { color: muted });
    cursor += 30;
  }
  for (const item of document.items) {
    if (cursor + 34 > end) { start(false); tableHeading(true); }
    band(34);
    const detail = item.seat ? 'Assento ' + item.seat : item.venue && ['INPUT','COMBO'].includes(item.kind) ? 'Retirada: ' + item.venue
      : ['RENTAL','PURCHASE'].includes(item.kind) ? (item.kind === 'RENTAL' ? 'Aluguel no Streaming' : 'Compra no Streaming') : null;
    write(purchaseItemLabel(item), body + 8, cursor + 5, { font: bold, max: right - body - 116 });
    if (detail) write(detail, body + 8, cursor + 19, { size: 8, color: muted, max: right - body - 116 });
    write(item.quantity, right - 96, cursor + 10, { align: 'right', max: 30 });
    write(purchaseMoney(item.subtotal), right - 8, cursor + 10, { align: 'right', max: 83 });
    horizontal(cursor + 33.5);
    cursor += 34;
  }

  space(196);
  band(100);
  write('Pagamento', body, cursor + 11, { font: bold, size: 11, color: wine });
  const method = purchasePaymentMethods[document.payment?.type];
  if (method) write(method + (document.payment.simulated ? ' simulado' : ''), body, cursor + 29, { size: 10, color: muted, max: 238 });
  else write(document.payment ? 'Método indisponível' : 'Aprovação não registrada', body, cursor + 29, { size: 10, color: muted });
  if (document.payment?.paidAt) write('Registrado em ' + purchaseDate(document.payment.paidAt), body, cursor + 43, { size: 9, color: muted, max: 238 });
  if (document.coupon) write('Cupom ' + document.coupon, body, cursor + 58, { size: 9, color: muted, max: 238 });
  const amountLeft = right - 196;
  if (document.discounts) {
    write('Subtotal antes dos descontos', amountLeft, cursor + 12, { size: 9, color: muted });
    write(purchaseMoney(document.discounts.subtotal), right, cursor + 12, { font: bold, size: 9, max: 100, align: 'right' });
    write('Descontos e benefícios', amountLeft, cursor + 27, { size: 9, color: muted });
    write('- ' + purchaseMoney(document.discounts.discount), right, cursor + 27, { font: bold, size: 9, max: 100, align: 'right' });
  }
  write(purchaseDocumentTotalLabel(document), amountLeft, cursor + 57, { font: bold, size: 10 });
  write(purchaseMoney(document.total), right, cursor + 47, { font: display, size: 30, color: wine, align: 'right', max: 130 });
  cursor += 100;

  ticketCap(cursor, 95, parchment, 'bottom');
  horizontal(cursor, true);
  for (const x of [edge, width-edge]) page.drawCircle({ x, y: height - cursor, size: 5, color: white });
  write('Verificar compra', body, cursor + 14, { font: display, size: 23, color: wine });
  write('Entre com a conta titular para consultar a compra e os ingressos.', body, cursor + 42, { size: 9, color: muted, max: right - body - 95 });
  write(document.reference, body, cursor + 57, { font: bold, size: 12, color: wine, max: right - body - 95 });
  const qr = qrcode(0, 'M');
  qr.addData(verificationUrl);
  qr.make();
  const qrWidth = 70;
  const qrLeft = right - qrWidth;
  box(qrLeft, cursor + 12, qrWidth, qrWidth, rgb(1, 1, 1));
  const cellWidth = qrWidth / (qr.getModuleCount() + 8);
  for (let row = 0; row < qr.getModuleCount(); row++) {
    for (let col = 0; col < qr.getModuleCount(); col++) {
      if (qr.isDark(row, col)) box(qrLeft + (col+4)*cellWidth, cursor + 12 + (row+4)*cellWidth, cellWidth, cellWidth, ink);
    }
  }
  const checkLink = pdf.context.register(pdf.context.obj({
    Type: 'Annot', Subtype: 'Link', Rect: [body, height - cursor - 82, right, height - cursor - 12],
    Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of(verificationUrl) },
  }));
  page.node.addAnnot(checkLink);
  for (const [index, sheet] of pdf.getPages().entries()) {
    page = sheet;
    const footer = index === pdf.getPageCount()-1 ? cursor + 108 : height - 40;
    write('Sem valor fiscal · Ingressos disponíveis em Minhas compras', edge, footer, { size: 8, color: muted });
    write((index+1) + ' / ' + pdf.getPageCount(), width-edge, footer, { size: 8, max: 40, align: 'right', color: muted });
  }
  return pdf.save();
}
