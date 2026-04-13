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
oido.continuous = false;
oido.interimResults = false;

/* =========================
   PAUSA TÁCTIL (solo texto)
========================= */
cuadro.addEventListener("click", () => {
    animacionActiva = !animacionActiva;
});

/* =========================
   FUNCIÓN HABLAR
========================= */
function hablar(mensaje, callback) {
    sintetizador.cancel();
    irisHablando = true;
    cuadro.innerHTML = "";

    const lectura = new SpeechSynthesisUtterance(mensaje);
    lectura.lang = 'es-CO';
    lectura.rate = 1;
    lectura.pitch = 1.1;

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
                let progreso = (t - start) / duracion;

                let y = startY + (endY - startY) * progreso;
                contenedor.style.transform = `translateY(${y}px)`;

                if (progreso < 1) requestAnimationFrame(animar);
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

/* =========================
   ESCUCHA
========================= */
function iniciarEscucha() {
    if (irisHablando) return;

    try {
        oido.start();
        cuadro.innerHTML = `<div id="texto-estatico">>>> IRIS ESCUCHANDO...</div>`;
    } catch {}
}

/* =========================
   RECONOCIMIENTO DE VOZ
========================= */
oido.onresult = (event) => {
    if (irisHablando) return;

    const voz = event.results[0][0].transcript.toLowerCase();

    if (!nombreUsuario) {
        nombreUsuario = voz;

        hablar(
`Hola ${nombreUsuario}. Soy IRIS, una interfaz educativa sobre autonomía, cuerpo y derechos.
Vamos a explorar tres temas importantes: cuerpo, mitos y decisión.
Di uno de ellos para comenzar.`
        );

        return;
    }

    procesarComandos(voz);
};

/* =========================
   LÓGICA DE TEMAS
========================= */
function procesarComandos(comando) {

    let seleccion = "";

    if (comando.includes("cuerpo")) seleccion = "cuerpo";
    else if (comando.includes("mitos")) seleccion = "mitos";
    else if (comando.includes("decisión") || comando.includes("decision")) seleccion = "decisión";

    if (!seleccion) {
        hablar("No entendí. Di: cuerpo, mitos o decisión.");
        return;
    }

    if (temasVistos.includes(seleccion)) {
        const faltantes = totalTemas.filter(t => !temasVistos.includes(t));
        hablar(`Ya viste ese tema. Aún te faltan: ${faltantes.join(" y ").toUpperCase()}.`);
        return;
    }

    temasVistos.push(seleccion);

    const textos = {
        cuerpo: `
TEMA: CUERPO

Este tema trata sobre el derecho a reconocer, habitar y cuidar tu cuerpo con autonomía.

Significa que tu cuerpo es tuyo, que nadie puede decidir por ti sin tu consentimiento, y que tienes derecho a la información sobre tu salud física y sexual.

IRIS te recuerda: tu cuerpo no es objeto de control, es tu primer territorio de libertad.
        `,

        mitos: `
TEMA: MITOS

Este tema aborda los mitos y creencias sociales sobre la sexualidad, el amor y la discapacidad.

Muchas veces la sociedad limita o invisibiliza la vida afectiva de las personas, pero tienes derecho a amar, a explorar tu identidad y a vivir tu sexualidad de forma libre y respetada.

IRIS te recuerda: los mitos no definen tu vida, tú sí.
        `,

        decisión: `
TEMA: DECISIÓN

Este tema trata sobre la autonomía y la toma de decisiones informadas.

Significa que puedes decidir sobre tu vida, tu cuerpo y tus relaciones sin presión externa, con información clara y respeto por tu voluntad.

IRIS te recuerda: decidir por ti mismo es un derecho, no un privilegio.
        `
    };

    const mensaje = textos[seleccion];

    const restantes = totalTemas.filter(t => !temasVistos.includes(t));

    if (restantes.length > 0) {
        hablar(
`${mensaje}

Ahora te falta explorar: ${restantes.join(" y ").toUpperCase()}.`
        );
    } else {
        hablar(
`${mensaje}

¡Felicidades ${nombreUsuario}! Has completado los tres temas de IRIS.
Recuerda: cuerpo, mitos y decisión forman parte de tu autonomía personal.

Puedes decir REPETIR o SALIR.`
        );
    }
}

/* =========================
   INICIO
========================= */
function iniciarSistema() {
    nombreUsuario = "";
    temasVistos = [];
    hablar("Hola, soy IRIS. ¿Cuál es tu nombre?");
}

window.addEventListener('load', () => {
    setTimeout(() => {
        iniciarSistema();
    }, 1000);
});