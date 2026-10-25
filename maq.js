
//  configurações 

// lista dos anos, do mais novo pro mais antigo
// "pagina" é o arquivo que abre quando clica na tela no final
// só o 2026 é de verdade, os outros quatro são exemplos
const ANOS = [
    { ano: 1956, pagina: "1956.html" },
    { ano: 1952, pagina: "1952.html" },
    { ano: 1950, pagina: "1950.html" },
    { ano: 1945, pagina: "1945.html" },
    { ano: 1915, pagina: "1915.html" },
    { ano: 1905, pagina: "1905.html" },
    { ano: 1856, pagina: "1856.html" },
];

// tempo do carregamento
const DURACAO = 5200;

// quanto tempo a pasta do arquivo fica parada na tela antes de subir
const ARQUIVO_FICA = 1500;

// quantas voltas os ponteiros dão em cada relógio
const VOLTAS_MINUTO = [5, 7, 6];
const VOLTAS_HORA = [1, 2, 1];

// posição inicial dos ponteiros, em graus
const ANGULO_MINUTO = 14.19;
const ANGULO_HORA = 103.87;

// onde a bolinha da barra fica: esquerda = ano mais antigo direita = ano mais novo
const BOLA_ANTIGO = 35.5;
const BOLA_NOVO = 91;


// pegando os elementos do HTML

const palco = document.getElementById("palco");
const visor = document.getElementById("visor");
const visorAno = document.getElementById("visor-ano");
const canvas = document.getElementById("warp");
const anoNumero = document.getElementById("ano-numero");
const bola = document.getElementById("bola");
const portal = document.getElementById("portal");
const arquivo = document.getElementById("arquivo");

const btnMais = document.getElementById("ano-mais");
const btnMenos = document.getElementById("ano-menos");

const botoes = document.querySelectorAll(".palco button");  
const quadrados = document.querySelectorAll(".quadrado");
const relogios = document.querySelectorAll(".relogio");
const ponteirosMinuto = document.querySelectorAll(".p-min");
const ponteirosHora = document.querySelectorAll(".p-hora");


//variáveis do programa 

let indice = 0;              
let fase = "escolhendo";      // vai mudando: escolhendo -> carregando -> pronta -> viajando


//  escolher o ano 

// direcao = 1 vai pro ano mais novo, direcao = -1 vai pro ano mais antigo
function trocarAno(direcao) {
    if (fase != "escolhendo") return;

    let novoIndice = indice - direcao;

    // se já ta no primeiro ou no último ano da lista, não faz nada
    if (novoIndice < 0 || novoIndice >= ANOS.length) return;

    indice = novoIndice;
    visorAno.textContent = ANOS[indice].ano;
    animarNumero(direcao);
    atualizarBotoes();
}

// o numero velho sai do treco do ano e o novo entra, subindo ou descendo
function animarNumero(direcao) {
    let saida = direcao > 0 ? "100%" : "-100%";
    let entrada = direcao > 0 ? "-100%" : "100%";

    anoNumero.animate([
        { transform: "none", opacity: 1 },
        { transform: "translateY(" + saida + ")", opacity: 0 }
    ], 150);

    // espera o número velho sair pra trocar o texto
    setTimeout(function () {
        anoNumero.textContent = ANOS[indice].ano;
        anoNumero.animate([
            { transform: "translateY(" + entrada + ")", opacity: 0 },
            { transform: "none", opacity: 1 }
        ], 150);
    }, 140);
}

// deixa uma seta travada ou liberada
function ajustarSeta(seta, travada) {
    seta.disabled = travada;
    if (travada) {
        seta.querySelector("img").src = "Midias/Maq/Botaonavindisponivel.png";
    } else {
        seta.querySelector("img").src = "Midias/Maq/Botaonav.png";
    }
}

function atualizarBotoes() {
    let travado = (fase != "escolhendo");

    // depois de apertar o PRONTO todos os botões travam
    for (const botao of botoes) {
        botao.disabled = travado;
    }

    // as setas também travam quando não tem mais ano naquela direção
    ajustarSeta(btnMais, travado || indice == 0);
    ajustarSeta(btnMenos, travado || indice == ANOS.length - 1);
}


