let nombreUsuario = "";
let irisHablando = false;
let animacionActiva = true;

const synth = window.speechSynthesis;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const oido = new SR();

const robot = document.getElementById("robot-avatar");
const cuadro = document.getElementById("cuadro-texto");

let temasVistos = [];
const temas = ["cuerpo", "mitos", "decisión"];

oido.lang = "es-CO";
oido.continuous = false;
oido.interimResults = false;

/* =========================
   MICRO FEEDBACK (VIBRACIÓN)
========================= */
function vibrar(ms = 20) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

/* =========================
   ESTADO VISUAL
========================= */
function setEstado(estado) {
    if (!robot) return;
    robot.className = "";

    if (estado === "hablando") robot.classList.add("robot-hablando");
    if (estado === "escuchando") robot.classList.add("robot-escuchando");
    if (estado === "reposo") robot.classList.add("robot-reposo");
}

/* =========================
   PAUSA TÁCTIL
========================= */
cuadro.addEventListener("click", () => {
    animacionActiva = !animacionActiva;
    vibrar(10);
});

/* =========================
   MOTOR DE VOZ PRO
========================= */
function hablar(texto, callback) {
    synth.cancel();
    irisHablando = true;

    setEstado("hablando");
    cuadro.innerHTML = "";

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "es-CO";
    utter.rate = 0.98;
    utter.pitch = 1.08;
    utter.volume = 1;

    const esLargo = texto.length > 160;
    const el = document.createElement("div");

    if (esLargo) {
        el.id = "creditos-iris";
        el.innerText = texto;
        cuadro.appendChild(el);

        let start = null;
        const duracion = texto.length * 50;

        const startY = cuadro.offsetHeight;
        const endY = -el.scrollHeight;

        function animar(t) {
            if (!start) start = t;

            if (animacionActiva) {
                const p = Math.min((t - start) / duracion, 1);

                // easing suave tipo app profesional
                const eased = 1 - Math.pow(1 - p, 3);

                const y = startY + (endY - startY) * eased;

                el.style.transform = `translateY(${y}px)`;

                if (p < 1) requestAnimationFrame(animar);
            } else {
                requestAnimationFrame(animar);
            }
        }

        requestAnimationFrame(animar);
    } else {
        el.id = "texto-estatico";
        el.innerText = texto;
        cuadro.appendChild(el);
    }

    utter.onstart = () => vibrar(5);

    utter.onend = () => {
        irisHablando = false;
        setEstado("escuchando");

        setTimeout(() => {
            if (callback) callback();
            else escuchar();
        }, 700);
    };

    synth.speak(utter);
}

/* =========================
   ESCUCHA
========================= */
function escuchar() {
    if (irisHablando) return;

    try {
        oido.start();
        cuadro.innerHTML = `<div id="texto-estatico">IRIS está escuchando...</div>`;
        setEstado("escuchando");
    } catch {}
}

/* =========================
   VOZ INPUT
========================= */
oido.onresult = (e) => {
    if (irisHablando) return;

    const texto = e.results[0][0].transcript.toLowerCase();

    vibrar(15);

    if (!nombreUsuario) {
        nombreUsuario = texto;

        hablar(
`Hola ${nombreUsuario}.

Soy IRIS, un asistente educativo sobre autonomía, cuerpo y toma de decisiones.

Exploraremos tres pilares fundamentales:
cuerpo, mitos y decisión.

Di uno para comenzar.`
        );

        return;
    }

    manejar(texto);
};

/* =========================
   LÓGICA INTELIGENTE
========================= */
function manejar(texto) {

    let tema = null;

    if (texto.includes("cuerpo")) tema = "cuerpo";
    if (texto.includes("mitos")) tema = "mitos";
    if (texto.includes("decisión") || texto.includes("decision")) tema = "decisión";

    if (!tema) {
        hablar("No lo entendí claramente. Di: cuerpo, mitos o decisión.");
        return;
    }

    if (temasVistos.includes(tema)) {
        const faltan = temas.filter(t => !temasVistos.includes(t));
        hablar(`Ya exploraste ese tema. Te faltan: ${faltan.join(" y ").toUpperCase()}.`);
        return;
    }

    temasVistos.push(tema);

    const contenido = {
        cuerpo:
`TEMA: CUERPO

Tu cuerpo es tu primer territorio de autonomía.

Tienes derecho a conocerlo, cuidarlo y decidir sobre él.

Nadie puede sustituir tu consentimiento.

IRIS te recuerda: tu cuerpo es tuyo.`,

        mitos:
`TEMA: MITOS

Existen creencias sociales que limitan la libertad afectiva y sexual.

Pero tú tienes derecho a amar, elegir y expresarte sin prejuicios.

IRIS te recuerda: los mitos no definen tu identidad.`,

        decisión:
`TEMA: DECISIÓN

La autonomía significa decidir tu vida con información y libertad.

No es obedecer, es elegir.

IRIS te recuerda: decidir es tu poder.`
    };

    const faltan = temas.filter(t => !temasVistos.includes(t));

    if (faltan.length) {
        hablar(`${contenido[tema]}

Te falta explorar: ${faltan.join(" y ").toUpperCase()}.`);
    } else {
        hablar(`${contenido[tema]}

Felicidades ${nombreUsuario}.

Has completado los tres pilares de IRIS.

Puedes decir REPETIR o SALIR.`);
    }
}

/* =========================
   INICIO
========================= */
function iniciar() {
    nombreUsuario = "";
    temasVistos = [];
    setEstado("reposo");

    hablar("Hola, soy IRIS. ¿Cuál es tu nombre?");
}

window.addEventListener("load", () => {
    setTimeout(iniciar, 900);
});