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

let vozFemenina = null;
function cargarVoces() {
    const voces = sintetizador.getVoices();
    vozFemenina = voces.find(v => (v.lang.includes('es-CO') || v.lang.includes('es-MX') || v.lang.includes('es-ES')) && 
                                (v.name.includes('Helena') || v.name.includes('Sabina') || v.name.includes('Dalia') || v.name.includes('Google'))) 
                 || voces.find(v => v.lang.includes('es'));
}
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = cargarVoces;
cargarVoces();

function setRobotEstado(estado) {
    if (!robot) return;
    robot.className = ""; 
    if (estado !== 'error') cuadro.classList.remove('alerta-error');

    switch(estado) {
        case 'hablando': robot.classList.add('robot-hablando'); break;
        case 'escuchando': robot.classList.add('robot-escuchando'); break;
        case 'error': 
            robot.classList.add('robot-error');
            cuadro.classList.add('alerta-error'); 
            break;
        default: robot.classList.add('robot-reposo');
    }
}

// --- FUNCIÓN HABLAR (RECONSTRUIDA PARA EVITAR BLOQUEOS) ---
function hablar(mensaje, callback) {
    sintetizador.cancel(); // Limpia cualquier voz pendiente
    try { oido.abort(); } catch(e) {}

    irisHablando = true; 
    setRobotEstado('hablando');
    cuadro.innerHTML = ""; 

    const lectura = new SpeechSynthesisUtterance(mensaje);
    if (!vozFemenina) cargarVoces();
    lectura.voice = vozFemenina;
    lectura.lang = 'es-CO';
    lectura.rate = 1.0; 
    lectura.pitch = 1.1; 

    // Lógica de visualización de texto
    const esMensajeLargo = mensaje.length > 150;
    const contenedorTexto = document.createElement('div');
    
    if (esMensajeLargo) {
        contenedorTexto.id = "creditos-iris";
        contenedorTexto.style.position = "absolute";
        contenedorTexto.style.transition = "transform 0.1s linear";
        contenedorTexto.innerText = mensaje;
        cuadro.appendChild(contenedorTexto);

        lectura.onboundary = (event) => {
            if (event.name === 'word') {
                const progreso = event.charIndex / mensaje.length;
                const alturaTexto = contenedorTexto.offsetHeight;
                const alturaCuadro = cuadro.offsetHeight;
                const desplazamiento = (alturaCuadro * 0.5) - (progreso * (alturaTexto + alturaCuadro * 0.2));
                contenedorTexto.style.transform = `translateY(${desplazamiento}px)`;
            }
        };
    } else {
        contenedorTexto.id = "texto-estatico";
        contenedorTexto.innerText = mensaje;
        cuadro.appendChild(contenedorTexto);
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

function iniciarEscucha() {
    if (irisHablando) return;
    try {
        oido.start();
        cuadro.innerHTML = `<div id="texto-estatico">>>> IRIS ESCUCHANDO...</div>`;
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
        } else if (voz.includes("salir") || voz.includes("terminar")) {
            hablar("Gracias por usar IRIS. Tu autonomía es tu poder. Hasta pronto.");
            setTimeout(() => location.reload(), 3000);
        }
        return;
    }

    if (!nombreUsuario) {
        nombreUsuario = voz;
        hablar(`Mucho gusto, ${nombreUsuario}. Tienes derecho a decidir sobre tu vida. Di: CUERPO, MITOS o DECISIÓN.`);
    } else {
        procesarComandos(voz);
    }
};

function procesarComandos(comando) {
    let seleccion = "";
    if (comando.includes("cuerpo")) seleccion = "cuerpo";
    else if (comando.includes("mitos")) seleccion = "mitos";
    else if (comando.includes("decisión") || comando.includes("ética") || comando.includes("decision")) seleccion = "decisión";

    if (!seleccion) {
        hablar("No entendí. Intenta decir: Cuerpo, Mitos o Decisión.");
        return;
    }

    if (temasVistos.includes(seleccion)) {
        const faltantes = totalTemas.filter(t => !temasVistos.includes(t));
        hablar(`Esa ya la vimos. Te falta: ${faltantes.join(" o ").toUpperCase()}.`);
        return;
    }

    temasVistos.push(seleccion);

    const textos = {
        cuerpo: `La dimensión biológica representa el derecho fundamental a habitar, reconocer y cuidar tu propio cuerpo con total soberanía. Implica desarrollar un conocimiento profundo sobre tus sentidos y funciones reproductivas. Se trata de garantizar que tú seas la máxima autoridad sobre tu integridad física, asegurando que cualquier intervención respete siempre tu consentimiento y dignidad.`,
        mitos: `La dimensión social y afectiva reconoce que tienes el derecho inalienable a amar y expresar tu erotismo de manera libre, rompiendo con prejuicios que intentan invisibilizar la sexualidad en la discapacidad. Tienes derecho a disfrutar de tu intimidad, a explorar tu identidad de género y a decidir sobre la formación de una familia si así lo deseas.`,
        decisión: `La dimensión ética se centra en tu autonomía para la toma de decisiones. No se trata solo de elegir, sino de ejercer tu consentimiento informado y libre, asegurando que cada paso sea un reflejo de tus propios valores y no de presiones externas. Es tu derecho a ser el arquitecto de tu propio proyecto de vida.`
    };

    const mensajeBase = textos[seleccion];
    const temasRestantes = totalTemas.filter(t => !temasVistos.includes(t));

    if (temasRestantes.length === 2) {
        hablar(`${mensajeBase} Ahora quedan: ${temasRestantes.join(" o ").toUpperCase()}. ¿Cuál quieres?`);
    } else if (temasRestantes.length === 1) {
        const ultimo = temasRestantes[0];
        hablar(`${mensajeBase} Muy bien. Solo queda una dimensión, vamos a ella: ${ultimo.toUpperCase()}.`, () => {
            setTimeout(() => procesarComandos(ultimo), 2000);
        });
    } else {
        hablar(`${mensajeBase} ¡Felicidades ${nombreUsuario}! Has completado IRIS. Líder de equipo: Yair Leal Guerra. ¿Deseas REPETIR o SALIR?`);
    }
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