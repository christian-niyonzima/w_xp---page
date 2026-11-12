/* "Office" apps:
 *   - Résumé: one clean, printable document built from js/data.js (WordPad-style window).
 *     Printing the site from anywhere, Ctrl+P included, prints this résumé.
 *   - New Message: an Outlook Express-style composer that hands a ready-made e-mail to the
 *     visitor's own mail program (mailto:, so no server and nothing stored). */
(function () {
  const XP = (window.XP = window.XP || {});
  const P = window.PROFILE;
  const A = P.about || {};
  const esc = XP.esc;
  const icon = (n, s) => XP.icon(n, s);
  const range = (a, b) => [a, b].filter(Boolean).join(' – ');
  const bare = (url) => String(url).replace(/^mailto:|^https?:\/\/(www\.)?/g, '').replace(/\/$/, '');

  /* ==================================================================
   * Résumé
   * ================================================================== */
  function resumeHTML() {
    const email = XP.email();
    const site = XP.siteUrl();
    const links = XP.links().filter((l) => !/^mailto:/i.test(l.url) && l.id !== 'resume' && !l.hideOnResume);
    const contact = [
      XP.real(P.location) && esc(P.location),
      email && `<a href="mailto:${esc(email)}">${esc(email)}</a>`,
      ...links.map((l) => `<a href="${esc(l.url)}">${esc(bare(l.url))}</a>`),
    ].filter(Boolean);
    const list = (arr) => (arr && arr.length ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
    const tech = (arr) => (arr && arr.length ? `<p class="cv-tech">${esc(arr.join(' · '))}</p>` : '');
    const sec = (title, body) => (body ? `<section class="cv-sec"><h2>${title}</h2>${body}</section>` : '');
    const entry = (title, where, date, body) =>
      `<div class="cv-entry"><div class="cv-row"><h3>${title}</h3>${date ? `<span class="cv-date">${esc(date)}</span>` : ''}</div>${
        where ? `<p class="cv-where">${esc(where)}</p>` : ''
      }${body}</div>`;
    const at = (a, b) => `${esc(a)}${b ? ` <span>· ${esc(b)}</span>` : ''}`;

    const summary = A.summary || (A.bio || [])[0] || P.tagline;
    const experience = (P.experience || [])
      .map((e) => entry(at(e.role, e.company), [e.location, e.type].filter(Boolean).join(' · '), range(e.start, e.end), `${e.summary ? `<p>${esc(e.summary)}</p>` : ''}${list(e.bullets)}${tech(e.tech)}`))
      .join('');
    const projects = (P.projects || [])
      .map((p) =>
        entry(
          at(p.name, p.role),
          '',
          p.year,
          `${p.summary ? `<p>${esc(p.summary)}</p>` : ''}${list((p.details || []).slice(0, 3))}${tech(p.tech)}${
            (p.links || []).length ? `<p class="cv-links">${p.links.map((l) => `<a href="${esc(l.url)}">${esc(bare(l.url))}</a>`).join(' · ')}</p>` : ''
          }`
        )
      )
      .join('');
    const studies = (P.studies || []).map((s) => entry(at(s.degree, s.school), s.location, range(s.start, s.end), `${s.summary ? `<p>${esc(s.summary)}</p>` : ''}${list(s.bullets)}`)).join('');
    const skills = (A.skills || []).length ? `<dl class="cv-skills">${A.skills.map((g) => `<dt>${esc(g.group)}</dt><dd>${esc((g.items || []).join(', '))}</dd>`).join('')}</dl>` : '';

    return `<article class="cv" lang="en">
      <header class="cv-head">
        ${P.avatar ? `<img class="cv-photo" src="${esc(P.avatar)}" alt="">` : ''}
        <div class="cv-id"><h1>${esc(P.name)}</h1><p class="cv-title">${esc(P.title)}</p>
        ${contact.length ? `<p class="cv-contact">${contact.join('<span class="cv-dot" aria-hidden="true"> · </span>')}</p>` : ''}</div>
      </header>
      ${sec('Profile', summary ? `<p>${esc(summary)}</p>` : '')}
      ${sec('Experience', experience)}
      ${sec('Projects', projects)}
      ${sec('Education', studies)}
      ${sec('Skills', skills)}
      <footer class="cv-foot">Interactive version (Windows XP desktop + Matrix terminal): <a href="${esc(site)}">${esc(bare(site))}</a></footer>
    </article>`;
  }

  /* Printing always produces the résumé, never a picture of the desktop. */
  let printRoot = null;
  let savedTitle = '';
  function beforePrint() {
    if (printRoot) printRoot.remove();
    printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    printRoot.innerHTML = resumeHTML();
    document.body.appendChild(printRoot);
    savedTitle = document.title;
    document.title = `${P.name} – Résumé`; // the default file name for "Save as PDF"
  }
  function afterPrint() {
    if (printRoot) printRoot.remove();
    printRoot = null;
    if (savedTitle) document.title = savedTitle;
  }
  window.addEventListener('beforeprint', beforePrint);
  window.addEventListener('afterprint', afterPrint);
  function print() {
    beforePrint();
    window.print();
  }

  function openResume(from) {
    if (XP.wm.get('resume')) return XP.wm.restore('resume');
    const content = XP.html(`<div class="cvw">
      <div class="xp-toolbar">
        <button class="tool" data-act="print" title="Print, or choose “Save as PDF” as the printer">${icon('printer', 26)}<span>Print / Save as PDF</span></button>
        ${P.resume ? `<a class="tool" href="${esc(P.resume)}" download title="Download the PDF version">${icon('pdf', 26)}<span>Download PDF</span></a>` : ''}
        <i class="tool-sep"></i>
        <button class="tool" data-act="link" title="Copy a link straight to this résumé">${icon('link', 24)}<span>Copy link</span></button>
        ${XP.email() ? `<button class="tool" data-open="compose" title="Write me an e-mail">${icon('compose', 26)}<span>Contact me</span></button>` : ''}
      </div>
      <div class="cvw-view xp-scroll" tabindex="0" aria-label="Résumé">${resumeHTML()}</div>
      <div class="xp-statusbar"><span class="sb-cell sb-main">Tip: Print / Save as PDF gives you a clean copy without the desktop around it.</span></div>
    </div>`);
    const status = (t) => (content.querySelector('.sb-main').textContent = t);
    const win = XP.wm.open({ id: 'resume', title: `Résumé - ${P.name}`, icon: 'resume', content, width: 820, height: 620, minWidth: 360, className: 'win-resume', from, hash: 'resume' });
    content.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      if (t.dataset.act === 'print') print();
      if (t.dataset.act === 'link') XP.apps.copy(XP.siteUrl() + '#resume', (msg, ok) => status(ok ? 'Link copied: it opens this résumé directly.' : msg));
    });
    return win;
  }

  /* ==================================================================
   * New Message
   * ================================================================== */
  function openCompose(from, { subject, body } = {}) {
    const email = XP.email();
    if (!email) {
      const li = XP.links().find((l) => l.id === 'linkedin');
      return XP.dialog({
        title: 'New Message',
        icon: 'info',
        message: `E-mail is not set up on this desktop yet.${li ? '<br><br>LinkedIn works just as well.' : ''}`,
        buttons: li ? ['Open LinkedIn', 'Cancel'] : ['OK'],
      }).then((a) => a === 'Open LinkedIn' && XP.openUrl(li.url));
    }
    if (XP.wm.get('compose')) return XP.wm.restore('compose');
    const content = XP.html(`<form class="oe" novalidate>
      <div class="xp-toolbar">
        <button class="tool" type="submit">${icon('compose', 28)}<span>Send</span></button>
        <i class="tool-sep"></i>
        <button class="tool" type="button" data-act="copy">${icon('copy', 24)}<span>Copy address</span></button>
      </div>
      <div class="oe-fields">
        <label class="oe-row"><span>To:</span><input class="xp-input" value="${esc(P.name)} <${esc(email)}>" readonly></label>
        <label class="oe-row"><span>Subject:</span><input class="xp-input oe-subject" name="subject" value="${esc(subject || `Hello ${P.firstName}!`)}" autocomplete="off"></label>
      </div>
      <textarea class="oe-body xp-scroll" name="body" aria-label="Message" spellcheck="true">${esc(body || `Hi ${P.firstName},\n\n`)}</textarea>
      <div class="xp-statusbar"><span class="sb-cell sb-main">Send opens your own e-mail program with this message filled in.</span></div>
    </form>`);
    const status = (t) => (content.querySelector('.sb-main').textContent = t);
    const win = XP.wm.open({ id: 'compose', title: 'New Message', icon: 'compose', content, width: 560, height: 430, minWidth: 340, minHeight: 300, className: 'win-compose', from, hash: 'message' });
    const text = content.querySelector('.oe-body');
    setTimeout(() => {
      text.focus({ preventScroll: true });
      text.setSelectionRange(text.value.length, text.value.length);
    }, 120);
    content.addEventListener('click', (e) => {
      if (e.target.closest('[data-act="copy"]')) XP.apps.copy(email, status);
    });
    content.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = content.querySelector('.oe-subject').value.trim();
      const href = `mailto:${email}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(text.value)}`;
      XP.sound.play('notify');
      window.location.href = href;
      status('Handed over to your e-mail program. Nothing opened? Use “Copy address” instead.');
    });
    return win;
  }

  XP.office = { resume: openResume, compose: openCompose, resumeHTML, print };
})();
