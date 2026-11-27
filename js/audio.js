// Звук: маленький синтезатор на Web Audio — каждый звук из пары осцилляторов и шума, без файлов.
// Sfx.play(имя, вариант) — короткий звук события; Sfx.hum(0..1) — гул заряда поля (0 — тишина);
// M — выключить/включить звук (запоминается). Браузер разрешает звук только после первого жеста.
const Sfx = {
  ctx: null, out: null, hO: null, hG: null, last: {},
  muted: (() => { try { return localStorage.getItem('proto.mute') === '1'; } catch (e) { return false; } })(),
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    this.ctx = new C();
    this.out = this.ctx.createGain(); this.out.gain.value = this.muted ? 0 : .45; this.out.connect(this.ctx.destination);
    this.hO = this.ctx.createOscillator(); this.hG = this.ctx.createGain(); this.hO.type = 'triangle'; this.hG.gain.value = 0;
    this.hO.connect(this.hG); this.hG.connect(this.out); this.hO.start();
  },
  toggle() {
    this.muted = !this.muted; try { localStorage.setItem('proto.mute', this.muted ? '1' : '0'); } catch (e) { /* без хранилища */ }
    if (this.out) this.out.gain.value = this.muted ? 0 : .45;
    return this.muted;
  },
  // тон: форма, частота от f0 к f1 за dur секунд, громкость, задержка
  tone(type, f0, f1, dur, vol, at = 0) {
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.out); o.start(t); o.stop(t + dur + .03);
  },
  // шумовой щелчок/шорох через фильтр (lp — низкочастотный, иначе высокочастотный)
  noise(dur, vol, f, lp, at = 0) {
    const c = this.ctx, t = c.currentTime + at, n = Math.max(1, c.sampleRate * dur | 0), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; fl.type = lp ? 'lowpass' : 'highpass'; fl.frequency.value = f; g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(this.out); s.start(t);
  },
  arp(notes, step, dur, vol, type = 'triangle') { notes.forEach((f, i) => this.tone(type, f, f, dur, vol, i * step)); },
  // минимальный интервал между одинаковыми звуками — чтобы поток событий не превращался в треск
  GAP: { catch: .06, decay: .12, pop: .15, fizzle: .25, pert: .03, grab: .08, annih: .1, bounce: .15, bond: .05 },
  play(name, v = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (this.GAP[name] && now - (this.last[name] || -9) < this.GAP[name]) return;
    this.last[name] = now;
    const S = this.S[name]; if (S) S.call(this, v);
  },
  hum(q) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.hG.gain.setTargetAtTime(q > 0 && !this.muted ? .035 + .03 * q : 0, t, .04);
    if (q > 0) this.hO.frequency.setTargetAtTime(90 + 380 * q * q, t, .04);
  },
  S: {
    // «Молекулы»: связь — чистый тон, выше и с обертоном у кратной (n = 1…3); отскок — глухой толчок (v — сила удара 0…1)
    bond(n) { const f = [0, 523, 659, 784][n] || 523; this.tone('sine', f, f * 1.5, .1, .1); if (n > 1) this.tone('triangle', f * 2, f * 2, .12, .05, .05); },
    bounce(v) { this.tone('sine', 150, 80, .1, .05 + .07 * v); this.noise(.04, .05, 700, true); },
    snap() { this.noise(.045, .22, 3200); this.tone('square', 1600, 900, .035, .04); },
    fresh() { this.arp([659, 880, 1319], .075, .16, .14); },
    catch(c) { const f = [520, 620, 780, 1040][c] || 520; this.tone('sine', f, f * 1.25, .07, .05 + .03 * c); },
    pert(c) { const f = [330, 440, 587, 784][c] || 330; this.tone('triangle', f * .7, f, .12, .09); if (c === 3) this.tone('sine', f * 2, f * 2.5, .25, .05, .05); },
    bad() { this.tone('square', 220, 150, .16, .05); },
    grab() { this.tone('sine', 300, 440, .08, .08); },
    throw() { this.noise(.18, .1, 900, true); this.tone('sine', 500, 260, .15, .06); },
    collide() { this.tone('sine', 200, 50, .3, .3); this.noise(.14, .16, 1400); },
    pop() { this.tone('sine', 260, 120, .12, .06); },
    fizzle() { this.tone('sine', 240, 140, .15, .07); },
    annih() { this.tone('sine', 1200, 2200, .14, .1); this.noise(.08, .08, 4000); },
    decay() { this.tone('sine', 900, 480, .09, .05); },
    goal() { this.arp([784, 1047], .1, .2, .15); },
    star() { this.arp([988, 1319, 1568], .07, .18, .12); },
    overheat() { this.noise(.35, .2, 700, true); this.tone('sawtooth', 300, 70, .35, .08); },
    recolor() { this.tone('triangle', 440, 660, .12, .1); this.tone('triangle', 660, 990, .14, .08, .07); },
    upgrade() { this.arp([523, 659, 784, 1047], .065, .14, .12); },
    segment() { this.arp([392, 494, 587, 784], .08, .6, .1); },
    ignite() { this.tone('sawtooth', 80, 340, .8, .1); this.noise(.6, .12, 500, true); this.arp([523, 784, 1047], .15, .5, .07, 'sine'); },
    freeze() { this.tone('sine', 110, 220, 1.6, .12); this.tone('sine', 165, 330, 1.6, .07); },
  },
};
