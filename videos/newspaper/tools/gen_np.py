import json, os
OUT = os.path.expanduser("~/hf/ac-newspaper/compositions/frames")

FONTS = '''@font-face { font-family: "Liberation Serif"; font-weight: 400; font-style: normal; src: url("assets/fonts/LiberationSerif-Regular.ttf"); }
    @font-face { font-family: "Liberation Serif"; font-weight: 700; font-style: normal; src: url("assets/fonts/LiberationSerif-Bold.ttf"); }
    @font-face { font-family: "Liberation Serif"; font-weight: 400; font-style: italic; src: url("assets/fonts/LiberationSerif-Italic.ttf"); }
    @font-face { font-family: "Liberation Serif"; font-weight: 700; font-style: italic; src: url("assets/fonts/LiberationSerif-BoldItalic.ttf"); }
    @font-face { font-family: "Liberation Sans"; font-weight: 700; font-style: normal; src: url("assets/fonts/LiberationSans-Bold.ttf"); }'''

NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35 0 0 0 0 .28 0 0 0 0 .15 0 0 0 .14 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"

CSS = '''
    #root { position: absolute; inset: 0; overflow: hidden; font-family: "Liberation Serif", serif; color: #1c1915; }
    .§-bg { position: absolute; inset: 0; background-color: #efe7d3; background-image: NOISE,
      radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.4), transparent 60%),
      radial-gradient(ellipse at 85% 95%, rgba(120,90,40,0.16), transparent 60%); }
    #§-wrap { position: absolute; inset: 0; }
    .§-strip { position: absolute; left: 48px; right: 48px; top: 30px; display: flex; justify-content: space-between; align-items: center;
      font-family: "Liberation Sans", sans-serif; font-weight: 700; font-size: 20px; letter-spacing: 0.16em; text-transform: uppercase; }
    .§-strip b { color: #b42318; border: 3px solid #b42318; padding: 3px 12px; }
    .§-rule { position: absolute; left: 48px; right: 48px; top: 74px; border-top: 5px solid #1c1915; border-bottom: 2px solid #1c1915; height: 10px; }
    .§-kick { font-family: "Liberation Sans", sans-serif; font-weight: 700; font-size: 24px; letter-spacing: 0.18em; text-transform: uppercase; color: #b42318; }
    .§-h { font-weight: 700; line-height: 1.0; letter-spacing: -0.01em; }
    .§-deck { font-size: 36px; line-height: 1.2; color: #2b261f; }
    .§-ta, .§-tb { white-space: inherit; }
    .§-tb { opacity: 0; }
    .§-photo { position: absolute; background: #fbf7ea; padding: 10px 10px 0; box-shadow: 0 14px 30px rgba(40,30,10,0.38), 0 0 0 2px #1c1915; transform-origin: 50% 50%; }
    .§-view { position: relative; overflow: hidden; background: #fff; box-shadow: inset 0 0 0 2px #1c1915; }
    .§-pan { position: absolute; left: 0; top: 0; width: 100%; }
    .§-pan img { display: block; width: 100%; }
    .§-pan svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
    .§-mark { fill: none; stroke: #b42318; stroke-width: 5; stroke-linecap: round; }
    .§-cap { font-style: italic; font-size: 22px; line-height: 1.15; padding: 8px 4px 10px; color: #2b261f; }
    .§-tape { position: absolute; width: 120px; height: 34px; top: -16px; left: 50%; margin-left: -60px; background: rgba(214,196,140,0.78); transform: rotate(-3deg); box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
    .§-tick { position: absolute; left: 48px; right: 48px; bottom: 34px; height: 54px; background: #1c1915; color: #efe7d3; overflow: hidden; }
    .§-tick div { position: absolute; left: 0; top: 0; line-height: 54px; white-space: nowrap; font-family: "Liberation Sans", sans-serif; font-weight: 700; font-size: 21px; letter-spacing: 0.16em; text-transform: uppercase; }
    .§-stamp { position: absolute; z-index: 6; border: 7px solid #b42318; color: #b42318; font-family: "Liberation Sans", sans-serif; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 20px; border-radius: 8px; background: rgba(239,231,211,0.55); transform-origin: 50% 50%; }
'''

