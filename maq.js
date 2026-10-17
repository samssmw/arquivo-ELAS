/*
   MÁQUINA DO TEMPO — Arquivo E.L.A.S.
   Arquivo: maq.js

   O que este código faz:
   1. As setas (e o controle) trocam o ano, só entre os anos da lista ANOS.
      A seta fica cinza quando não existe ano maior/menor naquela direção.
   2. "PRONTO" confirma o ano e liga a máquina:
        - a tela branca escurece e roda uma animação de viagem;
        - a bolinha da barra anda até a posição do ano (anos antigos = esquerda);
        - os ponteiros dos relógios giram e os quadradinhos / relógios
          ficam verdes aos poucos, como uma barra de carregamento.
   3. Quando termina, a tela fica clicável: um círculo branco cresce
      e o navegador abre a página do ano.*/


/* CONFIGURA*/

// "pagina" é o arquivo que abre quando a pessoa clica na tela
// ATENÇÃO só o 2026 é "de verdade" os outros quatro são EXEMPLOS
// (pode ter quantos quiser a ordem aqui não importa o código organiza).
const ANOS = [
    { ano: 2026, pagina: "2026.html" },
    { ano: 1988, pagina: "1988.html" },
    { ano: 1964, pagina: "1964.html" },
    { ano: 1952, pagina: "1952.html" },
    { ano: 1903, pagina: "1903.html" },
];
const DURACAO_CARREGAMENTO = 5200;  
const VOLTAS_MINUTO = [5, 7, 6];
const VOLTAS_HORA = [1, 2, 1];
const BOLA_X_ANTIGO = 485;
const BOLA_X_NOVO = 1243;
const LARGURA_CANVA = 1366;


/*ELEMENTOS DA PÁGINA*/

const palco = document.getElementById("palco");
const anoEl = document.getElementById("ano");
const visor = document.getElementById("visor");
const visorAno = document.getElementById("visor-ano");
const canvas = document.getElementById("warp");
const bola = document.getElementById("bola");
const portal = document.getElementById("portal");
const statusEl = document.getElementById("status");
const quadrados = [...document.querySelectorAll(".quadrado")];

const btnMais = document.getElementById("ano-mais");
const btnMenos = document.getElementById("ano-menos");
const btnPronto = document.getElementById("pronto");
const dpCima = document.getElementById("dp-cima");
const dpBaixo = document.getElementById("dp-baixo");
const dpEsq = document.getElementById("dp-esq");
const dpDir = document.getElementById("dp-dir");
const dpCentro = document.getElementById("dp-centro");

const relogios = [...document.querySelectorAll(".relogio")].map((el, i) => ({
    el,
    minuto: el.querySelector(".p-min"),
    hora: el.querySelector(".p-hora"),
    baseMin: parseFloat(el.dataset.min),
    baseHora: parseFloat(el.dataset.hora),
    voltasMin: VOLTAS_MINUTO[i],
    voltasHora: VOLTAS_HORA[i],
}));

// epilepticos
const MOVIMENTO_REDUZIDO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* ESTADO */

ANOS.sort((a, b) => b.ano - a.ano);     

let indice = 0;                          
let fase = "escolhendo";                 

const anoAtual = () => ANOS[indice];


/* ESCOLHER O ANO */
function navegar(direcao) {
    if (fase !== "escolhendo") return;
    const novo = indice - direcao;
    if (novo < 0 || novo >= ANOS.length) {     
        tremer();
        return;
    }
    indice = novo;
    mostrarAno(anoAtual().ano, direcao);
    atualizarBotoes();
    statusEl.textContent = "Ano selecionado: " + anoAtual().ano;
}

