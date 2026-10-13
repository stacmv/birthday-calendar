import os
OUT = r"\\wsl.localhost\Ubuntu\home\stac\hf\ac-numbers\compositions\frames"
FONT = '''@font-face { font-family: "Inter"; font-weight: 100 900; src: url("assets/fonts/inter-cyrillic.woff2") format("woff2"); unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
    @font-face { font-family: "Inter"; font-weight: 100 900; src: url("assets/fonts/inter-latin.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }'''
LANGJS = '''var LANG = (function () {
        var v = window.__hfVariables;
        if (v && (v.lang === "en" || v.lang === "ru")) return v.lang;
        try {
          var d = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]");
          for (var i = 0; i < d.length; i++) if (d[i].id === "lang") return d[i]["default"] === "en" ? "en" : "ru";
        } catch (e) {}
        return "ru";
      })();
      document.querySelectorAll("[data-ru]").forEach(function (e) { e.textContent = LANG === "en" ? e.getAttribute("data-en") : e.getAttribute("data-ru"); });'''


def frame(fid, dur, bg, css, body, js):
    p = "n" + fid[:2]
    s = f'''<template>
  <style>
    {FONT}
    #root {{ position: absolute; inset: 0; overflow: hidden; font-family: "Inter", sans-serif; color: #182033; }}
    .{p}bg {{ position: absolute; inset: 0; background: {bg}; }}
    {css}
  </style>
  <div id="root" data-composition-id="{fid}" data-start="0" data-duration="{dur}" data-width="1080" data-height="1080">
    <div id="{p}-bg" class="{p}bg clip" data-start="0" data-duration="{dur}" data-track-index="0"></div>
    <div id="{p}-stage" class="clip" data-start="0" data-duration="{dur}" data-track-index="1" style="position:absolute;inset:0;">
{body}
    </div>
  </div>
  <script>
    (function () {{
      {LANGJS}
      var tl = gsap.timeline({{ paused: true }});
{js}
      window.__timelines["{fid}"] = tl;
    }})();
  </script>
</template>
'''
    open(os.path.join(OUT, fid + ".html"), "w", encoding="utf-8", newline="\n").write(s)


DIG = 'position: absolute; width: 150px; height: 250px; line-height: 250px; text-align: center; font-size: 250px; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -0.02em;'
CAP = 'position: absolute; left: 0; right: 0; text-align: center; font-weight: 700;'