JS_COMMON = '''
      const SCOPE = document.querySelector('[data-composition-id="FID"]');
      const V = (window.__hyperframes && window.__hyperframes.getVariables) ? window.__hyperframes.getVariables() : {};
      const V2 = (V && V.lang) ? V : (window.__hfVariables || {}); const LK = Object.keys(V2).filter(function (k) { return k.toLowerCase() === "lang"; })[0]; const lang = LK && String(V2[LK]).toLowerCase() === "en" ? "en" : "ru";
      const D = DICT[lang];
      document.getElementById("§-wrap").classList.toggle("en", lang === "en");
      SCOPE.querySelectorAll("[data-t]").forEach(function (el) { el.textContent = D[el.getAttribute("data-t")]; });
      function typeIn(tl, id, text, at, dur) {
        const el = SCOPE.querySelector("#" + id);
        el.innerHTML = '<span class="§-ta"></span><span class="§-tb"></span>';
        const a = el.firstChild, b = el.lastChild; b.textContent = text;
        const o = { n: 0 };
        tl.fromTo(o, { n: 0 }, { n: text.length, duration: dur, ease: "none", onUpdate: function () {
          const k = Math.round(o.n);
          a.textContent = text.slice(0, k) + (k > 0 && k < text.length ? "|" : "");
          b.textContent = text.slice(k);
        } }, at);
      }
      const tl = gsap.timeline({ paused: true });
      const DUR = DURV;
      document.getElementById("§-tickin").textContent = [D.tick, D.tick, D.tick, D.tick].join(" ★ ");
      // bottom ticker crawl
      tl.fromTo("#§-tickin", { x: 0 }, { x: -700, duration: DUR, ease: "none" }, 0);
      // page chrome
      tl.fromTo(".§-strip", { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.1);
      tl.fromTo(".§-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out", transformOrigin: "0% 50%" }, 0.15);
'''

EN_TICK = {"02-product": "Jubilees in days and hours", "03-numbers": "Beautiful numbers", "04-export": "Export to your calendar", "05-remember": "It remembers your date", "06-offline": "Works offline"}

def build(fid, n, dur, extra_css, body, dictionary, js_body, ticker):
    dictionary["ru"]["tick"] = ticker; dictionary["en"]["tick"] = EN_TICK[fid]
    px = "f%d" % n
    css = (CSS.replace("NOISE", NOISE) + extra_css).replace("§", px)
    tickrow = " &#9733; ".join([ticker] * 4)
    html = '''<template>
  <style>
    %s
%s
  </style>

  <div id="root" data-composition-id="%s" data-width="1080" data-height="1080">
    <div class="clip §-bg" data-start="0" data-duration="%s" data-track-index="0"></div>
    <div id="§-wrap">
      <div class="§-strip"><span data-t="mast"></span><b data-t="extra"></b></div>
      <div class="§-rule"></div>
%s
      <div class="§-tick"><div id="§-tickin">%s</div></div>
    </div>
  </div>

  <script>
    (function () {
%s
%s
      window.__timelines["%s"] = tl;
    })();
  </script>
</template>
''' % (FONTS, css, fid, dur, body, tickrow, (JS_COMMON.replace("FID", fid).replace("DICT", json.dumps(dictionary, ensure_ascii=False)).replace("DURV", str(dur))), js_body, fid)
    html = html.replace("§", px)
    open(os.path.join(OUT, fid + ".html"), "w").write(html)

def photo(pid, x, y, w, h, img_ru, img_en, imgw_scale_h, pan_top, caption_key, svg="", rot=2):
    # w,h: view size; image width = w, natural height = w*1688/780
    return '''      <div class="§-photo" id="§-%s" style="left:%dpx;top:%dpx;width:%dpx;">
        <div class="§-tape"></div>
        <div class="§-view" style="width:%dpx;height:%dpx;">
          <div class="§-pan" id="§-%s-pan" style="top:%dpx;"><img id="§-%s-img" src="assets/ru-%s.png" alt="">%s</div>
        </div>
        <div class="§-cap" data-t="%s"></div>
      </div>''' % (pid, x, y, w + 20, w, h, pid, pan_top, pid, img_ru, svg, caption_key)

