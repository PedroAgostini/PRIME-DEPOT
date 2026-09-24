(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* Same cart as the home page (localStorage, this visitor's browser only) */
  const CART_KEY = 'pd-quote-cart';
  const load = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } };
  let cart = load();
  const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked */ } };
  const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const clampQty = (v) => Math.min(Math.max(parseInt(v, 10) || 1, 1), 9999);
  const items = () => Object.values(cart);
  const total = () => items().reduce((s, i) => s + i.qty * i.price, 0);
  const minus = $('[data-icon-minus]').innerHTML;
  const plus = $('[data-icon-plus]').innerHTML;

  /* Order number: PD-YYMMDD-XXXXX. Date makes it easy to find; 5 crypto-random chars
     (no look-alike letters) give ~33M combinations per day, and numbers already issued
     on this device are remembered so they never repeat here. */
  const newOrderRef = () => {
    const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    const d = new Date();
    const date = String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    let used = [];
    try { used = JSON.parse(localStorage.getItem('pd-order-refs')) || []; } catch (e) { used = []; }
    let ref;
    do {
      const bytes = new Uint8Array(5);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      ref = `PD-${date}-${[...bytes].map((b) => ALPHA[b % ALPHA.length]).join('')}`;
    } while (used.includes(ref));
    used.push(ref);
    try { localStorage.setItem('pd-order-refs', JSON.stringify(used.slice(-200))); } catch (e) { /* storage blocked */ }
    return ref;
  };

  const render = () => {
    const list = items();
    $('[data-co-empty]').hidden = list.length > 0;
    $('[data-co-grid]').hidden = list.length === 0;
    $('[data-co-items]').innerHTML = list.map((i) => `
      <li class="co-item">
        <div class="co-item-main"><strong>${i.name}</strong><span>${money(i.price)} per ${i.unit}</span></div>
        <div class="qty qty-sm">
          <button type="button" data-step="-1" data-sku="${i.sku}" aria-label="Decrease ${i.name}">${minus}</button>
          <input type="number" min="1" max="9999" value="${i.qty}" inputmode="numeric" data-qty data-sku="${i.sku}" aria-label="Quantity of ${i.name}">
          <button type="button" data-step="1" data-sku="${i.sku}" aria-label="Increase ${i.name}">${plus}</button>
        </div>
        <div class="co-item-side"><b>${money(i.qty * i.price)}</b><button type="button" class="co-remove" data-remove="${i.sku}" aria-label="Remove ${i.name}">Remove</button></div>
      </li>`).join('');
    $('[data-co-subtotal]').textContent = money(total());
    $('[data-co-total]').textContent = money(total());
    // Keep the total next to the final button (the summary is far above it on phones)
    $('[data-co-submit]').dataset.total = money(total());
  };

  const summary = $('[data-co-items]');
  summary.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) { const it = cart[step.dataset.sku]; it.qty = clampQty(it.qty + Number(step.dataset.step)); save(); render(); }
    const rm = e.target.closest('[data-remove]');
    if (rm) { delete cart[rm.dataset.remove]; save(); render(); }
  });
  summary.addEventListener('change', (e) => {
    if (!e.target.matches('[data-qty]')) return;
    cart[e.target.dataset.sku].qty = clampQty(e.target.value); save(); render();
  });

  /* Validation */
  const form = $('[data-co-form]');
  const status = $('[data-co-status]');
  const submit = $('[data-co-submit]');
  const checks = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    zip: (v) => /^\d{5}(-\d{4})?$/.test(v),
    phone: (v) => v.replace(/\D/g, '').length === 10,
  };

  /* Input masks: US phone "(617) 380-8387"; ZIP "02136" or "02136-1234" */
  const maskPhone = (v) => {
    // US area codes never start with 0 or 1, so a leading 1 is the country code
    const d = v.replace(/\D/g, '').replace(/^[01]+/, '').slice(0, 10);
    if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return d.length ? `(${d}` : '';
  };
  const maskZip = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 9);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };
  [[$('#c-phone'), maskPhone], [$('#c-zip'), maskZip]].forEach(([input, mask]) => {
    if (!input) return;
    input.addEventListener('input', (e) => {
      if (e.inputType && e.inputType.startsWith('delete')) return;
      input.value = mask(input.value);
    });
    input.addEventListener('blur', () => { input.value = mask(input.value); });
  });
  const validate = () => {
    let first = null;
    $$('.field', form).forEach((field) => {
      const input = $('input, textarea, select', field);
      if (!input || !input.required) return;
      const v = input.value.trim();
      const bad = !v || (checks[input.name] && !checks[input.name](v));
      field.classList.toggle('has-error', bad);
      input.setAttribute('aria-invalid', String(bad));
      const err = document.getElementById(`${input.id}-err`);
      if (err) input.setAttribute('aria-describedby', err.id);
      if (bad && !first) first = input;
    });
    return first;
  };
  $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => {
    if (i.closest('.field')?.classList.contains('has-error')) validate();
  }));

  const showDone = (ref) => {
    $('[data-co-ref]').textContent = ref;
    $('[data-co-done-items]').innerHTML = items().map((i) => `<li class="co-item"><div class="co-item-main"><strong>${i.qty} × ${i.name}</strong></div><div class="co-item-side"><b>${money(i.qty * i.price)}</b></div></li>`).join('');
    $('[data-co-done-total]').textContent = money(total());
    $('[data-co-grid]').hidden = true;
    $('.co-title').hidden = true;
    const done = $('[data-co-done]');
    done.hidden = false;
    done.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    if (!items().length) return render();
    const first = validate();
    if (first) {
      first.focus();
      status.classList.add('is-error');
      status.textContent = 'Check the highlighted fields.';
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const ref = newOrderRef();
    const lines = [
      `Order ${ref}`,
      '',
      `Name: ${data.name}`,
      data.company ? `Company: ${data.company}` : null,
      `Phone: ${data.phone}`,
      `Email: ${data.email}`,
      `I am a: ${data.role}`,
      '',
      `Deliver to: ${data.street}, ${data.city} ${data.zip}`,
      data.date ? `Preferred date: ${data.date}` : null,
      data.notes ? `Notes: ${data.notes}` : null,
      `Payment: ${data.payment}`,
      '',
      'Items:',
      ...items().map((i) => `${i.qty} × ${i.name} (${money(i.price)} per ${i.unit}) = ${money(i.qty * i.price)}`),
      `Estimated total: ${money(total())}`,
    ].filter((l) => l !== null);

    // Hand the order to the success page, then empty the cart
    const goToSuccess = () => {
      try {
        sessionStorage.setItem('pd-last-order', JSON.stringify({
          ...data, ref,
          items: items().map(({ name, qty, price, unit }) => ({ name, qty, price, unit })),
          total: total(),
        }));
      } catch (e) { /* storage blocked: the success page still shows the number from the URL */ }
      cart = {};
      save();
      location.href = `order-success.html?order=${encodeURIComponent(ref)}`;
    };

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      // No order service connected yet: open the visitor's email app with the order, then show the success page.
      const a = document.createElement('a');
      a.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(`New order ${ref} - ${data.name}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
      a.click();
      setTimeout(goToSuccess, 700);
      return;
    }

    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    submit.textContent = 'Placing order…';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ref, items: items(), estimatedTotal: total() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      goToSuccess();
    } catch {
      status.classList.add('is-error');
      status.textContent = 'That did not go through. Try again, or call (617) 380-8387.';
    } finally {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      submit.textContent = 'Place Order';
    }
  });

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
  render();
})();
