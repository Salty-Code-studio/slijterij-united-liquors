/* ============================================
   ON-SITE CHAT ASSISTANT
   --------------------------------------------
   A lightweight, no-backend helper that answers
   the shop's most common questions inline and
   escalates to a human on WhatsApp when it can't.

   - Knowledge sourced from the FAQ + business facts.
   - Bilingual (EN / NL) via window.SLU_i18n.
   - Keyword matching (no AI / no network).
   ============================================ */

(() => {
  const WA_NUMBER = '31651240045'; // WhatsApp Business: +31 6 51 24 00 45

  /* ---- Knowledge base ---------------------------------------------------
     Each topic carries a bilingual chip label, a bilingual answer, and a set
     of keywords (both languages) used to match free-text questions. ------- */
  const KB = [
    {
      id: 'delivery',
      chip:    { en: 'Do you deliver?',        nl: 'Bezorgen jullie?' },
      keywords:['deliver','delivery','bezorg','bezorgen','thuisbezorg','bring','ship','order online','online bestellen'],
      answer:  {
        en: "Yes — we deliver across central Amsterdam via Thuisbezorgd, the same hours as the shop (11:00–22:00). iDEAL is accepted at checkout.",
        nl: "Ja — we bezorgen in centrum Amsterdam via Thuisbezorgd, dezelfde tijden als de winkel (11:00–22:00). iDEAL wordt geaccepteerd bij het afrekenen."
      }
    },
    {
      id: 'payment',
      chip:    { en: 'Payment methods',        nl: 'Betaalmethoden' },
      keywords:['pay','payment','card','cash','pin','ideal','contactless','betaal','betalen','pinnen','contant','creditcard'],
      answer:  {
        en: "In the shop: cash, contactless, and PIN. Online via Thuisbezorgd: iDEAL.",
        nl: "In de winkel: contant, contactloos en PIN. Online via Thuisbezorgd: iDEAL."
      }
    },
    {
      id: 'hours',
      chip:    { en: 'Opening hours',          nl: 'Openingstijden' },
      keywords:['hour','hours','open','close','closing','time','today','when','openingstijd','openingstijden','geopend','dicht','sluit','wanneer','laat'],
      answer:  {
        en: "We're open every day, 11:00–22:00 — including weekends.",
        nl: "We zijn elke dag open, 11:00–22:00 — ook in het weekend."
      }
    },
    {
      id: 'location',
      chip:    { en: 'Where are you?',         nl: 'Waar zijn jullie?' },
      keywords:['where','location','address','find','centraal','station','metro','walk','directions','here','adres','waar','locatie','vinden','lopen','route'],
      answer:  {
        en: "Hekelveld 4, 1012 SN Amsterdam — about 2 minutes from Centraal. Take the Westside exit and walk straight. There's a map on our Visit page (/slijterij-united-liquors/visit/).",
        nl: "Hekelveld 4, 1012 SN Amsterdam — ongeveer 2 minuten van Centraal. Neem de Westzijde-uitgang en loop rechtdoor. Er staat een kaart op onze Bezoek-pagina (/slijterij-united-liquors/visit/)."
      }
    },
    {
      id: 'age',
      chip:    { en: 'Minimum age?',           nl: 'Minimumleeftijd?' },
      keywords:['age','old','18','minimum','id','identification','young','leeftijd','jaar','legitimatie','ouder'],
      answer:  {
        en: "18+ for alcohol — both in store and on delivery. We do check ID.",
        nl: "18+ voor alcohol — zowel in de winkel als bij bezorging. We controleren ID."
      }
    },
    {
      id: 'bottle',
      chip:    { en: 'Find a specific bottle',  nl: 'Specifieke fles zoeken' },
      keywords:['bottle','whisky','whiskey','vodka','gin','rum','tequila','cognac','jenever','champagne','wine','beer','specific','brand','stock','have','carry','fles','merk','assortiment','hebben','voorraad'],
      answer:  {
        en: "Most likely yes — our assortment is broad (whisky, vodka, gin, rum, tequila, cognac, jenever, wines, champagne, beer and more). Tell me what you're after and I'll connect you with the team to confirm.",
        nl: "Waarschijnlijk wel — ons assortiment is breed (whisky, vodka, gin, rum, tequila, cognac, jenever, wijnen, champagne, bier en meer). Vertel me wat je zoekt, dan verbind ik je met het team om het te bevestigen."
      }
    },
    {
      id: 'party',
      chip:    { en: 'Party / event packs',     nl: 'Party- / event-pakketten' },
      keywords:['party','event','wedding','catering','bulk','quantity','crate','feest','evenement','bruiloft','grote','hoeveelheid','krat'],
      answer:  {
        en: "Yes — tell us your headcount and the vibe and we'll suggest a setup: beer, spirits, mixers and cups, the lot. Easiest to arrange over WhatsApp or by phone.",
        nl: "Ja — geef je gastenaantal en de sfeer door, dan stellen we een setup voor: bier, sterke drank, mixers en cups, alles. Het makkelijkst via WhatsApp of telefoon."
      }
    },
    {
      id: 'nonalc',
      chip:    { en: 'Alcohol-free options',    nl: 'Alcoholvrije opties' },
      keywords:['alcohol-free','alcohol free','non-alc','nonalcoholic','0.0','zero','soft','mixer','alcoholvrij','frisdrank','zonder alcohol'],
      answer:  {
        en: "Yes — alcohol-free beer, 0.0 spirits, soft drinks, mixers and a small non-alc selection.",
        nl: "Ja — alcoholvrij bier, 0.0 sterke drank, frisdrank, mixers en een kleine alcoholvrije selectie."
      }
    },
    {
      id: 'holidays',
      chip:    { en: 'Open on holidays?',       nl: 'Open op feestdagen?' },
      keywords:['holiday','holidays','christmas','kings day','new year','feestdag','feestdagen','kerst','koningsdag','oud en nieuw'],
      answer:  {
        en: "Most days, yes. On major holidays (King's Day, Christmas Day) it's best to message us first to be sure.",
        nl: "Meestal wel. Op grote feestdagen (Koningsdag, Eerste Kerstdag) kun je ons het beste even vooraf berichten."
      }
    }
  ];

  const T = {
    greeting: {
      en: "Hi! 👋 I'm the Slijterij assistant. Ask me anything below, or tap a question. If you'd rather talk to a person, I'll hand you over on WhatsApp.",
      nl: "Hoi! 👋 Ik ben de Slijterij-assistent. Stel hieronder je vraag of tik op een vraag. Liever iemand spreken? Dan verbind ik je via WhatsApp."
    },
    fallback: {
      en: "Good question — I'm not sure about that one. The team can answer fastest on WhatsApp 👇",
      nl: "Goede vraag — dat weet ik niet zeker. Het team helpt je het snelst via WhatsApp 👇"
    },
    morehelp: {
      en: "Anything else? Tap a question, or chat with the team on WhatsApp.",
      nl: "Nog iets anders? Tik op een vraag, of chat met het team via WhatsApp."
    }
  };

  const lang = () => (window.SLU_i18n ? window.SLU_i18n.getLang() : 'en');

  /* ---- DOM refs ---------------------------------------------------------- */
  const fab    = document.getElementById('chat-fab');
  const panel  = document.getElementById('chat-panel');
  const closeB = document.getElementById('chat-close');
  const logEl  = document.getElementById('chat-log');
  const chipEl = document.getElementById('chat-chips');
  const form   = document.getElementById('chat-form');
  const input  = document.getElementById('chat-text');
  const human  = document.getElementById('chat-human');
  if (!fab || !panel) return;

  let started = false;
  let chipsHidden = false;

  // Once the visitor sends their first message, drop the suggestion chips
  // for a cleaner conversation view.
  function hideChips() {
    if (chipsHidden || !chipEl) return;
    chipsHidden = true;
    chipEl.classList.add('is-hidden');
    setTimeout(() => { chipEl.innerHTML = ''; }, 260);
  }

  /* ---- Rendering --------------------------------------------------------- */
  function scrollDown() { logEl.scrollTop = logEl.scrollHeight; }

  function addMsg(who, text) {
    const row = document.createElement('div');
    row.className = 'chat-msg chat-msg--' + who;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    logEl.appendChild(row);
    scrollDown();
    return row;
  }

  function addTyping() {
    const row = document.createElement('div');
    row.className = 'chat-msg chat-msg--bot';
    row.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
    logEl.appendChild(row);
    scrollDown();
    return row;
  }

  // Bot replies with a brief "typing" beat for a human feel.
  function botSay(text, after) {
    const t = addTyping();
    const delay = Math.min(900, 350 + text.length * 6);
    setTimeout(() => {
      t.remove();
      addMsg('bot', text);
      if (typeof after === 'function') after();
    }, delay);
  }

  function renderChips() {
    chipEl.innerHTML = '';
    KB.forEach((topic) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = topic.chip[lang()];
      b.addEventListener('click', () => handleTopic(topic, topic.chip[lang()]));
      chipEl.appendChild(b);
    });
  }

  /* ---- Matching ---------------------------------------------------------- */
  function matchTopic(raw) {
    const q = ' ' + raw.toLowerCase().normalize('NFKD').replace(/[^\w\s.+-]/g, ' ') + ' ';
    let best = null, bestScore = 0;
    KB.forEach((topic) => {
      let score = 0;
      topic.keywords.forEach((kw) => {
        if (q.includes(' ' + kw) || q.includes(kw + ' ') || q.includes(' ' + kw + ' ')) score++;
      });
      if (score > bestScore) { bestScore = score; best = topic; }
    });
    return bestScore > 0 ? best : null;
  }

  function handleTopic(topic, echo) {
    addMsg('user', echo);
    hideChips();
    botSay(topic.answer[lang()], () => botSay(T.morehelp[lang()]));
    flashHuman();
  }

  function handleFreeText(text) {
    addMsg('user', text);
    hideChips();
    const topic = matchTopic(text);
    if (topic) {
      botSay(topic.answer[lang()], () => botSay(T.morehelp[lang()]));
    } else {
      botSay(T.fallback[lang()], flashHuman);
      // Prefill the WhatsApp message with what the visitor typed.
      const msg = encodeURIComponent('Hi Slijterij United Liquors — ' + text);
      human.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    }
  }

  function flashHuman() {
    human.classList.remove('is-flash');
    // reflow to restart the animation
    void human.offsetWidth;
    human.classList.add('is-flash');
  }

  /* ---- Open / close ------------------------------------------------------ */
  function open() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-open'));
    fab.classList.add('is-active');
    fab.setAttribute('aria-expanded', 'true');
    if (!started) {
      started = true;
      renderChips();
      botSay(T.greeting[lang()]);
    }
    setTimeout(() => input && input.focus(), 200);
  }

  function close() {
    panel.classList.remove('is-open');
    fab.classList.remove('is-active');
    fab.setAttribute('aria-expanded', 'false');
    setTimeout(() => { panel.hidden = true; }, 260);
  }

  fab.addEventListener('click', () => (fab.classList.contains('is-active') ? close() : open()));
  closeB.addEventListener('click', close);

  // Any element with [data-open-chat] (e.g. the nav "Contact" link) opens the chat.
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-chat]');
    if (trigger) { e.preventDefault(); if (!fab.classList.contains('is-active')) open(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fab.classList.contains('is-active')) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    handleFreeText(text);
  });

  // Re-label chips when the language toggles mid-conversation (unless they're
  // already dismissed after the first message).
  window.addEventListener('langchange', () => { if (started && !chipsHidden) renderChips(); });
})();