// botão PRONTO liga a máquina

function confirmar() {
    if (fase != "escolhendo") return;

    fase = "carregando";
    atualizarBotoes();

    palco.classList.add("ligada");  
    moverBola();
    desenharViagem();

    // roda a cada quadro da tela até o carregamento acabar
    let inicio = performance.now();

    function carregar(agora) {
        let p = (agora - inicio) / DURACAO; 
        if (p > 1) p = 1;

        atualizarCarregamento(p);

        if (p < 1) {
            requestAnimationFrame(carregar);
        } else {
            terminar();
        }
    }
    requestAnimationFrame(carregar);
}

// p é o quanto do carregamento ja foi 0 = começou 0.5 = metade 1 = terminou
function atualizarCarregamento(p) {
    // deixa o movimento começar e terminar devagar
    let suave = p * p * (3 - 2 * p);

    // cada quadradinho acende quando o carregamento passa da parte dele
    for (let i = 0; i < quadrados.length; i++) {
        quadrados[i].classList.toggle("ligado", p >= (i + 1) / quadrados.length);
    }

    for (let i = 0; i < relogios.length; i++) {
        // gira os ponteiros com rotate(ângulo, x do centro, y do centro)
        let anguloMinuto = ANGULO_MINUTO + 360 * VOLTAS_MINUTO[i] * suave;
        let anguloHora = ANGULO_HORA + 360 * VOLTAS_HORA[i] * suave;
        ponteirosMinuto[i].setAttribute("transform", "rotate(" + anguloMinuto + " 162 162)");
        ponteirosHora[i].setAttribute("transform", "rotate(" + anguloHora + " 162 162)");

        // cada relógio fica verde
        relogios[i].classList.toggle("verde", p >= (i + 1) / relogios.length);
    }

    // a viagem fica mais rápida no meio do carregamento
    velocidadeAlvo = 0.3 + 2.4 * suave;
}
// a viagem desacelera e o CSS mostra o texto e a tela fica clicável
function terminar() {
    fase = "pronta";
    velocidadeAlvo = 0.35;               
    palco.classList.add("pronta");      
}

// a bolinha anda de acordo com o ano
function moverBola() {
    let maior = ANOS[0].ano;
    let menor = ANOS[ANOS.length - 1].ano;
    let ano = ANOS[indice].ano;

    // posicao vai de 0 (ano mais antigo) até 1 (ano mais novo)
    let posicao = 1;
    if (maior != menor) {
        posicao = (ano - menor) / (maior - menor);
    }

    bola.style.left = (BOLA_ANTIGO + posicao * (BOLA_NOVO - BOLA_ANTIGO)) + "%";
}


// riscos da viagem

let velocidade = 0.05;        
let velocidadeAlvo = 0.05;   

