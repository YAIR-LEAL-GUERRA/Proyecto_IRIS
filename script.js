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

/* =========================
   VOZ FEMENINA FORZADA (MEJOR POSIBLE)
========================= */
let vozFemenina = null;

function cargarVozFemenina() {
    const voces = synth.getVoices();

    vozFemenina =
        voces.find(v =>
            (v.lang.includes("es-ES") ||
             v.lang.includes("es-MX") ||
             v.lang.includes("es-CO")) &&
            (
                v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("maria") ||
                v.name.toLowerCase().includes("sofia") ||
                v.name.toLowerCase().includes("lucia") ||
                v.name.toLowerCase().includes("google") ||
                v.name.toLowerCase().includes("microsoft")
            )
        ) ||
        voces.find(v => v.lang.includes("es")) ||
        voces[0];
}

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = cargarVozFemenina;
}
cargarVozFemenina();

/* =========================
   CONFIG VOZ
========================= */
oido.lang = "es-CO";
oido.continuous = false;
oido.interimResults = false;

/* =========================
   PAUSA TÁCTIL (SOLO ANIMACIÓN)
========================= */
cuadro.addEventListener("click", () => {
    animacionActiva = !animacionActiva;
});

/* =========================
   ESTADO ROBOT
========================= */
function setEstado(estado) {
    if (!robot) return;
    robot.className = "";

    if (estado === "hablando") robot.classList.add("robot-hablando");
    if (estado === "escuchando") robot.classList.add("robot-escuchando");
    if (estado === "reposo") robot.classList.add("robot-reposo");
}

/* =========================
   MOTOR DE VOZ + TEXTO
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

    if (vozFemenina) {
        utter.voice = vozFemenina;
    }

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

    utter.onend = () => {
        irisHablando = false;
        setEstado("escuchando");

        setTimeout(() => {
            if (callback) callback();
            else escuchar();
        }, 800);
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
   RESULTADO VOZ
========================= */
oido.onresult = (e) => {
    if (irisHablando) return;

    const texto = e.results[0][0].transcript.toLowerCase();

    if (!nombreUsuario) {
        nombreUsuario = texto;

        hablar(
`Hola ${nombreUsuario}.

Soy IRIS, una interfaz educativa sobre autonomía, cuerpo y decisiones.

Exploraremos tres temas:
CUERPO, MITOS y DECISIÓN.

Di uno para comenzar.`
        );

        return;
    }

    manejar(texto);
};

/* =========================
   LÓGICA TEMAS
========================= */
function manejar(texto) {

    let tema = null;

    if (texto.includes("cuerpo")) tema = "cuerpo";
    if (texto.includes("mitos")) tema = "mitos";
    if (texto.includes("decisión") || texto.includes("decision")) tema = "decisión";

    if (!tema) {
        hablar("No entendí. Di: cuerpo, mitos o decisión.");
        return;
    }

    if (temasVistos.includes(tema)) {
        const faltan = temas.filter(t => !temasVistos.includes(t));
        hablar(`Ya viste ese tema. Te faltan: ${faltan.join(" y ").toUpperCase()}.`);
        return;
    }

    temasVistos.push(tema);

    const contenido = {
        cuerpo:
`TEMA: CUERPO

Tu cuerpo es tu primer territorio de autonomía.

Tienes derecho a conocerlo, cuidarlo y decidir sobre él.

IRIS te recuerda: tu cuerpo es tuyo.`,

        mitos:
`TEMA: MITOS

Existen creencias sociales que limitan la libertad afectiva.

Pero tú tienes derecho a vivir sin prejuicios.

IRIS te recuerda: los mitos no te definen.`,

        decisión:
`TEMA: DECISIÓN

La autonomía significa decidir con libertad e información.

No es obedecer, es elegir.

IRIS te recuerda: decidir es tu derecho.`
    };

    const faltan = temas.filter(t => !temasVistos.includes(t));

    if (faltan.length) {
        hablar(`${contenido[tema]}

Te falta: ${faltan.join(" y ").toUpperCase()}.`);
    } else {
        hablar(`${contenido[tema]}

Felicidades ${nombreUsuario}.

Completaste los 3 temas de IRIS.

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