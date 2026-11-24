export async function copyText(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error('Nada para copiar.');
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // A seleção temporária também atende navegadores em uma rede local HTTP.
    }
  }
  const active = document.activeElement;
  const selection = document.getSelection();
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index)) : [];
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none';
  (active?.closest('[role="dialog"]') ?? document.body).append(field);
  try {
    field.focus({ preventScroll: true });
    field.select();
    if (!document.execCommand('copy')) throw new Error('Não foi possível copiar.');
  } finally {
    field.remove();
    active?.focus?.({ preventScroll: true });
    selection?.removeAllRanges();
    for (const range of ranges) selection?.addRange(range);
  }
}