# ---------- 02 show-off ----------
frame("02-show-off", 8, "#F4F6FB",
      f'''.s2d {{ {DIG} top: 375px; color: #182033; }}
    #s2-eyebrow {{ {CAP} top: 190px; font-size: 40px; letter-spacing: 0.12em; text-transform: uppercase; color: #1D4ED8; }}
    #s2-cap {{ {CAP} top: 740px; font-size: 76px; color: #182033; }}
    #s2-same {{ {CAP} top: 850px; font-size: 44px; color: #4A5568; font-weight: 600; }}
    .s2p {{ position: absolute; left: 520px; top: 480px; width: 40px; height: 60px; line-height: 60px; text-align: center; font-size: 56px; font-weight: 800; color: #1D4ED8; }}''',
      '''      <div id="s2-eyebrow" data-ru="красивое число" data-en="a beautiful number">красивое число</div>
      <div id="s2-row" style="position:absolute;inset:0;">
        <div class="s2d" data-layout-allow-overlap id="s2-d0">1</div><div class="s2d" data-layout-allow-overlap id="s2-d1">1</div><div class="s2d" data-layout-allow-overlap id="s2-d2">1</div><div class="s2d" data-layout-allow-overlap id="s2-d3">1</div><div class="s2d" data-layout-allow-overlap id="s2-d4">1</div>
      </div>
      <div id="s2-cap" data-ru="дней с рождения" data-en="days since birth">дней с рождения</div>
      <div id="s2-same" data-ru="все пять одинаковые" data-en="all five the same">все пять одинаковые</div>
      <div class="s2p" data-layout-allow-overlap id="s2-p0">1</div><div class="s2p" data-layout-allow-overlap id="s2-p1">1</div><div class="s2p" data-layout-allow-overlap id="s2-p2">1</div><div class="s2p" data-layout-allow-overlap id="s2-p3">1</div><div class="s2p" data-layout-allow-overlap id="s2-p4">1</div><div class="s2p" data-layout-allow-overlap id="s2-p5">1</div><div class="s2p" data-layout-allow-overlap id="s2-p6">1</div><div class="s2p" data-layout-allow-overlap id="s2-p7">1</div>''',
      '''      var SLOT = [135, 285, 495, 645, 795];
      var d = [0,1,2,3,4].map(function (i) { return document.getElementById("s2-d" + i); });
      d.forEach(function (el, i) { gsap.set(el, { left: SLOT[i] }); });
      gsap.set(["#s2-cap", "#s2-same", "#s2-eyebrow"], { opacity: 0 });
      gsap.set(".s2p", { opacity: 0 });
      // wave: each digit hops in turn
      d.forEach(function (el, i) {
        tl.to(el, { y: -70, duration: 0.2, ease: "power2.out" }, 0.4 + i * 0.12);
        tl.to(el, { y: 0, duration: 0.3, ease: "bounce.out" }, 0.6 + i * 0.12);
      });
      tl.fromTo("#s2-eyebrow", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 1.0);
      // shimmer: digits turn blue one by one
      d.forEach(function (el, i) { tl.to(el, { color: "#1D4ED8", duration: 0.25, ease: "power1.out" }, 1.8 + i * 0.12); });
      // flex: row fans out, swells and wiggles
      d.forEach(function (el, i) { tl.to(el, { x: (i - 2) * 38, duration: 0.35, ease: "power2.out" }, 2.8); tl.to(el, { x: 0, duration: 0.5, ease: "elastic.out(1,0.5)" }, 3.5); });
      tl.to("#s2-row", { scale: 1.2, rotation: -3, duration: 0.4, ease: "back.out(2)", transformOrigin: "50% 50%" }, 2.8);
      tl.to("#s2-row", { rotation: 3, duration: 0.25, ease: "sine.inOut" }, 3.3);
      tl.to("#s2-row", { rotation: 0, scale: 1, duration: 0.5, ease: "power3.inOut" }, 3.7);
      // burst of little 1s
      for (var k = 0; k < 8; k++) {
        var a = k / 8 * Math.PI * 2;
        tl.fromTo("#s2-p" + k, { x: 0, y: 0, opacity: 1, scale: 0.5 }, { x: Math.cos(a) * 420, y: Math.sin(a) * 330, opacity: 0, scale: 1.4, duration: 0.9, ease: "power2.out", immediateRender: false }, 2.85);
      }
      // caption + line
      tl.fromTo("#s2-cap", { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.8)" }, 4.0);
      tl.fromTo("#s2-same", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 5.4);
      tl.to(d, { y: -14, duration: 0.25, stagger: 0.06, ease: "sine.out" }, 6.2);
      tl.to(d, { y: 0, duration: 0.35, stagger: 0.06, ease: "bounce.out" }, 6.45);''')

