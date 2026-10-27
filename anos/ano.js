// BOTÃO VOLTAR
// a tela branca aparece e só depois a página da máquina abre

const voltar = document.getElementById("voltar");
const fade = document.getElementById("fade");

voltar.addEventListener("click", function (evento) {
    evento.preventDefault();          // impede de abrir a página na hora
    fade.classList.add("saindo");     // a tela branca volta (o CSS faz a animação)

    // espera a animação acabar (0,6 s) e abre a máquina
    setTimeout(function () {
        window.location.href = "../Maq.html";
    }, 600);
});

// se a pessoa voltar para cá pelo botão do navegador, tira a tela branca
window.addEventListener("pageshow", function () {
    fade.classList.remove("saindo");
});


// MINI JOGO
// cada botão tem data-certa="sim" ou "nao" no HTML

const opcoes = document.querySelectorAll(".opcao");
const resposta = document.querySelector(".resposta");

for (const botao of opcoes) {
    botao.addEventListener("click", function () {
        if (botao.dataset.certa == "sim") {
            botao.classList.add("certa");
            resposta.textContent = "Acertou! Você é craque! ✨";
        } else {
            botao.classList.add("errada");
            resposta.textContent = "Quase! Tente outra opção.";
        }
    });
}
