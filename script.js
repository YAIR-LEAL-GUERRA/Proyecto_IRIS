/* ============================================================
   PROYECTO IRIS - VERSIÓN FINAL UNIFICADA (UNAD 2026)
   Líder: Yair Leal Guerra
   ============================================================ */

let nombreUsuario = "";
let irisHablando = false;
let idAnimacion;

const synth = window.speechSynthesis;
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const oido = new SR();

const robot = document.getElementById("robot-avatar");
const cuadro = document.getElementById("cuadro-texto");

let temasVistos = [];
const temas = ["cuerpo", "mitos", "decisión"];

// 1. CARGAR VOZ FEMENINA
let vozFemenina = null;
function cargarVozFemenina() {
    const voces = synth.getVoices();
    vozFemenina = voces.find(v => (v.lang.includes("es-CO") || v.lang.includes("es-MX")) && 
                  (v.name.toLowerCase().includes("maria") || v.name.toLowerCase().includes("google"))) 
                  || voces.find(v => v.lang.includes("es"));
}
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = cargarVozFemenina;
cargarVozFemenina();

// 2. CONFIGURACIÓN DE RECONOCIMIENTO
oido.lang = "es-CO";
oido.continuous = false;
oido.interimResults = false;

function setEstado(estado) {
    if (!robot || !cuadro) return;
    
    // Reset de estados
    robot.className = "robot-reposo";
    cuadro.classList.remove("escuchando", "alerta-error");

    if (estado === "hablando") robot.classList.add("robot-hablando");
    if (estado === "escuchando") {
        robot.classList.add("robot-escuchando");
        cuadro.classList.add("escuchando"); // Activa Neón Azul
    }
    if (estado === "error") cuadro.classList.add("alerta-error"); // Activa Neón Rojo
}

/* =========================
   SISTEMA DE HABLA Y TEXTO
========================= */
function hablar(texto, callback) {
    synth.cancel();
    if (idAnimacion) cancelAnimationFrame(idAnimacion);
    
    irisHablando = true;
    setEstado("hablando");
    cuadro.innerHTML = "";

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "es-CO";
    utter.rate = 0.85; 
    if (vozFemenina) utter.voice = vozFemenina;

    const el = document.createElement("div");
    
    // Si el texto es largo, animamos como créditos
    if (texto.length > 100) {
        el.id = "creditos-iris";
        el.innerText = texto;
        cuadro.appendChild(el);

        let start = null;
        const duracion = texto.length * 85; 
        const startY = cuadro.offsetHeight / 1.5; // Empieza desde abajo del centro
        const endY = -el.scrollHeight - 50;

        function animar(t) {
            if (!start) start = t;
            const p = Math.min((t - start) / duracion, 1);
            const y = startY + (endY - startY) * p;
            el.style.transform = `translateY(${y}px)`;
            
            if (p < 1 && irisHablando) {
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
        setEstado("reposo");
        setTimeout(() => {
            if (callback) callback();
            else escucharSeguro();
        }, 600);
    };
    synth.speak(utter);
}

/* =========================
   GESTIÓN DEL MICRÓFONO
========================= */
function escucharSeguro() {
    if (irisHablando) return;
    try {
        oido.stop();
        setTimeout(() => {
            if (!irisHablando) {
                setEstado("escuchando");
                cuadro.innerHTML = `<div id="texto-estatico">IRIS te escucha...</div>`;
                oido.start();
            }
        }, 300);
    } catch (e) { console.warn("Reintento de micro"); }
}

oido.onresult = (e) => {
    const texto = e.results[0][0].transcript.toLowerCase();

    if (!nombreUsuario) {
        nombreUsuario = texto;
        hablar(`Mucho gusto, ${nombreUsuario}. Es un honor acompañarte. Hoy exploraremos tres dimensiones fundamentales: CUERPO, MITOS y DECISIÓN. ¿Por cuál te gustaría empezar?`);
        return;
    }
    
    if (texto.includes("repetir")) { temasVistos = []; iniciar(); return; }
    if (texto.includes("salir") || texto.includes("finalizar")) { 
        hablar("Tu autonomía es tu poder. ¡Hasta pronto!"); 
        return; 
    }

    manejar(texto);
};

oido.onerror = (e) => {
    if (e.error === 'no-speech' && !irisHablando) {
        setTimeout(escucharSeguro, 1000);
    }
};

/* =========================
   LÓGICA PEDAGÓGICA
========================= */
function manejar(texto) {
    let tema = null;
    if (texto.includes("cuerpo")) tema = "cuerpo";
    if (texto.includes("mitos")) tema = "mitos";
    if (texto.includes("decisión") || texto.includes("decision")) tema = "decisión";

    if (!tema) {
        setEstado("error");
        hablar("No logré identificar el tema. Por favor di: cuerpo, mitos o decisión.");
        return;
    }

    if (temasVistos.includes(tema)) {
        const faltan = temas.filter(t => !temasVistos.includes(t));
        hablar(`Esa dimensión ya la exploramos. Aún nos falta conocer: ${faltan.join(" y ").toUpperCase()}.`);
        return;
    }

    temasVistos.push(tema);
    const contenido = {
        cuerpo: `La dimensión biológica es el derecho a cuidar tu propio cuerpo con soberanía. Tú eres la máxima autoridad sobre tu integridad física y reproductiva.`,
        mitos: `La dimensión social reconoce tu derecho a amar y expresar tu erotismo libremente, rompiendo prejuicios sobre la sexualidad en la discapacidad.`,
        decisión: `La dimensión ética es tu derecho al consentimiento informado. Eres el arquitecto de tu vida y tus decisiones deben ser libres de presiones.`
    };

    const faltan = temas.filter(t => !temasVistos.includes(t));
    if (faltan.length) {
        hablar(`${contenido[tema]}. ¿Continuamos con ${faltan.join(" o ").toUpperCase()}?`);
    } else {
        hablar(`${contenido[tema]}. ¡Felicidades ${nombreUsuario}! Has completado el recorrido. Di REPETIR para iniciar de nuevo o SALIR para finalizar.`);
    }
}

// 3. FUNCIÓN DE INICIO (Activada por botón)
function iniciar() {
    nombreUsuario = "";
    temasVistos = [];
    hablar(
        "Hola, soy IRIS, tu guía en derechos y autonomía. He sido diseñada para acompañarte en el reconocimiento de tu poder sobre tu propio cuerpo. " +
        "Puedes comunicarte conmigo a través de tu voz, o si lo prefieres, usando tu pantalla. " +
        "Antes de comenzar... ¿Cómo te gustaría que te llame?"
    );
}

// Mensaje inicial pasivo
window.addEventListener("load", () => {
    setTimeout(() => {
        if(cuadro) cuadro.innerHTML = `<div id="texto-estatico">Presiona el botón para despertar a IRIS</div>`;
    }, 500);
});