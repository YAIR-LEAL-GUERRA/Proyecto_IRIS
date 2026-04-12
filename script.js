// CONFIGURACIÓN DE NAVEGACIÓN Y MOTORES
let nombreUsuario = "";
let irisHablando = false;

const sintetizador = window.speechSynthesis;
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
const oido = new Reconocimiento();

const robot = document.getElementById('robot-avatar');
const cuadro = document.getElementById('cuadro-texto');

let temasVistos = []; 
const totalTemas = ['cuerpo', 'mitos', 'decisión'];

oido.lang = 'es-CO';
oido.continuous = false;
oido.interimResults = false;

// DETECCIÓN MÓVIL
const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// VOZ
let vozFemenina = null;
function cargarVoces() {
    const voces = sintetizador.getVoices();
    vozFemenina = voces.find(v =>
        (v.lang.includes('es-CO') || v.lang.includes('es-MX') || v.lang.includes('es-ES')) &&
        (v.name.includes('Helena') || v.name.includes('Sabina') || v.name.includes('Dalia') || v.name.includes('Google'))
    ) || voces.find(v => v.lang.includes('es'));
}
if (speechSynthesis.onvoiceschanged !== undefined)
    speechSynthesis.onvoiceschanged = cargarVoces;

cargarVoces();

function setRobotEstado(estado) {
    if (!robot) return;

    robot.className = "";
    if (estado !== 'error') cuadro.classList.remove('alerta-error');

    switch (estado) {
        case 'hablando': robot.classList.add('robot-hablando'); break;
        case 'escuchando': robot.classList.add('robot-escuchando'); break;
        case 'error':
            robot.classList.add('robot-error');
            cuadro.classList.add('alerta-error');
            break;
        default:
            robot.classList.add('robot-reposo');
    }
}

// ========================
// HABLAR (PC + MÓVIL FIX)
// ========================
function hablar(mensaje, callback) {
    sintetizador.cancel();

    try { oido.abort(); } catch (e) {}

    irisHablando = true;

    const lectura = new SpeechSynthesisUtterance(mensaje);

    if (!vozFemenina) cargarVoces();
    lectura.voice = vozFemenina;
    lectura.lang = 'es-CO';
    lectura.rate = 1.0;
    lectura.pitch = 1.1;

    cuadro.innerHTML = "";
    setRobotEstado('hablando');

    const esMensajeLargo = mensaje.length > 150;

    if (esMensajeLargo) {

        const contenedor = document.createElement('div');
        contenedor.id = "creditos-iris";
        contenedor.innerText = mensaje;
        cuadro.appendChild(contenedor);

        // ========================
        // PC: onboundary (igual)
        // MÓVIL: animación por tiempo
        // ========================

        if (!esMovil) {

            lectura.onboundary = (event) => {
                if (event.name === 'word') {
                    const progreso = event.charIndex / mensaje.length;

                    const alturaTexto = contenedor.offsetHeight;
                    const alturaCuadro = cuadro.offsetHeight;

                    const inicio = alturaCuadro * 0.8;
                    const total = alturaTexto + (alturaCuadro * 0.5);

                    const y = inicio - (progreso * total);

                    contenedor.style.transform = `translateY(${y}px)`;
                    contenedor.style.top = "0";
                }
            };

        } else {

            // 🔥 MÓVIL FIX REAL
            let inicio = null;
            const duracion = Math.max(5000, mensaje.length * 60);

            const alturaTexto = contenedor.offsetHeight;
            const alturaCuadro = cuadro.offsetHeight;

            const inicioY = alturaCuadro * 0.8;
            const total = alturaTexto + (alturaCuadro * 0.5);

            function animar(ts) {
                if (!inicio) inicio = ts;

                let progreso = (ts - inicio) / duracion;
                if (progreso > 1) progreso = 1;

                const y = inicioY - (progreso * total);

                contenedor.style.transform = `translateY(${y}px)`;

                if (progreso < 1) {
                    requestAnimationFrame(animar);
                }
            }

            requestAnimationFrame(animar);
        }

    } else {
        const texto = document.createElement('div');
        texto.id = "texto-estatico";
        texto.innerText = mensaje;
        cuadro.appendChild(texto);
    }

    lectura.onend = () => {
        irisHablando = false;

        setTimeout(() => {
            if (callback) callback();
            else iniciarEscucha();
        }, 1200);
    };

    sintetizador.speak(lectura);
}

// ========================
// ESCUCHA
// ========================
function iniciarEscucha() {
    if (irisHablando) return;

    try {
        oido.start();
        cuadro.innerHTML = `>>> IRIS ESCUCHANDO...`;
        setRobotEstado('escuchando');
    } catch (e) {}
}

oido.onresult = (event) => {
    if (irisHablando) return;

    const voz = event.results[0][0].transcript.toLowerCase();

    if (temasVistos.length === 3) {
        if (voz.includes("repetir") || voz.includes("inicio")) {
            temasVistos = [];
            iniciarSistema();
        } else if (voz.includes("salir")) {
            hablar("Gracias por usar IRIS. Hasta pronto.");
            setTimeout(() => location.reload(), 3000);
        }
        return;
    }

    if (!nombreUsuario) {
        nombreUsuario = voz;
        hablar(`Mucho gusto ${nombreUsuario}. Elige: cuerpo, mitos o decisión.`);
    } else {
        procesarComandos(voz);
    }
};

// ========================
// ALERTA
// ========================
function activarAlertaVisual(msj) {
    cuadro.innerHTML = `<div class="error-texto">${msj}</div>`;
    setRobotEstado('error');

    const aviso = new SpeechSynthesisUtterance("No te escuché.");
    if (vozFemenina) aviso.voice = vozFemenina;
    sintetizador.speak(aviso);
}

// ========================
// REINTENTO
// ========================
function reintentarAccion() {
    clearTimeout(temporizadorInactividad);

    cuadro.classList.remove('alerta-error');

    if (!nombreUsuario) {
        iniciarSistema();
    } else {
        setRobotEstado('hablando');

        const faltantes = totalTemas.filter(t => !temasVistos.includes(t));

        hablar(`Recuerda: ${faltantes.join(" o ").toUpperCase()}`);
    }
}

// ========================
// COMANDOS (SIN CAMBIOS)
// ========================
function procesarComandos(comando) {
    let seleccion = "";

    if (comando.includes("cuerpo")) seleccion = "cuerpo";
    else if (comando.includes("mitos")) seleccion = "mitos";
    else if (comando.includes("decisión") || comando.includes("decision")) seleccion = "decisión";
    else if (comando.includes("inicio")) {
        temasVistos = [];
        hablar("Menú reiniciado");
        return;
    }

    if (!seleccion) return;

    if (temasVistos.includes(seleccion)) return;

    temasVistos.push(seleccion);

    const textos = {
        cuerpo: "Texto cuerpo...",
        mitos: "Texto mitos...",
        decisión: "Texto decisión..."
    };

    hablar(textos[seleccion]);
}

// ========================
// INICIO
// ========================
let temporizadorInactividad;

function iniciarSistema() {
    nombreUsuario = "";
    hablar("Hola, soy IRIS. ¿Tu nombre?");
}

function esperaSensible() {
    temporizadorInactividad = setTimeout(() => {
        if (!nombreUsuario && !irisHablando) {
            setRobotEstado('error');
            hablar("¿Necesitas ayuda para empezar?");
        }
    }, 7000);
}

window.addEventListener('load', esperaSensible);

// EVENTOS
window.addEventListener('click', (e) => {
    if (irisHablando) return;
});

window.addEventListener('keydown', () => {
    if (irisHablando) return;
});