IMGSWAP = '''
      SCOPE.querySelectorAll("img[id$='-img']").forEach(function (im) { if (lang === "en") im.src = im.src.replace("/ru-", "/en-"); });
'''

# ---------------- Frame 2: product ----------------
dict2 = {
 "ru": {"mast": "Вестник юбилеев · стр. 2", "extra": "Экстренный выпуск", "kick": "Главная новость", "h": "Календарь юбилеев",
        "deck": "Введите дату рождения, а время по желанию. Увидите ближайшие юбилеи в днях и в часах.",
        "cap": "Один экран: дата и время рождения", "c1": "10 000 дней", "c2": "300 000 часов"},
 "en": {"mast": "The Jubilee Times · p. 2", "extra": "Extra edition", "kick": "Top story", "h": "Jubilee Calendar",
        "deck": "Enter your date of birth; the time is optional. See your upcoming jubilees in days and in hours.",
        "cap": "One screen: date and time of birth", "c1": "10,000 days", "c2": "300,000 hours"}
}
css2 = '''
    #f2-col { position: absolute; left: 48px; top: 120px; width: 520px; }
    #f2-h { font-size: 100px; margin-top: 14px; }
    .en #f2-h { font-size: 96px; }
    #f2-deck { margin-top: 28px; font-size: 38px; }
    .f2-chip { display: block; width: max-content; margin-top: 22px; font-size: 64px; font-weight: 700; background: #1c1915; color: #efe7d3; padding: 2px 22px 8px; transform: rotate(-2deg); transform-origin: 0% 50%; }
    #f2-c2 { transform: rotate(1.5deg); margin-left: 40px; }
    #f2-rule2 { margin-top: 26px; width: 0; height: 6px; background: #b42318; }
'''
body2 = '''      <div id="f2-col">
        <div class="f2-kick" data-t="kick"></div>
        <div class="f2-h" id="f2-h"></div>
        <div id="f2-rule2"></div>
        <div class="f2-deck" id="f2-deck"></div>
        <div class="f2-chip" id="f2-c1" data-t="c1" style="margin-top:56px"></div>
        <div class="f2-chip" id="f2-c2" data-t="c2"></div>
      </div>
''' + photo("ph", 610, 140, 410, 640, "form", "form", 0, 0, "cap")
js2 = IMGSWAP + '''
      typeIn(tl, "f2-h", D.h, 0.6, 1.4);
      tl.to("#f2-rule2", { width: 300, duration: 0.6, ease: "power2.out" }, 2.0);
      typeIn(tl, "f2-deck", D.deck, 2.6, 2.6);
      tl.fromTo("#f2-ph", { y: -700, rotation: -14, opacity: 0 }, { y: 0, rotation: 2, opacity: 1, duration: 0.7, ease: "power3.out" }, 1.0);
      tl.fromTo("#f2-c1", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" }, 4.4);
      tl.fromTo("#f2-c2", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(2)" }, 5.4);
      tl.fromTo("#f2-ph-pan", { y: 0 }, { y: -40, duration: 5.5, ease: "none" }, 1.5);
'''
build("02-product", 2, 7, css2, body2.replace('class="f2-kick"', 'class="§-kick"').replace('class="f2-h"','class="§-h"').replace('class="f2-deck"','class="§-deck"'), dict2, js2, "Юбилеи в днях и часах")

