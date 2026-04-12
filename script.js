// CONFIGURACIÓN DE NAVEGACIÓN Y MOTORES
let nombreUsuario = "";
let irisHablando = false; // SEGURO: Evita interrupciones accidentales
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

// FUNCIÓN PARA SELECCIONAR VOZ FEMENINA
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

// --- FUNCIÓN HABLAR CON DESPLAZAMIENTO SINCRONIZADO ---
function hablar(mensaje, callback) {
    sintetizador.cancel();

    // 🔇 BLOQUEO REAL DEL MICRÓFONO SOLO AL HABLAR
    try { oido.abort(); } catch(e) {}

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
        const contenedorCreditos = document.createElement('div');
        contenedorCreditos.id = "creditos-iris";
        contenedorCreditos.innerText = mensaje;
        cuadro.appendChild(contenedorCreditos);

        lectura.onboundary = (event) => {
            if (event.name === 'word') {
                const caracteresLeidos = event.charIndex;
                const totalCaracteres = mensaje.length;
                const progreso = caracteresLeidos / totalCaracteres;
                
                const alturaTexto = contenedorCreditos.offsetHeight;
                const alturaCuadro = cuadro.offsetHeight;
                
                const puntoInicio = alturaCuadro * 0.8;
                const distanciaTotal = alturaTexto + (alturaCuadro * 0.5);
                
                const desplazamiento = puntoInicio - (progreso * distanciaTotal);
                contenedorCreditos.style.top = `${desplazamiento}px`;
            }
        };
    } else {
        const textoFijo = document.createElement('div');
        textoFijo.id = "texto-estatico";
        textoFijo.innerText = mensaje;
        cuadro.appendChild(textoFijo);
    }

    lectura.onend = () => {
        irisHablando = false;
        setTimeout(() => {
            if (callback) {
                callback();
            } else {
                iniciarEscucha();
            }
        }, 1200); 
    };
    sintetizador.speak(lectura);
}

function iniciarEscucha() {

    // 🛑 EVITA ESCUCHAR SI AÚN HABLA
    if (irisHablando) return;

    try {
        oido.start();
        cuadro.innerHTML = `<div id="texto-estatico">>>> IRIS ESCUCHANDO... (Habla ahora)</div>`;
        cuadro.style.borderColor = "#00FFFF"; 
        setRobotEstado('escuchando');
    } catch (e) { console.log("Re-intento de micro"); }
}

oido.onresult = (event) => {

    // 🧠 IGNORA VOZ SI IRIS HABLA
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
        hablar(`Mucho gusto, ${nombreUsuario}. Tienes derecho a decidir sobre tu vida. Para iniciar pronuncia una de las siguientes palabras: CUERPO, MITOS o DECISIÓN.`);
    } else {
        procesarComandos(voz);
    }
};

oido.onend = () => {
    const txtEst = document.getElementById('texto-estatico');
    if (txtEst && txtEst.innerText.includes("ESCUCHANDO")) {
        activarAlertaVisual("No logré escucharte. Toca la pantalla, presiona una tecla o haz clic para intentar de nuevo.");
    }
};

function activarAlertaVisual(msj) {
    cuadro.innerHTML = `<div id="texto-estatico" class="error-texto">${msj}</div>`;
    setRobotEstado('error'); 
    const aviso = new SpeechSynthesisUtterance("No te escuché. Toca la pantalla para reintentar.");
    if (vozFemenina) aviso.voice = vozFemenina;
    sintetizador.speak(aviso);
}

// --- FUNCIÓN DE REINTENTO INTELIGENTE ---
function reintentarAccion() {
    clearTimeout(temporizadorInactividad);
    cuadro.classList.remove('alerta-error');

    if (nombreUsuario === "") {
        iniciarSistema();
    } else {
        setRobotEstado('hablando');
        const faltantes = totalTemas.filter(t => !temasVistos.includes(t));
        if (faltantes.length > 0) {
            hablar(`Aquí estoy, ${nombreUsuario}. No logré escucharte. Recuerda que puedes elegir entre: ${faltantes.join(" o ").toUpperCase()}. ¿Cuál quieres explorar?`);
        } else {
            hablar(`Dime ${nombreUsuario}, ¿deseas REPETIR o SALIR?`);
        }
    }
}

