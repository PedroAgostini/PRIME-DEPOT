(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const root = document.documentElement;

  /* Preloader: CSS runs the animation; here we only release scrolling and remember it for the session */
  if (root.classList.contains('is-loading')) {
    setTimeout(() => {
      root.classList.remove('is-loading');
      $('[data-loader]')?.remove();
      try { sessionStorage.setItem('pd-loader', '1'); } catch (e) { /* private mode: loader shows again, harmless */ }
    }, 2900);
  }

  /* Header turns solid once the hero starts to scroll away */
  const header = $('[data-header]');
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(sentinel);

  /* Phones: the sticky call/quote bar shows whenever the hero buttons are off screen
     (below the fold on load, or scrolled past), so the same two buttons never appear twice */
  const heroCtas = $('.hero-ctas');
  if (heroCtas) {
    new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('show-bar', entry.intersectionRatio < 0.5);
    }, { threshold: [0, 0.5, 1] }).observe(heroCtas);
  }

  /* Section headings rise out of their mask as they enter */
  root.classList.add('io');
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealIO.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.reveal').forEach((el) => revealIO.observe(el));

  /* We sell. You build. We deliver.: a pinned stage driven by scroll progress.
     The rAF loop runs only while the section is on screen (no scroll listener). */
  const why = $('[data-why]');
  if (why) {
    const words = $$('[data-word]', why);
    const cards = $$('[data-card]', why);
    const rail = $('[data-rail]', why);
    const wide = matchMedia('(min-width: 901px)');
    let raf = 0, last = -1;
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = why.getBoundingClientRect();
      const span = r.height - innerHeight;
      const p = span > 0 ? clamp(-r.top / span) : 1;
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      const steps = p * words.length;
      const active = Math.min(Math.floor(steps), words.length - 1);
      words.forEach((w, i) => {
        w.style.setProperty('--f', clamp(steps - i).toFixed(3));
        w.classList.toggle('is-on', i === active);
      });
      cards.forEach((c, i) => {
        c.classList.toggle('is-on', i === active);
        c.classList.toggle('is-past', i < active);
      });
      if (rail) rail.style.transform = `scaleY(${p.toFixed(3)})`;
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const setAll = () => {
      stop();
      words.forEach((w) => { w.style.setProperty('--f', 1); w.classList.add('is-on'); });
      cards.forEach((c) => c.classList.add('is-on'));
    };
    new IntersectionObserver(([entry]) => {
      if (!wide.matches) return setAll();
      if (entry.isIntersecting && !raf) { last = -1; frame(); }
      else if (!entry.isIntersecting) stop();
    }).observe(why);
    wide.addEventListener('change', () => { if (!wide.matches) setAll(); else { last = -1; if (!raf) frame(); } });
    if (!wide.matches) setAll();
  }

  /* Hero topo canvas: tilt follows the pointer (fine pointers only, paused off-screen) */
  const topo = $('[data-topo]');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (topo && fine && !still) {
    const layers = $$('[data-layer]', topo);
    let tx = 0, ty = 0, frame = 0, active = true;
    const draw = () => {
      frame = 0;
      topo.style.transform = `rotateX(${55 + ty / 2}deg) rotateZ(${-25 + tx / 2}deg)`;
      layers.forEach((layer, i) => {
        const depth = (i + 1) * 15;
        layer.style.transform = `translateZ(${depth}px) translate(${tx * (i + 1) * 0.2}px, ${ty * (i + 1) * 0.2}px)`;
      });
    };
    window.addEventListener('pointermove', (e) => {
      if (!active) return;
      tx = (innerWidth / 2 - e.clientX) / 25;
      ty = (innerHeight / 2 - e.clientY) / 25;
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });
    new IntersectionObserver(([entry]) => { active = entry.isIntersecting; }).observe($('.hero'));
  }

  /* Fact cards count up once when they come into view */
  const counters = $$('[data-count]');
  if (counters.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const run = (el) => {
      const to = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    };
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        countIO.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  }

  /* Mobile nav */
  const toggle = $('[data-nav-toggle]');
  const nav = $('#nav');
  const setNav = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setNav(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  /* Product filter */
  const chips = $$('[data-filter]');
  const products = $$('[data-grid] .product');
  const applyFilter = (value) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === value)));
    products.forEach((p) => { p.hidden = value !== 'all' && p.dataset.cat !== value; });
  };
  chips.forEach((chip) => chip.addEventListener('click', () => applyFilter(chip.dataset.filter)));

  /* Footer links jump to a card: make sure it is not filtered out */
  window.addEventListener('hashchange', () => {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('product') && target.hidden) applyFilter('all');
  });

  /* "Add to Quote" on a card adds that product to the cut list */
  const list = $('#f-list');
  $$('[data-product]').forEach((btn) => btn.addEventListener('click', () => {
    if (!list.value.includes(btn.dataset.product)) {
      const line = `${btn.dataset.product}: qty `;
      list.value = list.value ? `${list.value.trimEnd()}\n${line}` : line;
    }
  }));

  /* Before / after */
  const ba = $('[data-ba]');
  const range = $('[data-ba-range]');
  if (ba && range) {
    const set = () => ba.style.setProperty('--pos', `${range.value}%`);
    range.addEventListener('input', set);
    set();
  }

  /* ============ Quote cart ============
     Stored in this visitor's browser only (localStorage), so the list survives a reload. */
  const CART_KEY = 'pd-quote-cart';
  const loadCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; } };
  let cart = loadCart();
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage blocked: cart lives for this page view */ } };
  const money = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const clampQty = (v) => Math.min(Math.max(parseInt(v, 10) || 1, 1), 9999);
  const cartItems = () => Object.values(cart);
  const cartCount = () => cartItems().reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => cartItems().reduce((s, i) => s + i.qty * i.price, 0);
  const cartLines = () => cartItems().map((i) => `${i.qty} × ${i.name} (${money(i.price)} per ${i.unit})`);

  const dialog = $('#cart');
  const toast = $('[data-toast]');
  let toastTimer = 0;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
  };

  const qtyControl = (sku, qty) => `
      <div class="qty qty-sm">
        <button type="button" data-cart-step="-1" data-sku="${sku}" aria-label="Decrease">${$('[data-step="-1"]').innerHTML}</button>
        <input type="number" min="1" max="9999" value="${qty}" inputmode="numeric" data-cart-qty data-sku="${sku}" aria-label="Quantity">
        <button type="button" data-cart-step="1" data-sku="${sku}" aria-label="Increase">${$('[data-step="1"]').innerHTML}</button>
      </div>`;

  const renderCart = () => {
    const items = cartItems();
    const count = cartCount();
    $$('[data-cart-count]').forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    $$('.cart-btn').forEach((b) => b.setAttribute('aria-label', `Open quote list, ${count} item${count === 1 ? '' : 's'}`));

    $('[data-cart-items]').innerHTML = items.map((i) => `
      <li class="cart-item">
        <div class="ci-main"><strong>${i.name}</strong><span>${money(i.price)} per ${i.unit}</span></div>
        ${qtyControl(i.sku, i.qty)}
        <div class="ci-side"><b>${money(i.qty * i.price)}</b><button type="button" class="ci-remove" data-cart-remove="${i.sku}" aria-label="Remove ${i.name}">Remove</button></div>
      </li>`).join('');
    $('[data-cart-empty]').hidden = items.length > 0;
    $('[data-cart-foot]').hidden = items.length === 0;
    $('[data-cart-total]').textContent = money(cartTotal());

    // Summary inside the quote form
    $('[data-fc-items]').innerHTML = items.map((i) => `<li><span>${i.qty} ×</span> ${i.name}<b>${money(i.qty * i.price)}</b></li>`).join('');
    $('[data-fc-empty]').hidden = items.length > 0;
    const fcTotal = $('[data-fc-total]');
    fcTotal.hidden = items.length === 0;
    fcTotal.innerHTML = `Estimated total <b>${money(cartTotal())}</b>`;
    const listField = $('#f-list');
    listField.required = items.length === 0;
    $('[data-list-opt]').hidden = items.length === 0;
    if (items.length) listField.closest('.field').classList.remove('has-error');
  };

  const setQty = (sku, qty) => {
    if (!cart[sku]) return;
    cart[sku].qty = clampQty(qty);
    saveCart();
    renderCart();
  };

  // Catalog cards: stepper + add
  $$('.product[data-sku]').forEach((card) => {
    const input = $('.qty input', card);
    $$('[data-step]', card).forEach((b) => b.addEventListener('click', () => {
      input.value = clampQty(Number(input.value) + Number(b.dataset.step));
    }));
    input.addEventListener('change', () => { input.value = clampQty(input.value); });
    $('[data-add]', card).addEventListener('click', () => {
      const { sku, name, price, unit } = card.dataset;
      const qty = clampQty(input.value);
      cart[sku] = cart[sku] ? { ...cart[sku], qty: clampQty(cart[sku].qty + qty) } : { sku, name, price: Number(price), unit, qty };
      saveCart();
      renderCart();
      input.value = 1;
      showToast(`Added ${qty} × ${name} to your quote list`);
      $$('.cart-btn').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    });
  });

  // Drawer
  const openCart = () => { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); };
  const closeCart = () => { if (dialog.open) dialog.close(); };
  $$('[data-cart-open]').forEach((b) => b.addEventListener('click', openCart));
  $$('[data-cart-close]').forEach((b) => b.addEventListener('click', closeCart));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeCart(); });
  dialog.addEventListener('click', (e) => {
    const step = e.target.closest('[data-cart-step]');
    if (step) setQty(step.dataset.sku, cart[step.dataset.sku].qty + Number(step.dataset.cartStep));
    const rm = e.target.closest('[data-cart-remove]');
    if (rm) { delete cart[rm.dataset.cartRemove]; saveCart(); renderCart(); }
  });
  dialog.addEventListener('change', (e) => {
    if (e.target.matches('[data-cart-qty]')) setQty(e.target.dataset.sku, e.target.value);
  });
  $('[data-cart-clear]').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); });
  $('[data-cart-checkout]').addEventListener('click', () => {
    closeCart();
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 700);
  });
  renderCart();

  /* Exit intent: every time the pointer leaves through the top of the window with items in the list (desktop only). */
  const exitDlg = $('#exit');

  const openExit = () => {
    const count = cartCount();
    $('[data-exit-count]').textContent = count;
    $('[data-exit-items]').textContent = `${count} piece${count === 1 ? '' : 's'}`;
    $('[data-exit-total]').textContent = money(cartTotal());
    $('[data-exit-list]').innerHTML = cartItems().slice(0, 3).map((i) => `<li><span>${i.qty} ×</span> ${i.name}</li>`).join('')
      + (cartItems().length > 3 ? `<li class="exit-more">+ ${cartItems().length - 3} more</li>` : '');
    if (typeof exitDlg.showModal === 'function') exitDlg.showModal(); else exitDlg.setAttribute('open', '');
  };
  let exitClosedAt = 0;
  const closeExit = () => { exitClosedAt = Date.now(); if (exitDlg.open) exitDlg.close(); };
  exitDlg.addEventListener('close', () => { exitClosedAt = Date.now(); });

  if (exitDlg && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    /* A fast flick toward the tabs is sampled only a few times, so the last position the
       page sees can be far below the top edge. Track the direction of travel and accept a
       window exit near the top while the pointer is heading up. */
    let headingUp = false;
    document.addEventListener('mousemove', (e) => { if (e.movementY) headingUp = e.movementY < 0; }, { passive: true });
    document.addEventListener('mouseout', (e) => {
      if (e.relatedTarget) return; // still inside the page
      const nearTop = e.clientY <= 0 || (headingUp && e.clientY < Math.min(200, innerHeight * 0.3));
      if (!nearTop) return;
      if (!cartItems().length || dialog.open || exitDlg.open) return;
      if (Date.now() - exitClosedAt < 1500) return; // just dismissed: do not bounce straight back
      openExit();
    });
  }
  $$('[data-exit-close]').forEach((b) => b.addEventListener('click', closeExit));
  exitDlg.addEventListener('click', (e) => { if (e.target === exitDlg) closeExit(); });
  $('[data-exit-go]').addEventListener('click', () => {
    closeExit();
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 700);
  });

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

  /* Quote form */
  const form = $('[data-quote-form]');
  const status = $('[data-status]');
  const submit = $('[data-submit]');
  const emailOk = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const phoneOk = (v) => !v || v.replace(/\D/g, '').length === 10;

  /* Input masks: US phone "(617) 380-8387"; ZIP "02136" or "02136-1234".
     The town field also accepts a town name, so it is only masked when it starts with a digit. */
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
  const bindMask = (input, mask, when = () => true) => {
    if (!input) return;
    input.addEventListener('input', (e) => {
      if ((e.inputType && e.inputType.startsWith('delete')) || !when(input.value)) return;
      input.value = mask(input.value);
    });
    input.addEventListener('blur', () => { if (when(input.value)) input.value = mask(input.value); });
  };
  bindMask($('#f-phone'), maskPhone);
  bindMask($('#f-town'), maskZip, (v) => /^\d/.test(v.trim()));

  const validate = () => {
    let first = null;
    $$('.field', form).forEach((field) => {
      const input = $('input, textarea, select', field);
      if (!input) return;
      const value = input.value.trim();
      const bad = (input.required && !value) || (input.type === 'email' && !emailOk(value))
        || (input.type === 'tel' && !phoneOk(value));
      field.classList.toggle('has-error', bad);
      input.setAttribute('aria-invalid', String(bad));
      const err = document.getElementById(`${input.id}-err`);
      if (err) input.setAttribute('aria-describedby', err.id);
      if (bad && !first) first = input;
    });
    return first;
  };

  $$('input, textarea', form).forEach((input) => input.addEventListener('input', () => {
    if (input.closest('.field').classList.contains('has-error')) validate();
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    const first = validate();
    if (first) {
      first.focus();
      status.classList.add('is-error');
      status.textContent = 'Check the highlighted fields.';
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const ref = newOrderRef();
    const endpoint = form.dataset.endpoint;

    if (!endpoint) {
      // No form service configured yet: hand off to the visitor's email app.
      const lines = [
        `Request ${ref}`,
        '',
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : null,
        `I am a: ${data.role}`,
        `Delivery: ${data.town}`,
        data.date ? `Preferred date: ${data.date}` : null,
        '',
        cartItems().length ? 'Quote list:' : null,
        ...cartLines(),
        cartItems().length ? `Estimated total (published prices): ${money(cartTotal())}` : null,
        cartItems().length ? '' : null,
        data.list ? 'Cut list / notes:' : null,
        data.list || null,
      ].filter((l) => l !== null);
      const subject = encodeURIComponent(`Quote request ${ref} - ${data.name}`);
      location.href = `mailto:${form.dataset.mailto}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
      status.classList.add('is-ok');
      status.textContent = `Request ${ref}: your email app should open with it ready to send. No email app? Call (617) 380-8387 and mention ${ref}.`;
      return;
    }

    submit.setAttribute('aria-busy', 'true');
    submit.disabled = true;
    submit.textContent = 'Sending…';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ref,
          items: cartItems().map(({ name, qty, price, unit }) => ({ name, qty, price, unit })),
          estimatedTotal: cartTotal(),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      cart = {};
      saveCart();
      renderCart();
      status.classList.add('is-ok');
      status.textContent = `Got it. Your request number is ${ref}. We will call you back today with price and delivery.`;
    } catch {
      status.classList.add('is-error');
      status.textContent = 'That did not go through. Try again, or call (617) 380-8387.';
    } finally {
      submit.removeAttribute('aria-busy');
      submit.disabled = false;
      submit.textContent = 'Send My Quote Request';
    }
  });

  /* Footer year */
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
