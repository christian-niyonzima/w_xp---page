/* Owner checklist for js/data.js: finds template text that still needs replacing and
 * obvious mistakes. Visitors never load this file. It runs:
 *   - in the browser, only when the site is opened locally (file:// or localhost), and
 *   - from the command line: `node tools/check-profile.js` (or `npm run check`).
 * Returns [{ level: 'error' | 'todo' | 'tip', path, message }]. */
(function (root) {
  // Template text shipped in data.js. Anything matching is "still to do".
  const TEMPLATE = [
    /your-profile/i,
    /@example\.com/i,
    /^your city\b/i,
    /^city( \/ remote|, country)?$/i,
    /\b(company name|previous company|university name|project name|another side project|job title|your field of study|your role)\b/i,
    /^internship \/ part-time role$/i,
    /^course or certificate name/i,
    /^add 2–4 short bullet points/i,
    /^(built|improved|learned)…$/i,
    /^one (line|sentence) about/i,
    /^what you learned and the impact you had/i,
    /^a sentence about your focus/i,
    /^online courses, bootcamps or certifications/i,
    /^(shipped a feature that improved something measurable|worked with design and product to turn ideas into releases|automated, mentored, documented)/i,
    /^(relevant coursework: data structures, algorithms, web development, databases\.|activities: hackathons, coding club, volunteering…)$/i,
  ];
  const isTemplate = (s) => typeof s === 'string' && TEMPLATE.some((re) => re.test(s.trim()));
  const URL_OK = /^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+|[\w./-]+)$/i;

  function check(P) {
    const out = [];
    const add = (level, path, message) => out.push({ level, path, message });
    if (!P || typeof P !== 'object') return [{ level: 'error', path: 'PROFILE', message: 'window.PROFILE is missing.' }];

    ['name', 'firstName', 'title'].forEach((k) => {
      if (!P[k] || typeof P[k] !== 'string') add('error', k, 'is required (shown on the boot screen, Start menu and terminal).');
    });

    // Template text anywhere in the profile.
    const walk = (v, path) => {
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') Object.keys(v).forEach((k) => walk(v[k], path ? `${path}.${k}` : k));
      else if (isTemplate(v)) add('todo', path, `still has template text: "${String(v).slice(0, 60)}"`);
    };
    walk(P, '');

    (P.links || []).forEach((l, i) => {
      if (!l || !l.url || !l.label) add('error', `links[${i}]`, 'needs both a label and a url.');
      else if (!URL_OK.test(l.url)) add('error', `links[${i}].url`, `does not look like a link: "${l.url}"`);
    });
    ['projects', 'experience', 'studies'].forEach((k) => {
      if (P[k] != null && !Array.isArray(P[k])) add('error', k, 'must be a list: [ { … }, { … } ]');
    });
    (P.projects || []).forEach((p, i) => (p.links || []).forEach((l, j) => {
      if (!l || !l.url || !URL_OK.test(l.url)) add('error', `projects[${i}].links[${j}]`, 'needs a valid url.');
    }));
    ((P.about && P.about.levels) || []).forEach((lv, i) => {
      if (!Array.isArray(lv) || typeof lv[0] !== 'string' || !(lv[1] >= 0 && lv[1] <= 100)) add('error', `about.levels[${i}]`, "should look like ['Skill', 0-100].");
    });

    if (!P.avatar) add('tip', 'avatar', 'add a square photo (e.g. assets/me.jpg); initials are shown until then.');
    if (!P.resume) add('tip', 'resume', 'add a PDF (e.g. assets/resume.pdf), or rely on the built-in printable résumé.');
    if (!P.siteUrl) add('tip', 'siteUrl', 'set the public address of the site so shared links and the printable résumé point to it.');
    return out;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = check;
  else (root.XP = root.XP || {}).profileIssues = check;
})(typeof window !== 'undefined' ? window : globalThis);