# ---------- 03 staircase ----------
frame("03-staircase", 8, "#F4F6FB",
      f'''.s3slot {{ position: absolute; top: 375px; width: 150px; height: 250px; overflow: hidden; }}
    .s3n {{ position: absolute; left: 0; width: 150px; height: 250px; line-height: 250px; text-align: center; font-size: 250px; font-weight: 800; font-variant-numeric: tabular-nums; color: #182033; letter-spacing: -0.02em; }}
    .s3b {{ position: absolute; width: 150px; background: rgba(29,78,216,0.14); border-top: 6px solid #1D4ED8; transform-origin: 50% 100%; }}
    #s3-ball {{ position: absolute; width: 44px; height: 44px; border-radius: 22px; background: #B42318; }}
    #s3-cap {{ {CAP} top: 850px; font-size: 64px; }}''',
      '''      <div id="s3-blocks"></div>
      <div id="s3-slots"></div>
      <div id="s3-ball"></div>
      <div id="s3-cap" data-ru="ступенька за ступенькой" data-en="step by step">ступенька за ступенькой</div>''',
      '''      var SLOT = [135, 285, 495, 645, 795];
      var slots = document.getElementById("s3-slots"), blocks = document.getElementById("s3-blocks");
      var DY = [];
      for (var i = 0; i < 5; i++) {
        var dy = 130 - i * 65; DY.push(dy);
        var s = document.createElement("div"); s.className = "s3slot"; s.id = "s3-slot" + i; s.style.left = SLOT[i] + "px";
        s.innerHTML = '<div class="s3n" id="s3-old' + i + '">1</div><div class="s3n" id="s3-new' + i + '" style="top:250px">' + (i + 1) + '</div>';
        slots.appendChild(s);
        var b = document.createElement("div"); b.className = "s3b"; b.id = "s3-b" + i; b.style.left = SLOT[i] + "px";
        var top = 612 + dy; b.style.top = top + "px"; b.style.height = (810 - top) + "px"; blocks.appendChild(b);
      }
      gsap.set("#s3-cap", { opacity: 0 });
      gsap.set("#s3-ball", { left: SLOT[0] + 53, top: 612 + DY[0] - 50, opacity: 0 });
      gsap.set(".s3b", { scaleY: 0 });
      for (var i = 0; i < 5; i++) {
        var st = 0.5 + i * 0.22;
        // the digit rolls up to its number while its slot rises onto its step
        if (i > 0) tl.to("#s3-old" + i, { y: -250, duration: 0.5, ease: "power3.inOut" }, st);
        if (i > 0) tl.to("#s3-new" + i, { y: -250, duration: 0.5, ease: "power3.inOut" }, st);
        tl.to("#s3-slot" + i, { y: DY[i], duration: 0.7, ease: "back.out(1.6)" }, st + 0.35);
        tl.to("#s3-b" + i, { scaleY: 1, duration: 0.6, ease: "back.out(1.4)" }, st + 0.55);
      }
      tl.fromTo("#s3-cap", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 3.2);
      // a ball climbs the staircase
      tl.set("#s3-ball", { opacity: 1 }, 4.2);
      for (var i = 1; i < 5; i++) {
        var t0 = 4.2 + (i - 1) * 0.5;
        tl.to("#s3-ball", { x: (SLOT[i] - SLOT[0]), duration: 0.5, ease: "none" }, t0);
        tl.to("#s3-ball", { y: DY[i] - DY[0] - 110, duration: 0.25, ease: "power2.out" }, t0);
        tl.to("#s3-ball", { y: DY[i] - DY[0], duration: 0.25, ease: "power2.in" }, t0 + 0.25);
      }
      tl.to("#s3-ball", { scale: 1.6, duration: 0.3, ease: "back.out(3)" }, 6.2);
      tl.to("#s3-ball", { scale: 1, duration: 0.4, ease: "power2.inOut" }, 6.5);''')