# ---------------- Frame 3: beautiful numbers ----------------
dict3 = {
 "ru": {"mast": "Вестник юбилеев · стр. 3", "extra": "Экстренный выпуск", "kick": "Числа", "h": "Красивые числа нашли в часах",
        "deck": "Одинаковые цифры, последовательности, палиндромы. Включаются галочкой.",
        "c1": "11 111", "l1": "одинаковые цифры", "c2": "12 345", "l2": "последовательность", "c3": "12 321", "l3": "палиндром",
        "cap": "Красивые числа среди юбилеев"},
 "en": {"mast": "The Jubilee Times · p. 3", "extra": "Extra edition", "kick": "Numbers", "h": "Beautiful numbers found in hours",
        "deck": "Repeated digits, sequences, palindromes. One checkbox turns them on.",
        "c1": "11,111", "l1": "repeated digits", "c2": "12,345", "l2": "sequence", "c3": "12,321", "l3": "palindrome",
        "cap": "Beautiful numbers among your jubilees"}
}
css3 = '''
    #f3-col { position: absolute; left: 48px; top: 116px; width: 530px; }
    #f3-h { font-size: 72px; margin-top: 12px; }
    #f3-deck { margin-top: 20px; font-size: 32px; }
    .f3-chips { margin-top: 26px; }
    .f3-chip { display: flex; align-items: center; gap: 22px; margin-bottom: 16px; transform-origin: 0% 50%; }
    .f3-chip b { display: inline-block; min-width: 230px; text-align: center; font-size: 62px; background: #1c1915; color: #efe7d3; padding: 2px 16px 6px; transform: rotate(-2deg); }
    .f3-chip:nth-child(2) b { transform: rotate(1.5deg); }
    .f3-chip span { font-style: italic; font-size: 32px; }
'''
mark3 = '''<svg viewBox="0 0 410 887" preserveAspectRatio="none"><ellipse class="f3-mark" id="f3-m1" cx="52" cy="325" rx="34" ry="30" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/><ellipse class="f3-mark" id="f3-m2" cx="270" cy="677" rx="74" ry="26" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>'''
body3 = '''      <div id="f3-col">
        <div class="f3-kick" data-t="kick"></div>
        <div class="f3-h" id="f3-h"></div>
        <div class="f3-deck" id="f3-deck"></div>
        <div class="f3-chips">
          <div class="f3-chip" id="f3-c1"><b data-t="c1"></b><span data-t="l1"></span></div>
          <div class="f3-chip" id="f3-c2"><b data-t="c2"></b><span data-t="l2"></span></div>
          <div class="f3-chip" id="f3-c3"><b data-t="c3"></b><span data-t="l3"></span></div>
        </div>
      </div>
''' + photo("ph", 610, 128, 410, 640, "calendar", "calendar", 0, -130, "cap", mark3)
js3 = IMGSWAP + '''
      typeIn(tl, "f3-h", D.h, 0.5, 1.8);
      typeIn(tl, "f3-deck", D.deck, 2.4, 1.8);
      tl.fromTo("#f3-ph", { x: 500, rotation: 10, opacity: 0 }, { x: 0, rotation: 2, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.9);
      tl.fromTo("#f3-ph-pan", { y: -130 }, { y: -190, duration: 7.5, ease: "none" }, 1.5);
      ["f3-c1", "f3-c2", "f3-c3"].forEach(function (id, i) {
        tl.fromTo("#" + id, { x: -80, opacity: 0, scale: 0.7 }, { x: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 4.4 + i * 1.0);
      });
      tl.fromTo("#f3-m1", { opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 3.2);
      tl.fromTo("#f3-m2", { opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 6.4);
'''
build("03-numbers", 3, 9, css3, body3.replace('class="f3-kick"', 'class="§-kick"').replace('class="f3-h"','class="§-h"').replace('class="f3-deck"','class="§-deck"').replace('class="f3-mark"','class="§-mark"'), dict3, js3, "Красивые числа")

