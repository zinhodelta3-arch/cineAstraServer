"use client";

// Efeitos de luz e movimento do AstraSpin (mesmo papel do CinemaStyles).
const css = `
.astra-stage{--pw:112px;--gold:#f2c46d;box-shadow:0 30px 80px -30px rgba(242,196,109,.25)}
@media (min-width:640px){.astra-stage{--pw:148px}}
@media (min-width:1024px){.astra-stage{--pw:172px}}

/* Janela da roleta */
.astra-window{
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  background:radial-gradient(60% 120% at 50% 0%,rgba(242,196,109,.10),transparent 70%);
  transition:filter .5s ease;
}
.astra-stage[data-phase="hush"] .astra-window{filter:brightness(.5)}

/* Fila de pôsteres em repouso */
.astra-drift{animation:astra-drift 120s linear infinite}
@keyframes astra-drift{to{transform:translate3d(-50%,0,0)}}

.astra-poster{
  width:var(--pw);aspect-ratio:2/3;
  box-shadow:0 10px 24px rgba(0,0,0,.45);
  transition:transform .6s cubic-bezier(.2,.8,.2,1),opacity .6s ease,filter .6s ease;
}
.astra-win{transform:scale(1.12);z-index:2;box-shadow:0 0 0 2px var(--gold),0 20px 50px rgba(0,0,0,.6)}
.astra-dim{opacity:.28;filter:saturate(.4) blur(1px)}

/* Moldura central */
.astra-frame{
  position:absolute;left:50%;top:50%;pointer-events:none;
  width:calc(var(--pw) + 22px);height:calc(var(--pw) * 1.5 + 22px);
  transform:translate(-50%,-50%);
  border:2px solid var(--gold);border-radius:14px;
  box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 28px rgba(242,196,109,.45),inset 0 0 18px rgba(242,196,109,.2);
  opacity:.55;transition:opacity .4s ease,box-shadow .4s ease;
}
.astra-stage[data-phase="spinning"] .astra-frame{opacity:1;animation:astra-pulse .5s ease-in-out infinite alternate}
.astra-stage[data-phase="hush"] .astra-frame{opacity:.25}
.astra-stage[data-phase="flash"] .astra-frame,
.astra-stage[data-phase="revealed"] .astra-frame{
  opacity:1;
  box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 60px rgba(242,196,109,.85),inset 0 0 24px rgba(242,196,109,.35);
}
@keyframes astra-pulse{from{box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 18px rgba(242,196,109,.3)}to{box-shadow:0 0 0 1px rgba(0,0,0,.4),0 0 44px rgba(242,196,109,.75)}}

/* Holofote */
.astra-cone{
  position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;opacity:.45;transition:opacity .6s ease;
  background:conic-gradient(from 180deg at 50% -10%,transparent 156deg,rgba(255,232,170,.22) 172deg,rgba(255,232,170,.34) 180deg,rgba(255,232,170,.22) 188deg,transparent 204deg);
}
.astra-stage[data-phase="spinning"] .astra-cone{animation:astra-flicker .35s ease-in-out infinite alternate}
.astra-stage[data-phase="hush"] .astra-cone{opacity:.08}
.astra-stage[data-phase="flash"] .astra-cone,
.astra-stage[data-phase="revealed"] .astra-cone{opacity:1}
@keyframes astra-flicker{from{opacity:.35}to{opacity:.9}}

/* Clarão da revelação */
.astra-flash{
  position:absolute;inset:0;pointer-events:none;opacity:0;
  background:radial-gradient(circle at 50% 50%,#fff 0%,rgba(255,236,190,.8) 35%,transparent 70%);
}
.astra-stage[data-phase="flash"] .astra-flash{animation:astra-flash .9s ease-out}
@keyframes astra-flash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}

/* Lâmpadas da marquise */
.astra-bulbs{display:flex;justify-content:space-between;padding:0 18px}
.astra-bulb{
  width:8px;height:8px;border-radius:999px;background:var(--gold);
  box-shadow:0 0 8px 2px rgba(242,196,109,.7);opacity:.35;
}
.astra-stage[data-phase="idle"] .astra-bulb{animation:astra-chase 2.4s steps(1) infinite}
.astra-stage[data-phase="spinning"] .astra-bulb{animation:astra-chase .5s steps(1) infinite}
.astra-bulb:nth-child(even){animation-direction:reverse}
.astra-stage[data-phase="hush"] .astra-bulb{opacity:.06;box-shadow:none;animation:none}
.astra-stage[data-phase="flash"] .astra-bulb,
.astra-stage[data-phase="revealed"] .astra-bulb{opacity:1;animation:none}
@keyframes astra-chase{0%{opacity:1}50%{opacity:.2}100%{opacity:1}}

/* Ticket sendo impresso */
.astra-print{animation:astra-print .95s cubic-bezier(.22,.8,.2,1) both}
@keyframes astra-print{
  from{clip-path:inset(0 0 100% 0);transform:translateY(-28px)}
  to{clip-path:inset(-24px -24px -24px -24px);transform:none}
}

@media (prefers-reduced-motion:reduce){
  .astra-drift,.astra-bulb,.astra-frame,.astra-cone,.astra-flash,.astra-print{animation:none!important}
  .astra-poster,.astra-window{transition:none!important}
}
`;

export default function AstraSpinStyles() {
  return <style>{css}</style>;
}