# ---------- 04 mirror ----------
frame("04-mirror", 8, "#F4F6FB",
      f'''.s4d {{ {DIG} top: 375px; color: #1D4ED8; }}
    #s4-axis {{ position: absolute; left: 538px; top: 300px; width: 4px; height: 470px; background: repeating-linear-gradient(to bottom, #B42318 0 16px, transparent 16px 30px); transform-origin: 50% 0; }}
    #s4-cap {{ {CAP} top: 790px; font-size: 76px; }}
    #s4-sub {{ {CAP} top: 890px; font-size: 40px; color: #4A5568; font-weight: 600; }}''',
      '''      <div id="s4-axis"></div>
      <div class="s4d" data-layout-allow-overlap id="s4-d0">1</div><div class="s4d" data-layout-allow-overlap id="s4-d1">2</div>
      <div class="s4d" data-layout-allow-overlap id="s4-d2" style="color:#182033">3</div>
      <div class="s4d" data-layout-allow-overlap id="s4-d3">2</div><div class="s4d" data-layout-allow-overlap id="s4-d4">1</div>
      <div id="s4-cap" data-ru="палиндром" data-en="a palindrome">палиндром</div>
      <div id="s4-sub" data-ru="читается одинаково в обе стороны" data-en="reads the same both ways">читается одинаково в обе стороны</div>''',
      '''      var SLOT = [165, 315, 465, 615, 765];
      for (var i = 0; i < 5; i++) gsap.set("#s4-d" + i, { left: SLOT[i] });
      gsap.set(["#s4-cap", "#s4-sub"], { opacity: 0 });
      tl.fromTo("#s4-d0", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.8)" }, 0.3);
      tl.fromTo("#s4-d1", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "back.out(1.8)" }, 0.8);
      tl.fromTo("#s4-d2", { y: -400, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "bounce.out" }, 1.4);
      tl.fromTo("#s4-axis", { scaleY: 0 }, { scaleY: 1, duration: 0.7, ease: "power2.out" }, 1.9);
      // right half emerges from the axis as a mirror image, then flips to read normally
      tl.fromTo("#s4-d3", { x: -150, scaleX: -1, opacity: 0 }, { x: 0, scaleX: -1, opacity: 1, duration: 0.6, ease: "power3.out" }, 2.7);
      tl.fromTo("#s4-d4", { x: -300, scaleX: -1, opacity: 0 }, { x: 0, scaleX: -1, opacity: 1, duration: 0.6, ease: "power3.out" }, 2.9);
      tl.to("#s4-d3", { scaleX: 1, duration: 0.5, ease: "back.out(1.6)" }, 3.9);
      tl.to("#s4-d4", { scaleX: 1, duration: 0.5, ease: "back.out(1.6)" }, 4.1);
      tl.to("#s4-axis", { opacity: 0.25, duration: 0.4 }, 4.6);
      tl.fromTo("#s4-cap", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }, 4.7);
      tl.fromTo("#s4-sub", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 5.4);
      // both halves nod together
      tl.to(["#s4-d0", "#s4-d1", "#s4-d3", "#s4-d4"], { y: -22, duration: 0.25, ease: "sine.out" }, 6.4);
      tl.to(["#s4-d0", "#s4-d1", "#s4-d3", "#s4-d4"], { y: 0, duration: 0.4, ease: "bounce.out" }, 6.65);''')

# ---------- 05 silence ----------
frame("05-silence", 7, "#0E1424",
      f'''.s5d {{ {DIG} top: 375px; color: #F4F6FB; font-weight: 700; }}
    #s5-line {{ position: absolute; left: 135px; top: 690px; width: 810px; height: 3px; background: #F4F6FB; opacity: 0.5; transform-origin: 50% 50%; }}
    #s5-cap {{ {CAP} top: 760px; font-size: 54px; font-weight: 500; letter-spacing: 0.06em; color: #C9D3EA; }}''',
      '''      <div class="s5d" id="s5-d0">1</div><div class="s5d" id="s5-d1">0</div><div class="s5d" id="s5-d2">0</div><div class="s5d" id="s5-d3">0</div><div class="s5d" id="s5-d4">0</div>
      <div id="s5-line"></div>
      <div id="s5-cap" data-ru="дней. круглая дата." data-en="days. a round milestone.">дней. круглая дата.</div>''',
      '''      var SLOT = [135, 285, 495, 645, 795];
      for (var i = 0; i < 5; i++) gsap.set("#s5-d" + i, { left: SLOT[i] });
      gsap.set("#s5-cap", { opacity: 0 });
      // hushed: one digit at a time, no bounce, no motion beyond a slow fade
      for (var i = 0; i < 5; i++) tl.fromTo("#s5-d" + i, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1, ease: "sine.out" }, 0.5 + i * 0.75);
      tl.fromTo("#s5-line", { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: "sine.inOut" }, 3.9);
      tl.fromTo("#s5-cap", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "sine.out" }, 4.7);''')