# ---------------- Frame 4: export ----------------
dict4 = {
 "ru": {"mast": "Вестник юбилеев · стр. 4", "extra": "Экстренный выпуск", "kick": "Календарь", "h": "Юбилеи теперь в календаре",
        "deck": "Отметьте нужные юбилеи и скачайте файл.",
        "b1": ".ics: все или выбранные", "b2": "В Google Календарь: по одному", "b3": "Последнее событие ведёт к следующим юбилеям",
        "cap": "Отмечайте юбилеи и добавляйте в календарь", "st": ".ics"},
 "en": {"mast": "The Jubilee Times · p. 4", "extra": "Extra edition", "kick": "Calendar", "h": "Jubilees now in your calendar",
        "deck": "Tick the jubilees you want and download the file.",
        "b1": ".ics: all or selected", "b2": "Add to Google Calendar, per jubilee", "b3": "The last event links to the next batch",
        "cap": "Tick jubilees and add them to your calendar", "st": ".ics"}
}
css4 = '''
    #f4-col { position: absolute; left: 48px; top: 116px; width: 530px; }
    #f4-h { font-size: 74px; margin-top: 12px; }
    #f4-deck { margin-top: 20px; font-size: 34px; }
    .f4-bl { margin-top: 22px; }
    .f4-b { display: block; font-size: 33px; line-height: 1.15; padding: 12px 0 12px 44px; border-top: 2px solid #1c1915; position: relative; }
    .f4-b::before { content: ""; position: absolute; left: 6px; top: 22px; width: 18px; height: 18px; background: #b42318; transform: rotate(45deg); }
    #f4-st { right: 40px; top: 600px; font-size: 64px; padding: 6px 26px; z-index: 6; }
'''
mark4 = '''<svg viewBox="0 0 410 887" preserveAspectRatio="none"><ellipse class="f4-mark" id="f4-m1" cx="160" cy="222" rx="100" ry="22" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/><rect class="f4-mark" id="f4-m2" x="26" y="112" width="48" height="500" rx="20" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>'''
body4 = '''      <div id="f4-col">
        <div class="f4-kick" data-t="kick"></div>
        <div class="f4-h" id="f4-h"></div>
        <div class="f4-deck" id="f4-deck"></div>
        <div class="f4-bl">
          <span class="f4-b" id="f4-b1" data-t="b1"></span>
          <span class="f4-b" id="f4-b2" data-t="b2"></span>
          <span class="f4-b" id="f4-b3" data-t="b3"></span>
        </div>
      </div>
''' + photo("ph", 610, 128, 410, 640, "export", "export", 0, 0, "cap", mark4) + '''
      <div class="f4-stamp" id="f4-st" data-t="st"></div>
'''
js4 = IMGSWAP + '''
      typeIn(tl, "f4-h", D.h, 0.5, 1.8);
      typeIn(tl, "f4-deck", D.deck, 2.4, 1.2);
      tl.fromTo("#f4-ph", { y: 700, rotation: -10, opacity: 0 }, { y: 0, rotation: -2, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.9);
      tl.fromTo("#f4-ph-pan", { y: 0 }, { y: -60, duration: 7.5, ease: "none" }, 1.5);
      ["f4-b1", "f4-b2", "f4-b3"].forEach(function (id, i) {
        tl.fromTo("#" + id, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 3.4 + i * 1.3);
      });
      tl.fromTo("#f4-m2", { opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 3.5);
      tl.fromTo("#f4-m1", { opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut" }, 4.9);
      tl.fromTo("#f4-st", { scale: 3.2, opacity: 0, rotation: -25 }, { scale: 1, opacity: 1, rotation: -10, duration: 0.28, ease: "power4.in" }, 6.4);
'''
build("04-export", 4, 9, css4, body4.replace('class="f4-kick"', 'class="§-kick"').replace('class="f4-h"','class="§-h"').replace('class="f4-deck"','class="§-deck"').replace('class="f4-mark"','class="§-mark"').replace('class="f4-stamp"','class="§-stamp"'), dict4, js4, "Экспорт в календарь")