function procesarComandos(comando) {
    let seleccion = "";
    if (comando.includes("cuerpo")) seleccion = "cuerpo";
    else if (comando.includes("mitos")) seleccion = "mitos";
    else if (comando.includes("decisión") || comando.includes("ética") || comando.includes("decision")) seleccion = "decisión";
    else if (comando.includes("inicio")) {
        temasVistos = [];
        hablar(`Hola de nuevo. Elige una dimensión: CUERPO, MITOS o DECISIÓN.`);
        return;
    }

    if (!seleccion) {
        hablar("No entendí. Intenta decir: Cuerpo, Mitos o Decisión.");
        return;
    }

    if (temasVistos.includes(seleccion)) {
        const faltantes = totalTemas.filter(t => !temasVistos.includes(t));
        hablar(`Esa dimensión ya la vimos, ${nombreUsuario}. Te falta conocer: ${faltantes.join(" o ").toUpperCase()}. ¿Cuál quieres ahora?`);
        return;
    }

    temasVistos.push(seleccion);

    const textos = {
        cuerpo: `La dimensión biológica no se limita únicamente a la anatomía o a la ausencia de enfermedades; representa el derecho fundamental a habitar, reconocer y cuidar tu propio cuerpo con total soberanía. Implica desarrollar un conocimiento profundo sobre tus sentidos, tu desarrollo físico y tus funciones reproductivas, entendiendo que cada proceso corporal es legítimo y merece respeto. Nutrir esta dimensión significa empoderarte para exigir servicios de salud inclusivos y de alta calidad, donde el personal médico se comunique de forma clara, sin tecnicismos ni juicios morales, y donde tu discapacidad no sea tratada como una limitación, sino como una característica de tu diversidad humana. Esto abarca desde el acceso a métodos de planificación familiar y prevención de infecciones, hasta el derecho al disfrute pleno del bienestar físico y el autocuidado cotidiano. En definitiva, se trata de garantizar que tú seas la máxima autoridad sobre tu integridad física, asegurando que cualquier intervención o tratamiento respectete siempre tu consentimiento y tu dignidad.`,
        
        mitos: `La dimensión social y afectiva reconoce que tienes el derecho inalienable a amar, ser amado y expresar tu erotismo de manera libre, voluntaria y placentera, rompiendo con los prejuicios que históricamente han intentado infantilizar o invisibilizar la sexualidad en la discapacidad. Esta faceta de tu vida es una manifestación legítima de tu personalidad, que abarca desde el deseo y la seducción hasta la construcción de vínculos emocionales profundos y significativos. Nutrir este aspecto implica denunciar y derribar las barreras del entorno —tanto físicas como actitudinales— que limitan tu participación en la vida social y afectiva. Tienes derecho a disfrutar de tu intimidad sin interferencias indebidas, a explorar tu orientación sexual e identidad de género con orgullo, y a decidir sobre la formación de una familia o la crianza de hijos si así lo deseas. Se trata de validar que tu capacidad de sentir, desear y compartir no tiene límites impuestos por otros, exigiendo que la sociedad te reconozca como un ser sexual integral, cuya privacidad y expresiones de afecto deben ser respetadas en igualdad de condiciones que las de cualquier otro ciudadano.`,
        
        decisión: `La dimensión ética se centra en el reconocimiento de tu autonomía como el eje fundamental para la toma de decisiones. No se trata solo de elegir, sino de ejercer tu derecho al consentimiento informado y libre, asegurando que cada paso que des en tu vida afectiva y sexual sea un reflejo fiel de tus propios valores y deseos, y no una respuesta a presiones externas, prejuicios sociales o imposiciones de terceros. Fortalecer esta dimensión implica desarrollar un juicio crítico que te permita distinguir entre lo que realmente quieres y lo que otros esperan de ti. Tienes el poder absoluto de decir "sí" a las experiencias que te enriquecen y, con la misma firmeza, decir "no" a cualquier situación que vulnere tu integridad o tu comodidad, sin sentir culpa ni temor. Esta libertad conlleva la responsabilidad de conocer las consecuencias de tus actos y el respeto mutuo en tus relaciones, garantizando que el pilar de cada interacción sea la comunicación clara y el respeto a la dignidad propia y ajena. Es, en esencia, tu derecho a ser el arquitecto de tu propio proyecto de vida, decidiendo con quién, cómo y cuándo compartir tu intimidad en un marco de libertad personal y responsabilidad afectiva.`
    };

    let mensajeBase = textos[seleccion];
    const temasRestantes = totalTemas.filter(t => !temasVistos.includes(t));

    if (temasRestantes.length === 2) {
        hablar(`${mensajeBase} Muy bien. Ahora solo quedan dos opciones: ${temasRestantes[0].toUpperCase()} o ${temasRestantes[1].toUpperCase()}. ¿Cuál quieres explorar?`);
    } 
    else if (temasRestantes.length === 1) {
        const ultimoTema = temasRestantes[0];
        hablar(`${mensajeBase} Muy bien, ${nombreUsuario}. Como solo queda una dimensión por conocer, vamos a explorar automáticamente: ${ultimoTema.toUpperCase()}.`, () => {
            setTimeout(() => {
                procesarComandos(ultimoTema);
            }, 2000);
        });
    } 
    else {
        hablar(`${mensajeBase} ¡Felicidades ${nombreUsuario}! Has completado todas las dimensiones de IRIS. Tu autonomía es tu mayor poder. Derechos reservados a Estudiantes UNAD. Lider de euqiipo estudiante Yair Leal Guerra. ¿Deseas REPETIR el menú desde el inicio o prefieres SALIR?`);
    }
}

let temporizadorInactividad;

function iniciarSistema() {
    clearTimeout(temporizadorInactividad);
    cuadro.classList.remove('alerta-error');
    nombreUsuario = ""; 
    hablar("Hola, soy IRIS. Tu guía de educación sexual. ¿Cuál es tu nombre?");
}

function esperaSensible() {
    temporizadorInactividad = setTimeout(() => {
        if (nombreUsuario === "" && !irisHablando) {
            setRobotEstado('error'); 
            hablar("Hola, parece que necesitas ayuda para empezar. Soy IRIS, una interfaz diseñada para ser escuchada. Si tienes dificultad visual o auditiva, no te preocupes, yo te guiaré. Presiona la barra espaciadora, haz clic o toca cualquier parte de la pantalla para decirme tu nombre.");
        }
    }, 7000);
}

window.addEventListener('load', esperaSensible);

// LISTENERS DE REINTENTO PROTEGIDOS
window.addEventListener('click', (e) => {
    if (irisHablando) return;
    const txtEst = document.getElementById('texto-estatico');
    if (e.target.id !== "btn-iniciar" && (cuadro.classList.contains('alerta-error') || (txtEst && txtEst.innerText.includes("ayuda")) || (txtEst && txtEst.innerText.includes("intentar")))) {
        reintentarAccion();
    }
});

window.addEventListener('keydown', () => {
    if (irisHablando) return;
    const txtEst = document.getElementById('texto-estatico');
    if (cuadro.classList.contains('alerta-error') || (txtEst && txtEst.innerText.includes("ayuda")) || (txtEst && txtEst.innerText.includes("intentar"))) {
        reintentarAccion();
    }
});