# ---------- 06 drop ----------
frame("06-drop", 7, "#1D4ED8",
      f'''.s6d {{ position: absolute; top: 250px; width: 140px; height: 220px; line-height: 220px; text-align: center; font-size: 220px; font-weight: 800; font-variant-numeric: tabular-nums; color: #FFFFFF; letter-spacing: -0.02em; }}
    #s6-hours {{ {CAP} top: 520px; font-size: 190px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.02em; }}
    #s6-sub {{ {CAP} top: 790px; font-size: 44px; color: #DCE6FF; font-weight: 600; }}''',
      '''      <div id="s6-num" data-layout-allow-overflow style="position:absolute;inset:0;">
        <div class="s6d" data-layout-allow-overlap id="s6-d0">3</div><div class="s6d" data-layout-allow-overlap id="s6-d1">0</div><div class="s6d" data-layout-allow-overlap id="s6-d2">0</div><div class="s6d" data-layout-allow-overlap id="s6-d3">0</div><div class="s6d" data-layout-allow-overlap id="s6-d4">0</div><div class="s6d" data-layout-allow-overlap id="s6-d5">0</div>
      </div>
      <div id="s6-hours" data-layout-allow-overflow data-ru="часов" data-en="hours">часов</div>
      <div id="s6-sub" data-ru="юбилеи считаются и в днях, и в часах" data-en="jubilees in days and in hours">юбилеи считаются и в днях, и в часах</div>''',
      '''      var SLOT = [90, 230, 370, 570, 710, 850];
      for (var i = 0; i < 6; i++) gsap.set("#s6-d" + i, { left: SLOT[i], transformOrigin: "50% 100%" });
      gsap.set("#s6-sub", { opacity: 0 });
      gsap.set("#s6-hours", { transformOrigin: "50% 100%" });
      // the number falls as a row, digits a hair apart, and lands with a squash
      for (var i = 0; i < 6; i++) {
        var t0 = 0.3 + i * 0.05;
        tl.fromTo("#s6-d" + i, { y: -700, rotation: (i % 2 ? 1 : -1) * 6 }, { y: 0, rotation: 0, duration: 0.5, ease: "power3.in" }, t0);
        tl.to("#s6-d" + i, { scaleY: 0.78, scaleX: 1.12, duration: 0.08, ease: "power1.out" }, t0 + 0.5);
        tl.to("#s6-d" + i, { scaleY: 1, scaleX: 1, duration: 0.5, ease: "elastic.out(1,0.35)" }, t0 + 0.58);
      }
      tl.to("#s6-num", { y: 14, duration: 0.07, yoyo: true, repeat: 3, ease: "sine.inOut" }, 0.85);
      // the word "hours" drops second, harder
      tl.fromTo("#s6-hours", { y: -900, opacity: 1 }, { y: 0, duration: 0.5, ease: "power3.in" }, 1.7);
      tl.to("#s6-hours", { scaleY: 0.82, scaleX: 1.08, duration: 0.08 }, 2.2);
      tl.to("#s6-hours", { scaleY: 1, scaleX: 1, duration: 0.55, ease: "elastic.out(1,0.35)" }, 2.31);
      tl.to("#n06-stage", { y: 12, duration: 0.07, yoyo: true, repeat: 3, ease: "sine.inOut" }, 2.2);
      tl.fromTo("#s6-sub", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 3.6);
      tl.to("#s6-num", { scale: 1.05, duration: 0.5, ease: "sine.inOut", transformOrigin: "50% 50%" }, 4.8);
      tl.to("#s6-num", { scale: 1, duration: 0.5, ease: "sine.inOut" }, 5.4);''')