function mostrarAno(ano, direcao) {
    const antigo = anoEl.querySelector(".atual") || anoEl.querySelector("span");
    const novo = document.createElement("span");
    novo.className = "atual";
    novo.textContent = ano;
    visorAno.textContent = ano;
    antigo.classList.remove("atual");
    anoEl.append(novo);
    if (MOVIMENTO_REDUZIDO) { antigo.remove(); return; }
    const opcoes = { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" };
    const entra = direcao > 0 ? "-100%" : "100%";       // ano novo entra por cima
    const sai = direcao > 0 ? "100%" : "-100%";
    novo.animate([{ transform: `translateY(${entra})`, opacity: 0 }, { transform: "none", opacity: 1 }], opcoes);
    antigo.animate([{ transform: "none", opacity: 1 }, { transform: `translateY(${sai})`, opacity: 0 }], opcoes)
        .finished.then(() => antigo.remove());
}

// Sacudidinha 
function tremer() {
    if (MOVIMENTO_REDUZIDO) return;
    anoEl.animate(
        [{ transform: "translateX(0)" }, { transform: "translateX(-2.5%)" },
        { transform: "translateX(2.5%)" }, { transform: "translateX(0)" }],
        { duration: 240, easing: "ease-in-out" }
    );
}

// Liga/desliga
function atualizarBotoes() {
    const livre = fase === "escolhendo";

    btnMais.disabled = !livre || indice === 0;
    btnMenos.disabled = !livre || indice === ANOS.length - 1;

    dpCima.disabled = dpBaixo.disabled = dpEsq.disabled = dpDir.disabled = !livre;
    dpCentro.disabled = btnPronto.disabled = !livre;
}

// liga a maq

function confirmar() {
    if (fase !== "escolhendo") return;
    fase = "carregando";
    atualizarBotoes();
    statusEl.textContent = "Viajando para " + anoAtual().ano + "…";

    const dica = document.createElement("link");
    dica.rel = "prefetch";
    dica.href = anoAtual().pagina;
    document.head.append(dica);

    palco.classList.add("ligada");      
    moverBola();
    iniciarWarp();

    const duracao = MOVIMENTO_REDUZIDO ? 900 : DURACAO_CARREGAMENTO;
    const inicio = performance.now();

    function passo(agora) {
        const p = Math.min(1, (agora - inicio) / duracao);   
        aplicarProgresso(p);
        if (p < 1) requestAnimationFrame(passo);
        else terminarCarregamento();
    }
    requestAnimationFrame(passo);
}

// p vai de 0 (começou) a 1 (terminou)
function aplicarProgresso(p) {
    const f = suavizar(p);

    // quadradinhos
    quadrados.forEach((q, i) => q.classList.toggle("ligado", p >= (i + 1) / quadrados.length - 1e-9));

    relogios.forEach((r, i) => {
        // ponteiros giram
        r.minuto.setAttribute("transform", `rotate(${r.baseMin + 360 * r.voltasMin * f} 162 162)`);
        r.hora.setAttribute("transform", `rotate(${r.baseHora + 360 * r.voltasHora * f} 162 162)`);
        // relógio  verde 
        r.el.classList.toggle("verde", p >= (i + 1) / relogios.length - 1e-9);
    });

    velocidadeAlvo = 0.3 + 2.4 * f;      
}

function terminarCarregamento() {
    fase = "pronta";
    velocidadeAlvo = 0.35;                
    palco.classList.add("pronta");
    visor.disabled = false;
    visor.focus({ preventScroll: true });
    statusEl.textContent = "Pronto. Clique na tela para entrar em " + anoAtual().ano + ".";
}

function suavizar(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

// bolinha PROPORCIONAL 
function moverBola() {
    const anos = ANOS.map(a => a.ano);
    const maior = Math.max(...anos);
    const menor = Math.min(...anos);
    const pos = maior === menor ? 1 : (anoAtual().ano - menor) / (maior - menor);   // 0 a 1
    const x = BOLA_X_ANTIGO + pos * (BOLA_X_NOVO - BOLA_X_ANTIGO);
    bola.style.left = (x / LARGURA_CANVA * 100) + "%";
}
/* 
   ANIMAÇÃO DA TELA
   Troque esta função inteira quando definir a animação final. */

let velocidade = 0.05;
let velocidadeAlvo = 0.05;
let warpLigado = false;

function iniciarWarp() {
    if (warpLigado) return;
    warpLigado = true;

    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, ultimo = performance.now();

    function medir() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    medir();
    window.addEventListener("resize", medir);

    const novaEstrela = (espalhar) => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: espalhar ? Math.random() * 0.95 + 0.05 : 1,    // z = "distância" da estrela
        rosa: Math.random() < 0.3,
    });
    const estrelas = Array.from({ length: 260 }, () => novaEstrela(true));

    function desenhar(agora) {
        const dt = Math.min(0.05, (agora - ultimo) / 1000);
        ultimo = agora;
        velocidade += (velocidadeAlvo - velocidade) * Math.min(1, dt * 2.5);

        ctx.clearRect(0, 0, w, h);
        ctx.lineCap = "round";
        const cx = w / 2, cy = h / 2, k = h * 0.2;

        for (const e of estrelas) {
            e.z -= velocidade * dt;
            if (e.z < 0.03) { Object.assign(e, novaEstrela(false)); continue; }

            const rastro = e.z + Math.max(0.004, velocidade * 0.025);   // quanto maior a velocidade, maior o risco
            ctx.globalAlpha = Math.min(1, (1 - e.z) * 1.5 + 0.1);
            ctx.strokeStyle = e.rosa ? "#FF006A" : "#ffffff";
            ctx.lineWidth = 0.6 + (1 - e.z) * 2.2;
            ctx.beginPath();
            ctx.moveTo(cx + (e.x / rastro) * k, cy + (e.y / rastro) * k);
            ctx.lineTo(cx + (e.x / e.z) * k, cy + (e.y / e.z) * k);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        if (!MOVIMENTO_REDUZIDO) requestAnimationFrame(desenhar);
    }
    requestAnimationFrame(desenhar);
}


/* 
   ENTRAR NO ANO (clique na tela) */

function viajar() {
    if (fase !== "pronta") return;
    fase = "viajando";
    const destino = anoAtual().pagina;

    if (MOVIMENTO_REDUZIDO) { window.location.href = destino; return; }

    //círculo branco
    const r = visor.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 24;

    portal.animate(
        [{ clipPath: `circle(0px at ${x}px ${y}px)` },
        { clipPath: `circle(${raio}px at ${x}px ${y}px)` }],
        { duration: 900, easing: "cubic-bezier(.6,0,.9,.5)", fill: "forwards" }
    ).finished.then(() => { window.location.href = destino; });
}


/* LIGAR OS BOTÕES */

btnMais.addEventListener("click", () => navegar(+1));
btnMenos.addEventListener("click", () => navegar(-1));
dpCima.addEventListener("click", () => navegar(+1));
dpDir.addEventListener("click", () => navegar(+1));
dpBaixo.addEventListener("click", () => navegar(-1));
dpEsq.addEventListener("click", () => navegar(-1));

btnPronto.addEventListener("click", confirmar);
dpCentro.addEventListener("click", confirmar);
visor.addEventListener("click", viajar);

// setas ano; Enter confirma.
document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
        case "ArrowUp":
        case "ArrowRight": navegar(+1); break;
        case "ArrowDown":
        case "ArrowLeft": navegar(-1); break;
        case "Enter":
            if (document.activeElement === document.body) confirmar();
            return;
        default: return;
    }
    e.preventDefault();
});

window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });


/* ESTADO INICIAL*/

visorAno.textContent = anoAtual().ano;
anoEl.querySelector("span").textContent = anoAtual().ano;
anoEl.querySelector("span").classList.add("atual");
aplicarProgresso(0);        
atualizarBotoes();