# ---------------- Frame 5: remembers ----------------
dict5 = {
 "ru": {"mast": "Вестник юбилеев · стр. 5", "extra": "Экстренный выпуск", "kick": "Удобство", "h": "Дату запоминает сам",
        "deck": "Введите один раз. В следующий раз календарь появится сразу.",
        "l1": "Первый раз", "l2": "Потом сразу", "cap1": "Вводите дату рождения", "cap2": "Календарь уже готов", "note": "Дата хранится только на этом устройстве"},
 "en": {"mast": "The Jubilee Times · p. 5", "extra": "Extra edition", "kick": "Convenience", "h": "It remembers your date",
        "deck": "Enter it once. Next time the calendar opens right away.",
        "l1": "First time", "l2": "Next time", "cap1": "Enter your date of birth", "cap2": "Your calendar is already there", "note": "Your date stays on this device only"}
}
css5 = '''
    #f5-top { position: absolute; left: 48px; top: 112px; right: 48px; }
    #f5-h { font-size: 92px; margin-top: 8px; }
    #f5-deck { margin-top: 10px; font-size: 34px; }
    .f5-lab { position: absolute; top: 366px; z-index: 5; font-family: "Liberation Sans", sans-serif; font-weight: 700; font-size: 24px; letter-spacing: 0.14em; text-transform: uppercase; background: #b42318; color: #efe7d3; padding: 6px 16px; }
    #f5-arrow { position: absolute; left: 480px; top: 560px; width: 120px; height: 70px; z-index: 5; overflow: visible; }
    #f5-arrow path { fill: none; stroke: #b42318; stroke-width: 12; stroke-linecap: round; stroke-linejoin: round; }
    #f5-note { position: absolute; left: 48px; right: 48px; bottom: 100px; text-align: center; font-style: italic; font-weight: 700; font-size: 34px; }
'''
body5 = '''      <div id="f5-top">
        <div class="f5-kick" data-t="kick"></div>
        <div class="f5-h" id="f5-h"></div>
        <div class="f5-deck" id="f5-deck"></div>
      </div>
      <div class="f5-lab" id="f5-lab1" style="left:60px" data-t="l1"></div>
      <div class="f5-lab" id="f5-lab2" style="left:572px" data-t="l2"></div>
''' + photo("p1", 48, 390, 440, 380, "form", "form", 0, 0, "cap1") + photo("p2", 570, 390, 440, 380, "calendar", "calendar", 0, 0, "cap2") + '''
      <svg id="f5-arrow" viewBox="0 0 120 70"><path id="f5-arrowp" d="M8 35 H108 M82 10 L108 35 L82 60" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/></svg>
      <div id="f5-note" data-t="note"></div>
'''
js5 = IMGSWAP + '''
      typeIn(tl, "f5-h", D.h, 0.5, 1.4);
      typeIn(tl, "f5-deck", D.deck, 2.0, 1.8);
      tl.fromTo("#f5-p1", { x: -500, rotation: -12, opacity: 0 }, { x: 0, rotation: -2, opacity: 1, duration: 0.7, ease: "power3.out" }, 2.4);
      tl.fromTo("#f5-lab1", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 3.0);
      tl.fromTo("#f5-arrowp", { opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 4.6);
      tl.fromTo("#f5-p2", { x: 500, rotation: 12, opacity: 0 }, { x: 0, rotation: 2, opacity: 1, duration: 0.7, ease: "power3.out" }, 5.2);
      tl.fromTo("#f5-lab2", { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 }, 5.8);
      tl.fromTo("#f5-p1-pan", { y: -135 }, { y: -150, duration: 6, ease: "none" }, 3);
      tl.fromTo("#f5-p2-pan", { y: -135 }, { y: -150, duration: 3.5, ease: "none" }, 5.5);
      tl.fromTo("#f5-note", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 7.0);
'''
build("05-remember", 5, 9, css5, body5.replace('class="f5-kick"', 'class="§-kick"').replace('class="f5-h"','class="§-h"').replace('class="f5-deck"','class="§-deck"'), dict5, js5, "Дата запоминается")