# ---------- 07 your date ----------
frame("07-your-date", 6, "#F4F6FB",
      f'''#s7-label {{ {CAP} top: 190px; font-size: 54px; color: #1D4ED8; }}
    #s7-label2 {{ {CAP} top: 190px; font-size: 54px; color: #1D4ED8; }}
    #s7-date {{ position: absolute; left: 0; right: 0; top: 440px; text-align: center; font-size: 150px; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }}
    .s7c {{ display: inline-block; }}
    #s7-under {{ position: absolute; left: 140px; top: 620px; width: 800px; height: 6px; background: #1D4ED8; border-radius: 3px; transform-origin: 0 50%; }}
    #s7-caret {{ position: absolute; left: 150px; top: 450px; width: 8px; height: 150px; background: #B42318; }}
    .s7r {{ position: absolute; left: 0; right: 0; text-align: center; font-size: 130px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }}
    .s7r small {{ font-size: 46px; font-weight: 600; color: #4A5568; margin-left: 24px; }}''',
      '''      <div id="s7-label" data-ru="введите дату рождения" data-en="enter your birth date">введите дату рождения</div>
      <div id="s7-label2" data-ru="и увидите свои числа" data-en="and see your own numbers">и увидите свои числа</div>
      <div id="s7-under"></div>
      <div id="s7-caret"></div>
      <div id="s7-date"></div>
      <div class="s7r" data-layout-allow-overlap id="s7-r0" style="top:340px">10 000<small data-ru="дней" data-en="days">дней</small></div>
      <div class="s7r" data-layout-allow-overlap id="s7-r1" style="top:530px">12 345<small data-ru="дней" data-en="days">дней</small></div>
      <div class="s7r" data-layout-allow-overlap id="s7-r2" style="top:720px">300 000<small data-ru="часов" data-en="hours">часов</small></div>''',
      '''      var TXT = "15.05.1990", host = document.getElementById("s7-date");
      for (var i = 0; i < TXT.length; i++) { var sp = document.createElement("span"); sp.className = "s7c"; sp.setAttribute("data-layout-allow-overlap", ""); sp.id = "s7-c" + i; sp.textContent = TXT.charAt(i); host.appendChild(sp); }
      gsap.set(["#s7-label2", "#s7-r0", "#s7-r1", "#s7-r2", "#s7-caret"], { opacity: 0 });
      gsap.set(".s7c", { opacity: 0 });
      tl.fromTo("#s7-label", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.1);
      tl.fromTo("#s7-under", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out" }, 0.3);
      // typing: characters appear on a steady tick, caret follows (approximate glyph advance)
      var ADV = [0.62,0.62,0.3,0.62,0.62,0.3,0.62,0.62,0.62,0.62].map(function (a) { return a * 150; });
      var total = 0; ADV.forEach(function (a) { total += a; });
      var x = 540 - total / 2;
      tl.set("#s7-caret", { opacity: 1, x: x - 150 }, 0.5);
      for (var i = 0; i < TXT.length; i++) {
        var t0 = 0.8 + i * 0.16;
        tl.set("#s7-c" + i, { opacity: 1 }, t0);
        x += ADV[i];
        tl.set("#s7-caret", { x: x - 150 }, t0);
      }
      // regroup: the typed date scatters, the label swaps, and your numbers stack in
      for (var i = 0; i < TXT.length; i++) {
        tl.to("#s7-c" + i, { y: (i % 2 ? 1 : -1) * 160, x: (i - 4.5) * 60, opacity: 0, rotation: (i - 4.5) * 12, duration: 0.5, ease: "power2.in" }, 2.8 + i * 0.03);
      }
      tl.to(["#s7-caret", "#s7-under"], { opacity: 0, duration: 0.2 }, 2.7);
      tl.to("#s7-label", { opacity: 0, y: -20, duration: 0.25 }, 2.8);
      tl.fromTo("#s7-label2", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 3.0);
      [0, 1, 2].forEach(function (k) {
        tl.fromTo("#s7-r" + k, { opacity: 0, y: 90, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.7)" }, 3.2 + k * 0.5);
      });''')

