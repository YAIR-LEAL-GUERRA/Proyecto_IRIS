let nombreUsuario = "";
let irisHablando = false; 
let animacionActiva = true;

const sintetizador = window.speechSynthesis;
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
const oido = new Reconocimiento();
const robot = document.getElementById('robot-avatar');
const cuadro = document.getElementById('cuadro-texto');

let temasVistos = []; 
const totalTemas = ['cuerpo', 'mitos', 'decisión'];

oido.lang = 'es-CO';

/* 🎯 PAUSA TÁCTIL SOLO TEXTO */
cuadro.addEventListener("click", () => {
    animacionActiva = !animacionActiva;
});

/* VOZ */
function hablar(mensaje, callback) {
    sintetizador.cancel();
    irisHablando = true;
    cuadro.innerHTML = "";

    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-CO';

    const esLargo = mensaje.length > 150;
    const contenedor = document.createElement("div");

    if (esLargo) {
        contenedor.id = "creditos-iris";
        contenedor.innerText = mensaje;
        cuadro.appendChild(contenedor);

        let start = null;
        const duracion = mensaje.length * 60;
        let startY = cuadro.offsetHeight;
        let endY = -contenedor.scrollHeight;

        function animar(t) {
            if (!start) start = t;

            if (animacionActiva) {
                let p = (t - start) / duracion;
                let y = startY + (endY - startY) * p;
                contenedor.style.transform = `translateY(${y}px)`;

                if (p < 1) requestAnimationFrame(animar);
            } else {
                requestAnimationFrame(animar);
            }
        }

        requestAnimationFrame(animar);

    } else {
        contenedor.id = "texto-estatico";
        contenedor.innerText = mensaje;
        cuadro.appendChild(contenedor);
    }

    lectura.onend = () => {
        irisHablando = false;
        setTimeout(() => {
            if (callback) callback();
            else iniciarEscucha();
        }, 1000);
    };

    sintetizador.speak(lectura);
}

/* RESTO IGUAL */
function iniciarEscucha() {
    if (irisHablando) return;
    try {
        oido.start();
        cuadro.innerHTML = `<div id="texto-estatico">>>> IRIS ESCUCHANDO...</div>`;
    } catch {}
}

oido.onresult = (event) => {
    const voz = event.results[0][0].transcript.toLowerCase();

    if (!nombreUsuario) {
        nombreUsuario = voz;
        hablar(`Mucho gusto, ${nombreUsuario}. Di: CUERPO, MITOS o DECISIÓN.`);
    } else {
        procesarComandos(voz);
    }
};

function procesarComandos(comando) {
    let textos = {
        cuerpo: "Texto cuerpo...",
        mitos: "Texto mitos...",
        decisión: "Texto decisión..."
    };

    for (let key in textos) {
        if (comando.includes(key)) {
            hablar(textos[key]);
            return;
        }
    }

    hablar("No entendí.");
}

function iniciarSistema() {
    nombreUsuario = "";
    hablar("Hola, soy IRIS. ¿Cuál es tu nombre?");
}

window.addEventListener('load', () => {
    setTimeout(() => {
        if (!nombreUsuario) iniciarSistema();
    }, 1000);
});