# ---------------- Frame 6: offline ----------------
dict6 = {
 "ru": {"mast": "Вестник юбилеев · стр. 6", "extra": "Экстренный выпуск", "kick": "Без связи", "h": "Работает без интернета",
        "deck": "Ставится на телефон как приложение и открывается офлайн.",
        "b1": "Устанавливается на телефон", "b2": "Открывается без сети", "b3": "Считает прямо в браузере",
        "cap": "Значок на экране телефона", "st": "Офлайн"},
 "en": {"mast": "The Jubilee Times · p. 6", "extra": "Extra edition", "kick": "No signal", "h": "Works offline",
        "deck": "Install it on your phone as an app and open it offline.",
        "b1": "Installs on your phone", "b2": "Opens without a network", "b3": "Calculated right in the browser",
        "cap": "The icon on your phone screen", "st": "Offline"}
}
css6 = '''
    #f6-col { position: absolute; left: 48px; top: 116px; width: 540px; }
    #f6-h { font-size: 82px; margin-top: 12px; }
    .en #f6-h { font-size: 92px; }
    #f6-deck { margin-top: 20px; font-size: 34px; }
    .f6-bl { margin-top: 24px; }
    .f6-b { display: block; font-size: 34px; line-height: 1.15; padding: 14px 0 14px 44px; border-top: 2px solid #1c1915; position: relative; }
    .f6-b::before { content: ""; position: absolute; left: 6px; top: 24px; width: 18px; height: 18px; background: #b42318; transform: rotate(45deg); }
    #f6-wifi { position: absolute; left: 640px; top: 120px; width: 230px; height: 250px; z-index: 5; overflow: visible; }
    #f6-wifi path.w { fill: none; stroke: #1c1915; stroke-width: 14; stroke-linecap: round; }
    #f6-wifi circle { fill: #1c1915; }
    #f6-wifi path.x { fill: none; stroke: #b42318; stroke-width: 18; stroke-linecap: round; }
    #f6-st { right: 40px; top: 350px; font-size: 56px; z-index: 6; }
    #f6-ph { z-index: 3; }
    #f6-ic { display: block; width: 100%; background: #fff; }
'''
body6 = '''      <div id="f6-col">
        <div class="f6-kick" data-t="kick"></div>
        <div class="f6-h" id="f6-h"></div>
        <div class="f6-deck" id="f6-deck"></div>
        <div class="f6-bl">
          <span class="f6-b" id="f6-b1" data-t="b1"></span>
          <span class="f6-b" id="f6-b2" data-t="b2"></span>
          <span class="f6-b" id="f6-b3" data-t="b3"></span>
        </div>
      </div>
      <div class="f6-photo" id="f6-ph" style="left:650px;top:500px;width:330px;">
        <div class="f6-tape"></div>
        <div class="f6-view" style="width:310px;height:310px;"><img id="f6-ic" src="assets/icon-512.png" alt=""></div>
        <div class="f6-cap" data-t="cap"></div>
      </div>
      <svg id="f6-wifi" viewBox="0 0 100 100">
        <path class="w" id="f6-w1" d="M10 38 Q50 4 90 38"/><path class="w" id="f6-w2" d="M24 54 Q50 32 76 54"/><path class="w" id="f6-w3" d="M38 69 Q50 59 62 69"/>
        <circle cx="50" cy="82" r="6"/>
        <path class="x" id="f6-x" d="M12 92 L88 8" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"/>
      </svg>
      <div class="f6-stamp" id="f6-st" data-t="st"></div>
'''
js6 = '''
      typeIn(tl, "f6-h", D.h, 0.5, 1.6);
      typeIn(tl, "f6-deck", D.deck, 2.2, 2.0);
      tl.fromTo("#f6-wifi", { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }, 1.0);
      tl.fromTo("#f6-x", { opacity: 0 }, { opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: "power3.in" }, 2.6);
      tl.fromTo("#f6-st", { scale: 3.2, opacity: 0, rotation: -25 }, { scale: 1, opacity: 1, rotation: 8, duration: 0.28, ease: "power4.in" }, 3.4);
      tl.fromTo("#f6-ph", { y: 600, rotation: 14, opacity: 0 }, { y: 0, rotation: -3, opacity: 1, duration: 0.7, ease: "power3.out" }, 3.9);
      ["f6-b1", "f6-b2", "f6-b3"].forEach(function (id, i) {
        tl.fromTo("#" + id, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 4.2 + i * 1.2);
      });
'''
build("06-offline", 6, 8, css6, body6.replace('class="f6-kick"', 'class="§-kick"').replace('class="f6-h"','class="§-h"').replace('class="f6-deck"','class="§-deck"').replace('class="f6-photo"','class="§-photo"').replace('class="f6-tape"','class="§-tape"').replace('class="f6-view"','class="§-view"').replace('class="f6-cap"','class="§-cap"').replace('class="f6-stamp"','class="§-stamp"'), dict6, js6, "Работает офлайн")
print("ok")