# ---------- 08 beats ----------
ICON_A = '''<svg viewBox="0 0 260 260" width="260" height="260"><rect x="10" y="60" width="240" height="130" rx="22" fill="#fff" stroke="#1D4ED8" stroke-width="8"/><text x="130" y="140" text-anchor="middle" font-family="Inter" font-weight="800" font-size="40" fill="#182033">15.05.1990</text><circle cx="222" cy="64" r="34" fill="#059669"/><path d="M205 64 L218 77 L241 50" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
ICON_B = '''<svg viewBox="0 0 260 260" width="260" height="260"><rect x="30" y="40" width="200" height="190" rx="22" fill="#fff" stroke="#1D4ED8" stroke-width="8"/><rect x="30" y="40" width="200" height="56" rx="22" fill="#1D4ED8"/><rect x="30" y="70" width="200" height="26" fill="#1D4ED8"/><rect x="72" y="18" width="14" height="42" rx="7" fill="#182033"/><rect x="174" y="18" width="14" height="42" rx="7" fill="#182033"/><text x="130" y="188" text-anchor="middle" font-family="Inter" font-weight="800" font-size="62" fill="#182033">.ics</text></svg>'''
ICON_C = '''<svg viewBox="0 0 260 260" width="260" height="260"><g fill="none" stroke="#1D4ED8" stroke-width="16" stroke-linecap="round"><path d="M30 100 A140 140 0 0 1 230 100"/><path d="M62 134 A92 92 0 0 1 198 134"/><path d="M94 168 A46 46 0 0 1 166 168"/></g><circle cx="130" cy="200" r="14" fill="#1D4ED8"/><path d="M40 230 L220 30" stroke="#B42318" stroke-width="14" stroke-linecap="round" id="s8-slash"/></svg>'''
frame("08-beats", 6, "#F4F6FB",
      '''.s8b { position: absolute; inset: 0; }
    .s8i { position: absolute; left: 410px; top: 190px; width: 260px; height: 260px; }
    .s8t { position: absolute; left: 90px; right: 90px; top: 540px; text-align: center; font-size: 92px; font-weight: 800; line-height: 1.08; letter-spacing: -0.02em; }
    .s8dot { position: absolute; top: 880px; width: 18px; height: 18px; border-radius: 9px; background: #B9C4D8; }''',
      f'''      <div class="s8b" id="s8-bA"><div class="s8i" id="s8-iA">{ICON_A}</div><div class="s8t" id="s8-tA" data-ru="Запоминает вашу дату" data-en="It remembers your date">Запоминает вашу дату</div></div>
      <div class="s8b" id="s8-bB"><div class="s8i" id="s8-iB">{ICON_B}</div><div class="s8t" id="s8-tB" data-ru="Добавьте в свой календарь" data-en="Add it to your calendar">Добавьте в свой календарь</div></div>
      <div class="s8b" id="s8-bC"><div class="s8i" id="s8-iC">{ICON_C}</div><div class="s8t" id="s8-tC" data-ru="Работает без интернета" data-en="Works offline">Работает без интернета</div></div>
      <div class="s8dot" id="s8-p0" style="left:489px"></div><div class="s8dot" id="s8-p1" style="left:531px"></div><div class="s8dot" id="s8-p2" style="left:573px"></div>''',
      '''      ["B", "C"].forEach(function (k) { gsap.set("#s8-b" + k, { opacity: 0 }); });
      function inB(k, t) {
        tl.set("#s8-b" + k, { opacity: 1 }, t);
        tl.fromTo("#s8-i" + k, { scale: 0.3, rotation: -12, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.55, ease: "back.out(2)" }, t);
        tl.fromTo("#s8-t" + k, { y: 70, opacity: 0, filter: "blur(10px)" }, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, ease: "power3.out" }, t + 0.15);
      }
      function outB(k, t) {
        tl.to("#s8-t" + k, { y: -60, opacity: 0, filter: "blur(10px)", duration: 0.25, ease: "power2.in" }, t);
        tl.to("#s8-i" + k, { scale: 0.5, opacity: 0, duration: 0.25, ease: "power2.in" }, t);
      }
      inB("A", 0.15);
      tl.fromTo("#s8-iA", { y: 0 }, { y: -10, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.9);
      outB("A", 1.75); inB("B", 2.0);
      outB("B", 3.75); inB("C", 4.0);
      tl.fromTo("#s8-slash", { strokeDasharray: 300, strokeDashoffset: 300 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.out" }, 4.5);
      var on = [[0.0, 2.0], [2.0, 4.0], [4.0, 6.0]];
      on.forEach(function (w, i) { tl.to("#s8-p" + i, { backgroundColor: "#1D4ED8", scale: 1.4, duration: 0.2 }, w[0] + 0.1); });''')

