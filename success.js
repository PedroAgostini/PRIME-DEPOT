(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const money = (n) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* The checkout leaves the order in sessionStorage; the URL carries the number as a fallback */
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem('pd-last-order')); } catch (e) { order = null; }
  const urlRef = new URLSearchParams(location.search).get('order');
  const ref = (order && order.ref) || (urlRef && /^PD-\d{6}-[A-Z0-9]{5}$/.test(urlRef) ? urlRef : null);

  if (ref) {
    $('[data-os-ref]').textContent = ref;
    document.title = `Order ${ref} | Prime Depot`;
  } else {
    $('.os-ref').hidden = true;
  }

  if (order && order.ref === ref) {
    const first = String(order.name || '').trim().split(/\s+/)[0];
    if (first) $('[data-os-title]').textContent = `Thank you, ${first}!`;
    $('[data-os-items]').innerHTML = (order.items || []).map((i) => `
      <li class="co-item"><div class="co-item-main"><strong>${esc(i.qty)} × ${esc(i.name)}</strong><span>${money(i.price)} per ${esc(i.unit)}</span></div><div class="co-item-side"><b>${money(i.qty * i.price)}</b></div></li>`).join('');
    $('[data-os-total]').textContent = money(order.total || 0);
    $('[data-os-address]').textContent = [order.street, `${order.city || ''} ${order.zip || ''}`.trim()].filter(Boolean).join(', ');
    $('[data-os-date]').textContent = order.date
      ? new Date(`${order.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : 'First available';
    $('[data-os-payment]').textContent = order.payment || '';
    $('[data-os-contact]').textContent = [order.company, order.phone, order.email].filter(Boolean).join(' · ');
    const payCopy = {
      'Pay on delivery': 'Pay by check or card when the material arrives.',
      'Invoice for contractors': 'We set up invoice terms with you when we call.',
      'Secure card link': 'We text or email a secure payment link after confirming stock.',
    };
    if (payCopy[order.payment]) $('[data-os-pay-step]').textContent = payCopy[order.payment];
    $('[data-os-details]').hidden = false;
  }

  /* Copy order number */
  const toast = $('[data-toast]');
  const say = (msg) => { toast.textContent = msg; toast.classList.add('is-on'); setTimeout(() => toast.classList.remove('is-on'), 2400); };
  $('[data-os-copy]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(ref); say(`Copied ${ref}`); }
    catch (e) { say(`Your order number is ${ref}`); }
  });
  $('[data-os-print]').addEventListener('click', () => window.print());

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
