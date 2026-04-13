/* ============================================================
   PROYECTO IRIS - VERSIÓN FINAL OPTIMIZADA (UNAD 2026)
   Líder: Yair Leal Guerra
   ============================================================ */

let nombreUsuario = "";
let irisHablando = false;
let animacionActiva = true;
let idAnimacion;

const synth = window.speechSynthesis;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const oido = new SR();

const robot = document.getElementById("robot-avatar");
const cuadro = document.getElementById("cuadro-texto");

let temasVistos = [];
const temas = ["cuerpo", "mitos", "decisión"];

// CARGAR VOZ FEMENINA
let vozFemenina = null;
function cargarVozFemenina() {
    const voces = synth.getVoices();
    vozFemenina = voces.find(v => (v.lang.includes("es-CO") || v.lang.includes("es-MX") || v.lang.includes("es-ES")) && 
                  (v.name.toLowerCase().includes("maria") || v.name.toLowerCase().includes("sabina") || v.name.toLowerCase().includes("google"))) 
                  || voces.find(v => v.lang.includes("es"));
}
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = cargarVozFemenina;
cargarVozFemenina();

// CONFIGURACIÓN OÍDO
oido.lang = "es-CO";
oido.continuous = false;
oido.interimResults = false;

function setEstado(estado) {
    if (!robot) return;
    robot.className = "";
    if (estado === "hablando") robot.classList.add("robot-hablando");
    if (estado === "escuchando") robot.classList.add("robot-escuchando");
    if (estado === "reposo") robot.classList.add("robot-reposo");
}

/* =========================
   SISTEMA DE HABLA Y SCROLL
========================= */
function hablar(texto, callback) {
    synth.cancel();
    if (idAnimacion) cancelAnimationFrame(idAnimacion);
    
    irisHablando = true;
    setEstado("hablando");
    cuadro.innerHTML = "";

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "es-CO";
    utter.rate = 0.75; // Velocidad óptima para comprensión
    utter.pitch = 1.05;
    if (vozFemenina) utter.voice = vozFemenina;

    const el = document.createElement("div");
    const esLargo = texto.length > 150;

    if (esLargo) {
        el.id = "creditos-iris";
        el.innerText = texto;
        cuadro.appendChild(el);

        let start = null;
        const duracion = texto.length * 90; 
        const startY = cuadro.offsetHeight;
        const endY = -el.scrollHeight - 20;

        function animar(t) {
            if (!start) start = t;
            if (animacionActiva) {
                const p = Math.min((t - start) / duracion, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                const y = startY + (endY - startY) * eased;
                el.style.transform = `translateY(${y}px)`;
                if (p < 1) idAnimacion = requestAnimationFrame(animar);
            } else {
                idAnimacion = requestAnimationFrame(animar);
            }
        }
        idAnimacion = requestAnimationFrame(animar);
    } else {
        el.id = "texto-estatico";
        el.innerText = texto;
        cuadro.appendChild(el);
    }

    utter.onend = () => {
        irisHablando = false;
        setTimeout(() => {
            if (callback) callback();
            else escucharSeguro();
        }, 800);
    };
    synth.speak(utter);
}

/* =========================
   GESTIÓN DE MICRÓFONO
========================= */
function escucharSeguro() {
    if (irisHablando) return;
    try {
        oido.stop();
        setTimeout(() => {
            if (!irisHablando) {
                oido.start();
                cuadro.innerHTML = `<div id="texto-estatico">IRIS te escucha...</div>`;
                setEstado("escuchando");
            }
        }, 400);
    } catch (e) { console.log("Reintento de micro"); }
}

oido.onresult = (e) => {
    if (irisHablando) return;
    const texto = e.results[0][0].transcript.toLowerCase();

    if (!nombreUsuario) {
        nombreUsuario = texto;
        hablar(`Hola ${nombreUsuario}. Soy IRIS. Exploraremos tres temas: CUERPO, MITOS y DECISIÓN. Di uno para comenzar.`);
        return;
    }
    
    if (texto.includes("repetir")) { temasVistos = []; iniciar(); return; }
    if (texto.includes("salir")) { hablar("Adiós. Tu autonomía es poder."); return; }

    manejar(texto);
};

// Si el usuario no habla, IRIS no se queda "muerta"
oido.onerror = (e) => {
    if (e.error === 'no-speech' && !irisHablando) {
        setTimeout(escucharSeguro, 1000);
    }
};

/* =========================
   LÓGICA DE TEMAS
========================= */
function manejar(texto) {
    let tema = null;
    if (texto.includes("cuerpo")) tema = "cuerpo";
    if (texto.includes("mitos")) tema = "mitos";
    if (texto.includes("decisión") || texto.includes("decision")) tema = "decisión";

    if (!tema) {
        hablar("No entendí. Por favor di: cuerpo, mitos o decisión.");
        return;
    }

    if (temasVistos.includes(tema)) {
        const faltan = temas.filter(t => !temasVistos.includes(t));
        hablar(`Ya vimos ese tema. Te falta conocer: ${faltan.join(" y ").toUpperCase()}.`);
        return;
    }

    temasVistos.push(tema);
    const contenido = {
        cuerpo: `La dimensión biológica es el derecho a cuidar tu propio cuerpo con soberanía. Tú eres la máxima autoridad sobre tu integridad física y reproductiva.`,
        mitos: `La dimensión social reconoce tu derecho a amar y expresar tu erotismo libremente, rompiendo prejuicios que intentan invisibilizar la sexualidad en la discapacidad.`,
        decisión: `La dimensión ética es tu derecho al consentimiento informado. Eres el arquitecto de tu vida y tus decisiones deben reflejar tus valores, no presiones externas.`
    };

    const faltan = temas.filter(t => !temasVistos.includes(t));
    if (faltan.length) {
        hablar(`${contenido[tema]}. Te falta conocer: ${faltan.join(" y ").toUpperCase()}.`);
    } else {
        hablar(`${contenido[tema]}. Felicidades ${nombreUsuario}, completaste los temas. Si quieres repetir los temas solo Dí: REPETIR o simplemente SALIR.`);
    }
}

function iniciar() {
    nombreUsuario = "";
    temasVistos = [];
    
    // Mensaje con Diseño Universal: invita a la acción sin importar la capacidad física
    hablar(
        "Hola, soy IRIS, tu guía en derechos y autonomía. Estoy aquí para acompañarte a reconocer tu poder y la libertad sobre tu propio cuerpo. " +
        "Este es un espacio seguro para ti: puedes comunicarte conmigo a través de tu voz, o si lo prefieres, utilizando tu pantalla o teclado. " +
        "Antes de comenzar nuestro viaje... ¿Cómo te gustaría que te llame?"
    );
}

// Iniciar al cargar
window.addEventListener("load", () => {
    setTimeout(iniciar, 1000);
});