# ---------- 09 finale ----------
frame("09-finale", 6, "#F4F6FB",
      f'''#s9-tag {{ position: absolute; left: 60px; right: 60px; top: 330px; text-align: center; white-space: nowrap; font-size: 74px; font-weight: 800; line-height: 1.05; letter-spacing: -0.02em; transform-origin: 50% 0; }}
    #s9-tag span {{ display: block; }}
    #s9-tag span.s9b {{ color: #1D4ED8; }}
    .s9f {{ position: absolute; font-size: 64px; font-weight: 800; color: #1D4ED8; opacity: 0.12; font-variant-numeric: tabular-nums; white-space: nowrap; }}
    #s9-icon {{ position: absolute; left: 440px; top: 430px; width: 200px; height: 200px; border-radius: 44px; }}
    #s9-name {{ {CAP} top: 670px; font-size: 80px; font-weight: 800; letter-spacing: -0.02em; }}
    #s9-url {{ position: absolute; left: 0; right: 0; top: 790px; text-align: center; }}
    #s9-url span {{ display: inline-block; background: #1D4ED8; color: #fff; font-size: 44px; font-weight: 700; padding: 18px 38px; border-radius: 100px; }}''',
      '''      <div class="s9f" id="s9-f0" style="left:70px;top:262px">11 111</div>
      <div class="s9f" id="s9-f1" style="left:760px;top:262px">12 345</div>
      <div class="s9f" id="s9-f2" style="left:70px;top:950px">12 321</div>
      <div class="s9f" id="s9-f3" style="left:790px;top:950px">10 000</div>
      <div class="s9f" id="s9-f4" style="left:410px;top:950px">300 000</div>
      <div id="s9-tag"><span id="s9-t1" data-ru="У каждого есть свои." data-en="Everyone has their own.">У каждого есть свои.</span><span id="s9-t2" class="s9b" data-ru="Найдите их." data-en="Find yours.">Найдите их.</span></div>
      <img id="s9-icon" src="assets/icon-512.png" alt="">
      <div id="s9-name" data-ru="Календарь юбилеев" data-en="Jubilee Calendar">Календарь юбилеев</div>
      <div id="s9-url"><span>anniversary-calendar.hitty-missy.ru</span></div>''',
      '''      gsap.set(["#s9-icon", "#s9-name", "#s9-url"], { opacity: 0 });
      for (var k = 0; k < 5; k++) tl.fromTo("#s9-f" + k, { opacity: 0, y: 30 }, { opacity: 0.12, y: 0, duration: 0.8, ease: "power2.out" }, 0.1 + k * 0.15);
      for (var k = 0; k < 5; k++) tl.to("#s9-f" + k, { y: (k % 2 ? 1 : -1) * 18, duration: 2.6, ease: "sine.inOut" }, 1.0);
      tl.fromTo("#s9-t1", { opacity: 0, y: 60, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }, 0.2);
      tl.fromTo("#s9-t2", { opacity: 0, scale: 0.6, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(2)" }, 1.0);
      // tagline moves up to make room for the call to action
      tl.to("#s9-tag", { y: -250, scale: 0.62, duration: 0.7, ease: "power3.inOut" }, 2.2);
      tl.fromTo("#s9-icon", { opacity: 0, scale: 0.4, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.8)" }, 2.6);
      tl.fromTo("#s9-name", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 3.0);
      tl.fromTo("#s9-url", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 3.4);''')
print("done")
