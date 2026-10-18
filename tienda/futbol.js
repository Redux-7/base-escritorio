// Tienda de Base · Fútbol 5 (vista desde arriba, cancha con paredes)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, seg, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || Object.assign(() => {}, { engine: () => ({ set() {}, stop() {} }) });
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const FW = 50, FH = 32, GOAL = 4.2, PR = 0.75, BR = 0.32; // cancha de fútbol 5 (metros)
  const LV = { facil: { n: 'Fácil', sp: 5.6, tackle: 0.9, aim: 0.22 }, normal: { n: 'Normal', sp: 6.4, tackle: 1.6, aim: 0.13 }, dificil: { n: 'Difícil', sp: 7.1, tackle: 2.6, aim: 0.07 } };
  const KITS = { celeste: ['#6cb4ee', '#ffffff'], rojo: ['#d62828', '#ffffff'], azul: ['#1f3f9a', '#f5c518'], verde: ['#1e8a4a', '#ffffff'], negro: ['#22252b', '#f2f2f2'], blanco: ['#f2f2f2', '#1f3f9a'], amarillo: ['#f5c518', '#1f3f9a'], naranja: ['#ff7a1a', '#222'] };
  const MINS = { 2: '2 min', 4: '4 min', 6: '6 min' };
  const hyp = Math.hypot;

  function futbol(H) {
    let lv = LV[H.get().lv] ? H.get().lv : 'normal', mins = +H.get().mins || 4;
    const root = h('div', { class: 'mg-move' });
    const cv = h('canvas', { class: 'mv-cv' }); root.append(cv);
    const hud = h('div', { class: 'mv-hud fb-hud' }), msg = h('div', { class: 'sn-msg' });
    root.append(hud, msg); msg.hidden = true;
    const ctx = cv.getContext('2d');
    let W = 800, Hh = 500, lastSz = '', rf = 0, S = 20, OX = 0, OY = 0;
    const fit = () => { W = Math.max(320, root.clientWidth); Hh = Math.max(240, root.clientHeight); const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); S = Math.min((W - 40) / (FW + 4), (Hh - 70) / (FH + 2)); OX = (W - FW * S) / 2; OY = (Hh - FH * S) / 2 + 22; draw(); };
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; cancelAnimationFrame(rf); rf = requestAnimationFrame(fit); }).observe(root);

    let teams, players, ball, owner, ctrl, score, clock, half, state, pause = 0, keys = {}, raf = 0, lastT = 0, kickT = 0, shootHold = 0, banner = '', bannerT = 0, lastTouch = null;
    function kitFor() {
      const mine = KITS[H.get().skin] ? H.get().skin : 'celeste';
      const others = Object.keys(KITS).filter(k => k !== mine && k !== 'verde' && !(mine === 'blanco' && k === 'celeste') && !(mine === 'celeste' && k === 'blanco'));
      return [mine, others[Math.floor(Math.random() * others.length)]];
    }
    // posiciones base (fracción de la mitad propia): arquero, 2 defensores, 2 delanteros
    const FORM = [[0.04, 0.5], [0.3, 0.28], [0.3, 0.72], [0.62, 0.35], [0.62, 0.65]];
    function newGame() {
      closeOver(root);
      const [k0, k1] = kitFor();
      teams = [{ kit: KITS[k0], dir: 1, name: 'Vos' }, { kit: KITS[k1], dir: -1, name: 'La compu' }];
      players = [];
      for (let t = 0; t < 2; t++) FORM.forEach((f, i) => players.push({ t, i, gk: i === 0, x: 0, y: 0, vx: 0, vy: 0, fx: teams[t].dir, fy: 0, num: i + 1, stun: 0 }));
      score = [0, 0]; clock = 0; half = 1; state = 'run';
      kickoff(Math.random() < 0.5 ? 0 : 1);
      start(); status();
    }
    function home(p, attacking) {
      const [fx, fy] = FORM[p.i], d = teams[p.t].dir;
      let x = fx * (FW / 2) * (attacking && !p.gk ? 1.35 : 1);
      x = d === 1 ? x : FW - x;
      return [x, fy * FH];
    }
    function kickoff(t) {
      for (const p of players) { const [x, y] = home(p, false); p.x = p.t === 0 ? Math.min(x, FW / 2 - 1.5) : Math.max(x, FW / 2 + 1.5); p.y = y; p.vx = p.vy = 0; p.stun = 0; }
      const k = players.find(p => p.t === t && p.i === 3); k.x = FW / 2 - teams[t].dir * 0.9; k.y = FH / 2;
      ball = { x: FW / 2, y: FH / 2, vx: 0, vy: 0, z: 0, vz: 0 }; owner = null; kickT = 0; pause = 1.2; setTimeout(() => SFX('whistle'), 900);
      ctrl = players.find(p => p.t === 0 && p.i === 3);
    }
    function status() { H.status([`${teams[0].name} ${score[0]} - ${score[1]} ${teams[1].name}`, `${half}º tiempo`, H.get().wins ? `Ganados ${H.get().wins}` : '']); }
    function say(t, s = 1.6) { banner = t; bannerT = s; }
    function start() { cancelAnimationFrame(raf); lastT = 0; const fr = (t) => { const dt = Math.min(0.035, lastT ? (t - lastT) / 1000 : 0.016); lastT = t; if (state === 'run') step(dt); draw(); if (state !== 'over') raf = requestAnimationFrame(fr); }; raf = requestAnimationFrame(fr); }

    function kick(p, tx, ty, power, lob) {
      const dx = tx - p.x, dy = ty - p.y, L = hyp(dx, dy) || 1;
      ball.x = p.x + dx / L * (PR + BR + 0.05); ball.y = p.y + dy / L * (PR + BR + 0.05);
      ball.vx = dx / L * power; ball.vy = dy / L * power; ball.vz = lob ? Math.min(7, power * 0.35) : 0;
      owner = null; kickT = 0.28; lastTouch = p; SFX(power > 14 ? 'hit' : 'tap');
    }
    const goalX = (t) => teams[t].dir === 1 ? FW : 0;
    function shoot(p, power) {
      const gx = goalX(p.t), spread = p.t === 1 ? LV[lv].aim : 0.05;
      let ty = FH / 2 + (Math.random() - 0.5) * GOAL * 0.85;
      if (p.t === 0) { const up = keys.up ? -1 : keys.down ? 1 : 0; ty = FH / 2 + up * GOAL * 0.36 + (Math.random() - 0.5) * GOAL * 0.3; }
      ty += (Math.random() - 0.5) * GOAL * spread * 4;
      kick(p, gx, ty, power, false);
    }
    function bestPass(p, dirx, diry) {
      let best = null, bs = -1e9;
      for (const q of players) {
        if (q.t !== p.t || q === p || q.gk && hyp(q.x - p.x, q.y - p.y) > 14) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d = hyp(dx, dy); if (d < 2) continue;
        let sc = -d * 0.15 + (dx * teams[p.t].dir) * 0.12;
        if (dirx || diry) sc += ((dx * dirx + dy * diry) / d) * 6;
        for (const o of players) if (o.t !== p.t) { const t = Math.max(0, Math.min(1, ((o.x - p.x) * dx + (o.y - p.y) * dy) / (d * d))); const cx = p.x + dx * t, cy = p.y + dy * t; if (hyp(o.x - cx, o.y - cy) < 1.3) sc -= 4; }
        if (sc > bs) { bs = sc; best = q; }
      }
      return best;
    }
    function pass(p, dirx, diry) {
      const q = bestPass(p, dirx, diry); if (!q) return false;
      const d = hyp(q.x - p.x, q.y - p.y), lead = 0.25;
      kick(p, q.x + q.vx * lead, q.y + q.vy * lead, Math.min(19, 7 + d * 0.75), d > 16);
      if (p.t === 0) ctrl = q;
      return true;
    }

    function moveTo(p, tx, ty, sp, dt) {
      const dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy);
      const want = d < 0.3 ? 0 : Math.min(sp, d * 2.2);
      const ux = d ? dx / d : 0, uy = d ? dy / d : 0;
      p.vx += (ux * want - p.vx) * Math.min(1, dt * 7); p.vy += (uy * want - p.vy) * Math.min(1, dt * 7);
    }
    function aiPlayer(p, dt) {
      const L = LV[lv], sp = (p.t === 0 ? 6.6 : L.sp) * (p.gk ? 0.85 : 1), mine = owner && owner.t === p.t, dir = teams[p.t].dir;
      if (p.gk) {
        const gx = dir === 1 ? 0.9 : FW - 0.9, ty = Math.max(FH / 2 - GOAL / 2 - 0.4, Math.min(FH / 2 + GOAL / 2 + 0.4, ball.y));
        const danger = hyp(ball.x - gx, ball.y - FH / 2) < 6 && owner !== p;
        if (danger && !mine) moveTo(p, ball.x, ball.y, sp * 1.1, dt); else moveTo(p, gx + dir * Math.min(2.2, Math.abs(ball.x - gx) * 0.08), ty, sp, dt);
        return;
      }
      if (owner === p) {
        // con la pelota: avanzar, patear o pasarla
        const gx = goalX(p.t), dGoal = hyp(gx - p.x, FH / 2 - p.y);
        const press = players.some(o => o.t !== p.t && hyp(o.x - p.x, o.y - p.y) < 2.4);
        p.think = (p.think || 0) - dt;
        if (dGoal < 13 && p.think <= 0) { shoot(p, 22 + Math.random() * 4); return; }
        if (press && p.think <= 0 && Math.random() < dt * 4) { if (pass(p, dir, 0)) return; }
        if (p.think <= 0 && Math.random() < dt * 0.6) { if (pass(p, dir, 0)) return; }
        let ty = FH / 2 + Math.sin(clock * 0.9 + p.i) * 5;
        for (const o of players) if (o.t !== p.t && Math.abs(o.x - p.x) < 4 && (o.x - p.x) * dir > 0) ty += (p.y - o.y) > 0 ? 3 : -3;
        moveTo(p, gx, Math.max(2, Math.min(FH - 2, ty)), sp * 0.92, dt);
        return;
      }
      if (!mine) {
        // sin la pelota: el más cercano va a buscarla, los demás marcan
        const chasers = players.filter(q => q.t === p.t && !q.gk && !(p.t === 0 && q === ctrl)).sort((a, b) => hyp(a.x - ball.x, a.y - ball.y) - hyp(b.x - ball.x, b.y - ball.y));
        if (chasers[0] === p || (chasers[1] === p && hyp(ball.x - goalX(1 - p.t), ball.y - FH / 2) < 14)) { moveTo(p, ball.x + ball.vx * 0.3, ball.y + ball.vy * 0.3, sp, dt); return; }
        const [hx, hy] = home(p, false);
        moveTo(p, hx * 0.6 + ball.x * 0.4 - dir * 3, hy * 0.7 + ball.y * 0.3, sp * 0.85, dt);
        return;
      }
      // mi equipo tiene la pelota: buscar espacio adelante
      const [hx, hy] = home(p, true);
      moveTo(p, Math.max(2, Math.min(FW - 2, hx * 0.55 + (ball.x + dir * 8) * 0.45)), hy, sp * 0.9, dt);
    }

    function step(dt) {
      if (bannerT > 0) bannerT -= dt;
      if (pause > 0) { pause -= dt; return; }
      clock += dt;
      if (clock >= mins * 30 * half) {
        if (half === 1) { half = 2; SFX('whistle'); say('Fin del primer tiempo', 2); kickoff(1); status(); return; }
        return end();
      }
      kickT -= dt;
      // jugador que manejás
      if (!owner || owner.t !== 0) {
        // cambia solo al más cercano a la pelota (o con Q)
        if (keys.sw) { keys.sw = false; ctrl = players.filter(p => p.t === 0 && !p.gk && p !== ctrl).sort((a, b) => hyp(a.x - ball.x, a.y - ball.y) - hyp(b.x - ball.x, b.y - ball.y))[0] || ctrl; }
        else if (!ctrl || (clock % 0.4 < dt && hyp(ctrl.x - ball.x, ctrl.y - ball.y) > 4)) { const n = players.filter(p => p.t === 0 && !p.gk).sort((a, b) => hyp(a.x - ball.x, a.y - ball.y) - hyp(b.x - ball.x, b.y - ball.y))[0]; if (n !== ctrl && hyp(n.x - ball.x, n.y - ball.y) + 2 < hyp(ctrl.x - ball.x, ctrl.y - ball.y)) ctrl = n; }
      } else ctrl = owner;
      const ix = (keys.left ? -1 : 0) + (keys.right ? 1 : 0), iy = (keys.up ? -1 : 0) + (keys.down ? 1 : 0), il = hyp(ix, iy) || 1;
      const sp = keys.run ? 8 : 6.6;
      for (const p of players) {
        if (p.stun > 0) { p.stun -= dt; p.vx *= 0.9; p.vy *= 0.9; continue; }
        if (p === ctrl) {
          p.vx += (ix / il * sp - p.vx) * Math.min(1, dt * 9); p.vy += (iy / il * sp - p.vy) * Math.min(1, dt * 9);
        } else aiPlayer(p, dt);
      }
      for (const p of players) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.x = Math.max(PR, Math.min(FW - PR, p.x)); p.y = Math.max(PR, Math.min(FH - PR, p.y));
        if (hyp(p.vx, p.vy) > 0.5) { const l = hyp(p.vx, p.vy); p.fx = p.vx / l; p.fy = p.vy / l; }
      }
      // que no se encimen
      for (let i = 0; i < players.length; i++) for (let j = i + 1; j < players.length; j++) { const a = players[i], b = players[j], dx = b.x - a.x, dy = b.y - a.y, d = hyp(dx, dy); if (d < PR * 2 && d > 0) { const pu = (PR * 2 - d) / 2; a.x -= dx / d * pu; a.y -= dy / d * pu; b.x += dx / d * pu; b.y += dy / d * pu; } }
      // patear: cargar con D y soltar
      if (ctrl && owner === ctrl) {
        if (keys.shoot) shootHold = Math.min(1, shootHold + dt * 1.6);
        else if (shootHold > 0) { shoot(ctrl, 14 + shootHold * 14); shootHold = 0; }
      } else if (!keys.shoot) shootHold = 0;
      // pelota
      if (owner) {
        const l = hyp(owner.vx, owner.vy);
        const fx = l > 0.3 ? owner.vx / l : owner.fx, fy = l > 0.3 ? owner.vy / l : owner.fy;
        ball.x += ((owner.x + fx * (PR + BR + 0.1)) - ball.x) * Math.min(1, dt * 18); ball.y += ((owner.y + fy * (PR + BR + 0.1)) - ball.y) * Math.min(1, dt * 18);
        ball.vx = owner.vx; ball.vy = owner.vy; lastTouch = owner;
        // quite: los rivales cerca pueden robarla
        for (const o of players) if (o.t !== owner.t && o.stun <= 0 && hyp(o.x - owner.x, o.y - owner.y) < 1.45) {
          const rate = o.t === 1 ? LV[lv].tackle : 2.2;
          if (Math.random() < rate * dt) { owner.stun = 0.45; owner = o; kickT = 0.2; if (o.t === 0) ctrl = o; break; }
        }
      } else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.z = Math.max(0, ball.z + ball.vz * dt); ball.vz = ball.z > 0 ? ball.vz - 18 * dt : 0;
        const fr = ball.z > 0 ? 0.6 : 4.2, v = hyp(ball.vx, ball.vy);
        if (v > 0) { const nv = Math.max(0, v - fr * dt); ball.vx *= nv / v; ball.vy *= nv / v; }
        // gol
        const inGoal = Math.abs(ball.y - FH / 2) < GOAL / 2 && ball.z < 2;
        if (ball.x < 0 && inGoal) return goal(1);
        if (ball.x > FW && inGoal) return goal(0);
        // paredes (en el fútbol 5 la pelota rebota)
        if (ball.y < BR) { ball.y = BR; ball.vy = Math.abs(ball.vy) * 0.75; }
        if (ball.y > FH - BR) { ball.y = FH - BR; if (ball.vy > 4) SFX('bounce'); ball.vy = -Math.abs(ball.vy) * 0.75; }
        if (!inGoal) { if (ball.x < BR) { ball.x = BR; ball.vx = Math.abs(ball.vx) * 0.75; } if (ball.x > FW - BR) { ball.x = FW - BR; ball.vx = -Math.abs(ball.vx) * 0.75; } }
        // agarrar la pelota
        if (kickT <= 0 && ball.z < 0.8) {
          let best = null, bd = PR + BR + 0.35;
          for (const p of players) { if (p.stun > 0) continue; const d = hyp(p.x - ball.x, p.y - ball.y); if (d < bd) { bd = d; best = p; } }
          if (best) {
            // el arquero ataja los remates fuertes
            if (best.gk && hyp(ball.vx, ball.vy) > 9) { say('¡Atajada!', 1); SFX('pop'); }
            owner = best; if (best.t === 0) ctrl = best;
          }
        }
      }
      // pase con Espacio
      if (keys.pass && owner === ctrl && ctrl) { keys.pass = false; pass(ctrl, ix / il * (ix || iy ? 1 : 0), iy / il * (ix || iy ? 1 : 0)) || shoot(ctrl, 18); }
      else if (keys.pass && ctrl && owner && owner.t === 1) { keys.pass = false; if (hyp(ctrl.x - owner.x, ctrl.y - owner.y) < 2.2) { if (Math.random() < 0.55) { owner.stun = 0.6; owner = ctrl; kickT = 0.2; say('¡Quite!', 0.8); } else { ctrl.stun = 0.5; } } }
      else keys.pass = false;
      hudPaint();
    }
    function goal(t) {
      score[t]++; status();
      say(t === 0 ? '¡GOOOL!' : 'Gol de la compu', 2.2); if (t !== 0) SFX('bad');
      if (t === 0) confetti(root);
      kickoff(1 - t); pause = 2.2;
    }
    function end() {
      state = 'over'; draw();
      const s = H.get(); s.games = (s.games || 0) + 1; const won = score[0] > score[1]; if (won) s.wins = (s.wins || 0) + 1; s.gf = (s.gf || 0) + score[0]; H.set(s); status();
      if (won) confetti(root);
      overlay(root, won ? '¡Ganaste!' : score[0] === score[1] ? 'Empate' : 'Perdiste', `${score[0]} a ${score[1]}`, [btn('Revancha', newGame, 'primary')]);
    }
    function hudPaint() {
      const t = Math.max(0, mins * 30 * half - clock), m = Math.floor(t / 60), sec = Math.floor(t % 60);
      hud.innerHTML = `<span class="fb-sc"><i style="background:${teams[0].kit[0]}"></i>${teams[0].name} <b>${score[0]} - ${score[1]}</b> ${teams[1].name}<i style="background:${teams[1].kit[0]}"></i></span><span>${half}º · ${m}:${String(sec).padStart(2, '0')}</span>` + (shootHold > 0 ? `<span class="mv-fuel"><i style="width:${shootHold * 100}%;background:linear-gradient(90deg,#f5c518,#e8202a)"></i></span>` : '');
    }

    // ---------- dibujo ----------
    const X = (x) => OX + x * S, Y = (y) => OY + y * S;
    function draw() {
      if (!players) return;
      ctx.fillStyle = '#16301f'; ctx.fillRect(0, 0, W, Hh);
      // pasto a franjas
      for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2f8a43' : '#2a7f3d'; ctx.fillRect(X(i * FW / 10), Y(0), FW / 10 * S + 1, FH * S); }
      // paredes
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = S * 0.5; ctx.strokeRect(X(-0.3), Y(-0.3), (FW + 0.6) * S, (FH + 0.6) * S);
      // líneas
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1.5, S * 0.1);
      ctx.strokeRect(X(0), Y(0), FW * S, FH * S);
      ctx.beginPath(); ctx.moveTo(X(FW / 2), Y(0)); ctx.lineTo(X(FW / 2), Y(FH)); ctx.stroke();
      ctx.beginPath(); ctx.arc(X(FW / 2), Y(FH / 2), 4 * S, 0, 7); ctx.stroke();
      for (const [gx, d] of [[0, 1], [FW, -1]]) {
        ctx.beginPath(); ctx.arc(X(gx), Y(FH / 2), 6 * S, d === 1 ? -Math.PI / 2 : Math.PI / 2, d === 1 ? Math.PI / 2 : Math.PI * 1.5, false); ctx.stroke();
        ctx.beginPath(); ctx.arc(X(gx + d * 6), Y(FH / 2), S * 0.18, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
        // arco con red
        const gw = 1.4 * S;
        ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(d === 1 ? X(gx) - gw : X(gx), Y(FH / 2 - GOAL / 2), gw, GOAL * S);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
        for (let k = 0; k <= GOAL; k += 0.5) { ctx.beginPath(); ctx.moveTo(X(gx), Y(FH / 2 - GOAL / 2 + k)); ctx.lineTo(X(gx) - d * gw, Y(FH / 2 - GOAL / 2 + k)); ctx.stroke(); }
        ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.18; ctx.beginPath(); ctx.moveTo(X(gx), Y(FH / 2 - GOAL / 2)); ctx.lineTo(X(gx) - d * gw, Y(FH / 2 - GOAL / 2)); ctx.lineTo(X(gx) - d * gw, Y(FH / 2 + GOAL / 2)); ctx.lineTo(X(gx), Y(FH / 2 + GOAL / 2)); ctx.stroke();
      }
      // jugadores
      for (const p of players) {
        const [c1, c2] = teams[p.t].kit, gk = p.gk;
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(X(p.x) + S * 0.15, Y(p.y) + S * 0.25, PR * S, PR * S * 0.8, 0, 0, 7); ctx.fill();
        if (p === ctrl) { ctx.strokeStyle = '#fff200'; ctx.lineWidth = Math.max(2, S * 0.12); ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), (PR + 0.35) * S, 0, 7); ctx.stroke(); }
        ctx.fillStyle = gk ? (p.t === 0 ? '#2b2b2b' : '#e8e8e8') : c1; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), PR * S, 0, 7); ctx.fill();
        ctx.strokeStyle = gk ? '#f5c518' : c2; ctx.lineWidth = Math.max(1.5, S * 0.12); ctx.stroke();
        // cabeza mirando hacia donde va
        ctx.fillStyle = '#6b4a35'; ctx.beginPath(); ctx.arc(X(p.x + p.fx * 0.18), Y(p.y + p.fy * 0.18), PR * S * 0.42, 0, 7); ctx.fill();
        ctx.fillStyle = gk ? '#f5c518' : c2; ctx.font = `800 ${Math.max(9, S * 0.55)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.num, X(p.x), Y(p.y) - PR * S - S * 0.45);
      }
      // pelota (con sombra si va por el aire)
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(X(ball.x) + ball.z * S * 0.3, Y(ball.y) + ball.z * S * 0.4, BR * S, 0, 7); ctx.fill();
      const bs = BR * S * (1 + ball.z * 0.12);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(ball.x), Y(ball.y) - ball.z * S * 0.4, bs, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(X(ball.x), Y(ball.y) - ball.z * S * 0.4, bs * 0.38, 0, 7); ctx.fill();
      if (bannerT > 0) { ctx.globalAlpha = Math.min(1, bannerT * 2); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, Hh / 2 - 46, W, 92); ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.min(64, W * 0.07)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(banner, W / 2, Hh / 2); ctx.globalAlpha = 1; }
    }

    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Shift: 'run' };
    addEventListener('keyup', (e) => { const k = KEYS[e.key]; if (k) keys[k] = false; if (e.key === 'd' || e.key === 'D' || e.key === 'x' || e.key === 'X') keys.shoot = false; });
    const key = (e) => {
      if (e.key === 'p' || e.key === 'P') { if (state === 'run') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } else if (state === 'pause') { state = 'run'; msg.hidden = true; } return true; }
      if (e.key === ' ') { if (!e.repeat) keys.pass = true; return true; }
      if (e.key === 'd' || e.key === 'D' || e.key === 'x' || e.key === 'X') { keys.shoot = true; return true; }
      if (e.key === 'q' || e.key === 'Q') { keys.sw = true; return true; }
      const k = KEYS[e.key]; if (!k) return false; keys[k] = true; return true;
    };
    const tools = [
      seg(Object.entries(MINS).map(([k, v]) => [k, v]), String(mins), (v) => { mins = +v; const s = H.get(); s.mins = mins; H.set(s); newGame(); }),
      seg(Object.entries(LV).map(([k, v]) => [k, v.n]), lv, (v) => { lv = v; const s = H.get(); s.lv = v; H.set(s); newGame(); }),
      btn('Nuevo partido', newGame)
    ];
    requestAnimationFrame(() => { fit(); newGame(); });
    return {
      el: root, tools, key, setSkin: () => newGame(),
      help: 'Flechas: mover · Shift: correr · Espacio: pase (o quite si la tiene el rival) · D: patear (mantené para más fuerza; ↑ ↓ apuntan) · Q: cambiar de jugador · P: pausa. La pelota rebota en las paredes, como en el fútbol 5.',
      hide: () => { if (state === 'run') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } keys = {}; }
    };
  }

  BM.register({ id: 'futbol', n: 'Fútbol 5', d: 'Partido de fútbol 5 contra la compu: pases, gambetas y goles.', c: '#2a7f3d', create: futbol, skinLabel: 'Camiseta',
    skins: [['celeste', 'Celeste', '#6cb4ee'], ['rojo', 'Roja', '#d62828'], ['azul', 'Azul y oro', '#1f3f9a'], ['verde', 'Verde', '#1e8a4a'], ['negro', 'Negra', '#22252b'], ['blanco', 'Blanca', '#f2f2f2'], ['amarillo', 'Amarilla', '#f5c518'], ['naranja', 'Naranja', '#ff7a1a']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#2a7f3d"/><rect x="0" y="0" width="16" height="64" fill="#2f8a43"/><rect x="32" y="0" width="16" height="64" fill="#2f8a43"/><rect x="5" y="9" width="54" height="46" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M32 9v46" stroke="#fff" stroke-width="1.6"/><circle cx="32" cy="32" r="7" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="22" cy="26" r="3.4" fill="#6cb4ee" stroke="#fff"/><circle cx="42" cy="38" r="3.4" fill="#d62828" stroke="#fff"/><circle cx="31" cy="31" r="2" fill="#fff" stroke="#222" stroke-width=".8"/></svg>',
    best: (s) => s.games ? `${s.wins || 0} ganados de ${s.games} · ${s.gf || 0} goles` : 'Nunca jugaste' });
})();
