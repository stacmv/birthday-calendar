/* shared odometer lib (inlined into each frame by build-frames.mjs) */
var HF_LANG = (function () {
  function ok(v) { return v === "en" || v === "ru" ? v : null; }
  try { var o = window.__hfVariables; if (o && ok(o.lang)) return o.lang; } catch (e) {}
  try { var v = window.__hyperframes.getVariables(); if (v && ok(v.lang)) return v.lang; } catch (e) {}
  try {
    var d = JSON.parse(document.documentElement.getAttribute("data-composition-variables") || "[]");
    for (var i = 0; i < d.length; i++) if (d[i].id === "lang" && ok(d[i]["default"])) return d[i]["default"];
  } catch (e) {}
  return "ru";
})();
function ease3(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
/* build an odometer inside host. opts: n digits, cw, ch, fs, sep ("" gap | ","), hideLead */
function makeOdo(host, o) {
  var n = o.n, drums = [], seps = [];
  host.classList.add("od-row");
  for (var k = n - 1; k >= 0; k--) {
    var d = document.createElement("div");
    d.className = "od-drum";
    d.style.cssText = "width:" + o.cw + "px;height:" + o.ch + "px;font-size:" + o.fs + "px;line-height:" + o.ch + "px";
    var s = document.createElement("div");
    s.className = "od-strip";
    var h = "";
    for (var i = 0; i < 2; i++) h += '<div class="od-cell" style="height:' + o.ch + 'px">' + (i % 10) + "</div>";
    s.innerHTML = h; s.setAttribute("data-layout-allow-occlusion", ""); s.children[0].setAttribute("data-layout-allow-occlusion", ""); s.children[1].setAttribute("data-layout-allow-occlusion", "");
    d.appendChild(s);
    host.appendChild(d);
    drums[k] = { d: d, s: s, a: s.children[0], b: s.children[1] };
    if (k > 0 && k % 3 === 0) {
      var sp = document.createElement("div");
      sp.className = "od-sep";
      sp.style.cssText = "width:" + (o.sep ? o.cw * 0.3 : o.cw * 0.2) + "px;height:" + o.ch + "px;font-size:" + (o.fs * 0.8) + "px;line-height:1;display:flex;align-items:flex-end;justify-content:center;padding-bottom:" + (o.ch * 0.1) + "px";
      sp.textContent = o.sep || "";
      host.appendChild(sp);
      seps[k] = sp;
    }
  }
  function pos(k, v) {
    var x = v / Math.pow(10, k), fl = Math.floor(x), fr = x - fl;
    if (k === 0) return x;
    var t = 1 - 1 / Math.pow(10, k);
    return fl + ease3((fr - t) / (1 - t));
  }
  return {
    drums: drums, el: host,
    /* v1 = value now, v0 = value a moment earlier (for blur) */
    draw: function (v1, v0, hl) {
      for (var k = 0; k < n; k++) {
        var p1 = pos(k, v1), p0 = pos(k, v0);
        var m = ((p1 % 10) + 10) % 10;
        var dr = drums[k];
        var blur = Math.min(9, Math.abs(p1 - p0) * o.ch * 0.45);
        var ii = Math.floor(m), ff = m - ii;
        var ta = String(ii % 10), tb = String((ii + 1) % 10);
        if (dr.a.textContent !== ta) dr.a.textContent = ta;
        if (dr.b.textContent !== tb) dr.b.textContent = tb;
        dr.b.style.visibility = ff > 0.003 ? "visible" : "hidden";
        dr.s.style.transform = "translateY(" + (-ff * o.ch).toFixed(2) + "px)";
        dr.s.style.filter = blur > 0.4 ? "blur(" + blur.toFixed(1) + "px)" : "none";
        var lead = o.hideLead && k > 0 && Math.floor(v1 / Math.pow(10, k)) === 0;
        dr.d.style.visibility = lead ? "hidden" : "visible";
        dr.d.classList.toggle("od-hl", !!hl);
        if (seps[k]) seps[k].style.visibility = (o.hideLead && Math.floor(v1 / Math.pow(10, k)) === 0) ? "hidden" : "visible";
      }
    }
  };
}
/* pure value function from ticks: base + sum of eased steps. steps: [{t,dur,add}] */
function stepsValue(base, steps, t) {
  var v = base;
  for (var i = 0; i < steps.length; i++) {
    var s = steps[i];
    var x = (t - s.t) / s.dur;
    if (x <= 0) continue;
    v += s.add * (x >= 1 ? 1 : 1 - Math.pow(1 - x, 3));
  }
  return v;
}
function beatRot(t, deg, P, dur) {
  P = P || 0.5; dur = dur || 0.18;
  var k = Math.floor(Math.max(0, t) / P), f = (t - k * P) / dur;
  return (k + (f >= 1 ? 1 : 1 - Math.pow(1 - f, 3))) * deg;
}
function makeDial(el, size, color) {
  var r = size / 2, s = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">';
  for (var i = 0; i < 60; i++) {
    var a = i * 6 * Math.PI / 180, big = i % 5 === 0, r1 = r - 4, r2 = r - (big ? 34 : 18);
    s += '<line x1="' + (r + Math.sin(a) * r1).toFixed(1) + '" y1="' + (r - Math.cos(a) * r1).toFixed(1) + '" x2="' + (r + Math.sin(a) * r2).toFixed(1) + '" y2="' + (r - Math.cos(a) * r2).toFixed(1) + '" stroke="' + color + '" stroke-width="' + (big ? 6 : 3) + '" stroke-linecap="round"/>';
  }
  el.innerHTML = s + "</svg>";
}
function pickLang() {
  var els = document.querySelectorAll("[data-l]");
  for (var i = 0; i < els.length; i++) if (els[i].getAttribute("data-l") !== HF_LANG) els[i].style.display = "none";
}