function desenharViagem() {
    let ctx = canvas.getContext("2d");

    // ajusta o tamanho do desenho pra não ficar borrado em telas com zoom
    let zoom = window.devicePixelRatio || 1;
    let largura = canvas.clientWidth;
    let altura = canvas.clientHeight;
    canvas.width = largura * zoom;
    canvas.height = altura * zoom;
    ctx.scale(zoom, zoom);

    // cada estrela tem uma posição (x, y) e uma distância (z)
    // z = 1 é longe e z perto de 0 é perto, quando chega perto ela vira uma estrela nova lá longe
    function novaEstrela(espalhada) {
        return {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: espalhada ? Math.random() * 0.95 + 0.05 : 1,
            rosa: Math.random() < 0.3,   
        };
    }

    let estrelas = [];
    for (let i = 0; i < 260; i++) {
        estrelas.push(novaEstrela(true));
    }

    let ultimo = performance.now();

    function desenhar(agora) {
        let tempo = (agora - ultimo) / 1000;   
        ultimo = agora;

        // a velocidade vai se aproximando da velocidade alvo aos poucos
        velocidade = velocidade + (velocidadeAlvo - velocidade) * tempo * 2.5;

        ctx.clearRect(0, 0, largura, altura);
        ctx.lineCap = "round";

        for (const e of estrelas) {
            e.z = e.z - velocidade * tempo;

            // chegou perto demais vira uma estrela nova lá longe
            if (e.z < 0.03) {
                Object.assign(e, novaEstrela(false));
                continue;
            }

            // o risco vai do ponto de antes até o ponto de agora 
            let antes = e.z + Math.max(0.004, velocidade * 0.025);
            let escala = altura * 0.2;

            ctx.globalAlpha = Math.min(1, (1 - e.z) * 1.5 + 0.1);   // quanto mais perto, mais forte
            ctx.strokeStyle = e.rosa ? "#FF006A" : "#232323";
            ctx.lineWidth = 0.6 + (1 - e.z) * 2.2;
            ctx.beginPath();
            ctx.moveTo(largura / 2 + (e.x / antes) * escala, altura / 2 + (e.y / antes) * escala);
            ctx.lineTo(largura / 2 + (e.x / e.z) * escala, altura / 2 + (e.y / e.z) * escala);
            ctx.stroke();
        }

        requestAnimationFrame(desenhar);
    }
    requestAnimationFrame(desenhar);
}


// clicar na tela: entrar no ano 

function viajar() {
    if (fase != "pronta") return;

    fase = "viajando";

    // o circulo branco nasce no centro da tela e cresce ate cobrir a janela inteira
    let caixa = visor.getBoundingClientRect();
    let x = caixa.left + caixa.width / 2;
    let y = caixa.top + caixa.height / 2;
    let raio = Math.max(window.innerWidth, window.innerHeight) * 1.5;

    portal.animate([
        { clipPath: "circle(0px at " + x + "px " + y + "px)" },
        { clipPath: "circle(" + raio + "px at " + x + "px " + y + "px)" }
    ], { duration: 900, easing: "cubic-bezier(.6,0,.9,.5)", fill: "forwards" });

    // quando o circulo termina de crescer abre a página do ano
    setTimeout(function () {
        window.location.href = ANOS[indice].pagina;
    }, 900);
}

// se a pessoa voltar pra essa página pelo botão "voltar" do navegador,
// o navegador mostra ela do jeito que ficou (com o círculo branco na frente)
// então recarrega a página pra começar do zero
window.addEventListener("pageshow", function (evento) {
    if (evento.persisted) {
        window.location.reload();
    }
});


// abertura

// quando a página abre, a pasta do arquivo cobre a máquina
// ela fica parada um tempinho, sobe um pouquinho e depois desce até sair da tela
// quando ela termina de descer, a máquina aparece com as animações normais do maq.css

function abrirArquivo() {
    // fica parada o tempo do ARQUIVO_FICA e depois sobe um pouquinho
    setTimeout(subirUmPouco, ARQUIVO_FICA);
}

function subirUmPouco() {
    // o translateY com % usa a altura da própria pasta, então -6% é "um pouquinho" pra cima
    let subida = arquivo.animate([
        { transform: "none" },
        { transform: "translateY(-6%)" }
    ], { duration: 400, easing: "ease-out", fill: "forwards" });

    // quando termina de subir, ela desce
    subida.onfinish = descer;
}

function descer() {
    let descida = arquivo.animate([
        { transform: "translateY(-6%)" },
        { transform: "translateY(105%)" }    
    ], { duration: 800, easing: "ease-in", fill: "forwards" });

    // quando a pasta some da tela, ela é tirada do HTML (assim não atrapalha os cliques)
    // e a classe "antes" sai as animações de entrada da máquina começam a rodar
    descida.onfinish = function () {
        arquivo.remove();
        palco.classList.remove("antes");
    };
}


//  quando a página abre

visorAno.textContent = ANOS[0].ano;
anoNumero.textContent = ANOS[0].ano;
atualizarCarregamento(0);     
atualizarBotoes();

// a pasta fica na tela até a página terminar de carregar (todas as imagens) aí começa a abertura
window.addEventListener("load", abrirArquivo);
