/* Trener C1 - wspólny moduł dla wszystkich stron.
   - zapisuje wyniki (localStorage, klucz c1_wyniki_v1), żeby pulpit pokazywał postęp,
   - dokleja link „Pulpit” do górnego paska,
   - C1.register({...}) wystawia window.C1TEST do automatycznego sprawdzania kluczem,
   - adres z ?selftest=1 wypełnia arkusz kluczem i zapisuje wynik w tytule strony
     (używane przez Chrome headless: --dump-dom i grep data-selftest). */
(function () {
  var KEY = 'c1_wyniki_v1';
  var SELFTEST = /[?&]selftest\b/.test(location.search);
  // samosprawdzanie zawsze startuje od pustego arkusza (strona nie wczyta zapisanych odpowiedzi)
  if (SELFTEST) { try { localStorage.clear(); } catch (e) {} }

  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  var C1 = {
    saveScore: function (id, score, max) {
      if (SELFTEST || !id || !max) return;
      var all = read(), prev = all[id] || {};
      var pct = Math.round(score / max * 100);
      all[id] = {
        score: score, max: max, pct: pct,
        best: Math.max(prev.best || 0, pct),
        tries: (prev.tries || 0) + 1,
        at: Date.now()
      };
      write(all);
    },
    scores: read,
    register: function (meta) { window.C1TEST = meta; }
  };
  window.C1 = C1;

  // wspólny motyw: dołączany na końcu <head>, żeby nadpisał style strony
  var theme = document.createElement('link');
  theme.rel = 'stylesheet';
  theme.href = 'assets/c1-theme.css';
  theme.setAttribute('data-c1-theme', '');
  document.head.appendChild(theme);
  document.addEventListener('DOMContentLoaded', function () { document.head.appendChild(theme); });

  function addHome() {
    if (document.querySelector('.c1-home') || document.body.hasAttribute('data-c1-home')) return;
    var bar = document.querySelector('header .bar') || document.querySelector('.bar');
    if (!bar) return;
    var a = document.createElement('a');
    a.href = 'index.html';
    a.className = 'c1-home';
    a.textContent = '← Pulpit';
    a.style.cssText = 'font-weight:700;text-decoration:none;color:var(--accent,#1d3fb8);white-space:nowrap;padding:4px 2px';
    bar.insertBefore(a, bar.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addHome);
  else addHome();

  // Oficjalne źródła każdej sesji (Państwowa Komisja, certyfikatpolski.pl): arkusz, nagranie, transkrypcja z kluczem.
  var U = 'https://certyfikatpolski.pl/wp-content/uploads/';
  var PAST = 'https://certyfikatpolski.pl/o-egzaminie/testy-egzaminacyjne-z-poprzednich-lat/';
  var SAMPLE = 'https://certyfikatpolski.pl/o-egzaminie/przykladowe-testy-zbiory-zadan/';
  var SRC = {
    '2024-04': ['sesja 20-21 kwietnia 2024', PAST, '2025/02/20-21.04.2024-C1_arkusz_egzaminacyjny.pdf', '2025/02/20-21.04.2024-C1_plik_dzwiekowy.mp3', '2025/02/20-21.04.2024-C1_transkrypcja.pdf'],
    '2023-11': ['sesja 18-19 listopada 2023', PAST, '2025/07/2023_11_18_19_C1_arkusz_egzaminacyjny.pdf', '2025/07/2023_11_18_19_C1_plik_dzwiekowy.mp3', '2025/07/2023_11_18_19_C1_transkrypcja.pdf'],
    '2023-04': ['sesja 15-16 kwietnia 2023', PAST, '2025/07/2023_04_15_16_C1_arkusz_egzaminacyjny.pdf', '2025/07/2023_04_15_16_C1_plik_dzwiekowy.mp3', '2025/07/2023_04_15_16_C1_transkrypcja.pdf'],
    '2022-11': ['sesja 5-6 listopada 2022', PAST, '2026/01/2022.11.5-6_C1_Arkusz_egzaminacyjny.pdf', '2026/01/2022.11.5-6_C1_Plik_dzwiekowy.mp3', '2026/01/2022.11.5-6_C1_Transkrypcja_nagran.pdf'],
    '2022-03': ['sesja 26-27 marca 2022', PAST, '2026/01/2022.03.26-27_C1_Arkusz_egzaminacyjny.pdf', '2026/02/2022.03.26-27_C1_Plik_dzwiekowy_v2.mp3', '2026/01/2022.03.26-27_C1_Transkrypcja_nagran.pdf'],
    '2021-06': ['sesja 19-20 czerwca 2021', PAST, '2026/07/2021.06.19-20_C1_Arkusz_egzaminacyjny.pdf', '2026/07/2021.06.19-20_C1_Plik_dzwiekowy.mp3', '2026/07/2021.06.19-20_C1_Transkrypcja_nagran.pdf'],
    '2021-05': ['sesja 8-9 maja 2021', PAST, '2026/07/2021.05.8-9_C1_Arkusz_egzaminacyjny.pdf', '2026/07/2021.05.8-9_C1_Plik_dzwiekowy.mp3', '2026/07/2021.05.8-9_C1_Transkrypcja_nagran.pdf'],
    '2020': ['test przykładowy, marzec 2020', SAMPLE, '2020/11/C1_przykladowy_test_marzec2020.pdf', '2020/11/C1_nagrania_-marzec-2020.mp3', '2020/11/C1_przykladowy_transkrypcje-i-klucz_marzec-2020.pdf'],
    '2019': ['test przykładowy 2019', SAMPLE, '2019/09/C1_test.pdf', '2019/09/C1_audio.mp3', '2019/09/C1_klucz.pdf'],
    '2017': ['test przykładowy 2017', SAMPLE, '2017/03/5_C1_test.pdf', '2017/03/egzaminy_C1__test_calosc.mp3', '2017/03/5_C1_tr-klucz.pdf']
  };
  C1.sources = SRC;

  function addSources() {
    var t = window.C1TEST;
    if (SELFTEST || !t || !SRC[t.session] || document.querySelector('.c1-src')) return;
    var s = SRC[t.session];
    var links = 'Źródło: Państwowa Komisja do spraw Poświadczania Znajomości Języka Polskiego jako Obcego, ' + s[0] + '. ' +
      '<a href="' + U + s[2] + '" target="_blank" rel="noopener">arkusz (PDF)</a> · ' +
      '<a href="' + U + s[3] + '" target="_blank" rel="noopener">nagranie (mp3)</a> · ' +
      '<a href="' + U + s[4] + '" target="_blank" rel="noopener">transkrypcja i klucz (PDF)</a> · ' +
      '<a href="' + s[1] + '" target="_blank" rel="noopener">strona Komisji</a>';
    var foot = document.createElement('p');
    foot.className = 'c1-src c1-src-foot';
    foot.innerHTML = links;
    (document.querySelector('.wrap') || document.body).appendChild(foot);

    if (t.part !== 'sluchanie') return;
    var box = document.createElement('section');
    box.className = 'card c1-src c1-audio';
    box.innerHTML = '<h2><span>Oficjalne nagranie</span></h2>' +
      '<p>Całe nagranie części słuchania z tej sesji (ok. 35-40 minut), prosto z serwera Komisji. ' +
      'Zadania idą po kolei, od zadania I. Start może potrwać do kilkunastu sekund.</p>' +
      '<audio controls preload="none" src="' + U + s[3] + '"></audio>';
    var first = document.querySelector('.card:not(#result):not(.c1-src)');
    if (first) first.parentNode.insertBefore(box, first);
    else (document.querySelector('.wrap') || document.body).appendChild(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSources);
  else addSources();

  window.addEventListener('load', function () {
    if (!SELFTEST) return;
    var out;
    try {
      var t = window.C1TEST;
      if (!t) throw new Error('brak C1TEST');
      var empty = t.check();
      t.fillCorrect();
      var full = t.check();
      var ok = Math.abs(full - t.max) < 0.001 && Math.abs(empty) < 0.001;
      out = 'SELFTEST ' + (ok ? 'OK' : 'BLAD') + ' full=' + full + ' max=' + t.max + ' empty=' + empty;
    } catch (e) {
      out = 'SELFTEST BLAD ' + e.message;
    }
    document.title = out;
    document.documentElement.setAttribute('data-selftest', out);
  });
})();
