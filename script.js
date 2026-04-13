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
   VOZ FEMENINA
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

speechSynthesis.onvoiceschanged = cargarVozFemenina;
cargarVozFemenina();

/* =========================
   CONFIG VOZ
========================= */
oido.lang = "es-CO";
oido.continuous = false;
oido.interimResults = false;

/* =========================
   PAUSA ANIMACIÓN
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
   HABLAR
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

    if (vozFemenina) utter.voice = vozFemenina;

    const el = document.createElement("div");

    const esLargo = texto.length > 160;

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
            escucharSeguro();
        }, 800);
    };

    synth.speak(utter);
}

/* =========================
   ESCUCHA SEGURA
========================= */
function escucharSeguro() {
    if (irisHablando) return;

    try {
        oido.abort();

        setTimeout(() => {
            oido.start();
            cuadro.innerHTML = `<div id="texto-estatico">IRIS está escuchando...</div>`;
            setEstado("escuchando");
        }, 300);

    } catch {
        setTimeout(() => escucharSeguro(), 1000);
    }
}

/* =========================
   EVENTOS VOZ
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

oido.onerror = () => {
    setTimeout(() => escucharSeguro(), 1000);
};

oido.onend = () => {
    if (!irisHablando) {
        setTimeout(() => escucharSeguro(), 800);
    }
};

/* =========================
   LÓGICA TEMAS (TUS TEXTOS COMPLETOS)
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
`La dimensión biológica representa el derecho fundamental a habitar, reconocer y cuidar tu propio cuerpo con total soberanía. Implica desarrollar un conocimiento profundo sobre tus sentidos y funciones reproductivas. Se trata de garantizar que tú seas la máxima autoridad sobre tu integridad física, asegurando que cualquier intervención respete siempre tu consentimiento y dignidad.`,

        mitos:
`La dimensión social y afectiva reconoce que tienes el derecho inalienable a amar y expresar tu erotismo de manera libre, rompiendo con prejuicios que intentan invisibilizar la sexualidad en la discapacidad. Tienes derecho a disfrutar de tu intimidad, a explorar tu identidad de género y a decidir sobre la formación de una familia si así lo deseas.`,

        decisión:
`La dimensión ética se centra en tu autonomía para la toma de decisiones. No se trata solo de elegir, sino de ejercer tu consentimiento informado y libre, asegurando que cada paso sea un reflejo de tus propios valores y no de presiones externas. Es tu derecho a ser el arquitecto de tu propio proyecto de vida.`
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