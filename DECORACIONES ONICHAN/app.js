// 1. Importamos las herramientas
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCbV-vrmklTmmo9gwgzPnUAkqz4NgUD8LM",
  authDomain: "appturnosstudio.firebaseapp.com",
  projectId: "appturnosstudio",
  storageBucket: "appturnosstudio.firebasestorage.app",
  messagingSenderId: "912224316233",
  appId: "1:912224316233:web:cad5b38c6a831641214898"
};

// 3. Inicializamos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. LÓGICA DE LOS HORARIOS
const horariosDisponibles = ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'];

const inputFecha = document.getElementById('fecha');
const contenedorHorarios = document.getElementById('contenedor-horarios');
const inputHoraHidden = document.getElementById('hora');
const mensajeFecha = document.getElementById('mensaje-fecha-primero');

// ESTE ES EL ÚNICO BLOQUE QUE NECESITAMOS AHORA PARA LA FECHA
inputFecha.addEventListener('change', async () => {
    const fechaSeleccionada = inputFecha.value;
    
    // Limpiamos la selección y mostramos texto de "cargando" en azulito
    inputHoraHidden.value = '';
    mensajeFecha.style.display = 'none';
    contenedorHorarios.innerHTML = '<p style="color:#00d2ff; font-size:14px; grid-column: span 3; text-align:center;">Buscando horarios...</p>';

    try {
        // Buscamos turnos en Firebase SOLO para esa fecha
        const consulta = query(collection(db, "Turnos"), where("fecha", "==", fechaSeleccionada));
        const turnosEncontrados = await getDocs(consulta);
        
        let horasOcupadas = [];
        turnosEncontrados.forEach((doc) => {
            const turno = doc.data();
            if (turno.estado !== "Cancelado") {
                horasOcupadas.push(turno.hora); // Guardamos la hora ocupada
            }
        });

        // Dibujamos los botones
        contenedorHorarios.innerHTML = ''; // Borramos el mensaje de cargando
        
        horariosDisponibles.forEach(hora => {
            const btnHora = document.createElement('button');
            btnHora.type = 'button'; // ¡Vital para no recargar la página!
            btnHora.classList.add('hora-btn');
            btnHora.innerText = hora;

            // Si la hora está en la lista de ocupadas, la bloqueamos
            if (horasOcupadas.includes(hora)) {
                btnHora.classList.add('ocupado');
                btnHora.disabled = true; // Para que no se le pueda dar clic
                // Le damos un estilo "apagado/ocupado"
                btnHora.style.backgroundColor = '#1a1a1a';
                btnHora.style.color = '#444';
                btnHora.style.borderColor = '#111';
                btnHora.style.cursor = 'not-allowed';
                btnHora.style.textDecoration = 'line-through';
            } else {
                // Si está libre, le damos la función de seleccionarse y brillar en azul
                btnHora.addEventListener('click', () => {
                    // Quitamos el color a todos los botones
                    document.querySelectorAll('.hora-btn').forEach(b => b.classList.remove('seleccionado'));
                    // Pintamos este botón de azul
                    btnHora.classList.add('seleccionado');
                    // Guardamos la hora en el input oculto para enviarlo a Firebase
                    inputHoraHidden.value = hora;
                });
            }
            contenedorHorarios.appendChild(btnHora);
        });

    } catch (error) {
        console.error("Error al cargar horarios:", error);
        contenedorHorarios.innerHTML = '<p style="color:red; font-size:12px; grid-column: span 3;">Error al cargar. Intenta elegir la fecha de nuevo.</p>';
    }
});

// 5. GUARDAR EL TURNO EN FIREBASE
const formulario = document.getElementById('form-reserva');
const mensajeExito = document.getElementById('mensaje-exito');
const btnReservar = document.getElementById('btn-reservar');

formulario.addEventListener('submit', async function(evento) {
    evento.preventDefault();
    
    const horaSeleccionada = inputHoraHidden.value;
    
    // Validamos que hayan hecho clic en un botón de hora
    if (!horaSeleccionada) {
        alert("Por favor, selecciona un horario disponible.");
        return;
    }

    btnReservar.innerText = "Guardando turno...";
    btnReservar.disabled = true;

    try {
        const nuevoTurno = {
            servicio: document.getElementById('servicio').value,
            fecha: inputFecha.value,
            hora: horaSeleccionada,
            cliente: document.getElementById('nombre').value,
            telefono: document.getElementById('telefono').value,
            estado: 'Pendiente'
        };

        const documento = await addDoc(collection(db, "Turnos"), nuevoTurno);
        console.log("¡Turno guardado con ID: ", documento.id);
        
        // --- MAGIA DE WHATSAPP ---
        const miNumero = "5559572192"; 
        const selectServicio = document.getElementById('servicio');
        const servicioNombre = selectServicio.options[selectServicio.selectedIndex].text;
        const nombreCliente = document.getElementById('nombre').value;
        
        const mensajeWa = `¡Hola Axel! 👋 Acabo de agendar un turno para ${servicioNombre} el día ${inputFecha.value} a las ${horaSeleccionada}. Mi nombre es ${nombreCliente}.`;
        const urlWhatsApp = `https://wa.me/${miNumero}?text=${encodeURIComponent(mensajeWa)}`;
        document.getElementById('btn-whatsapp').href = urlWhatsApp;
        // -------------------------
        
        formulario.style.display = 'none';
        mensajeExito.classList.remove('oculto');
        
    } catch (error) {
        console.error("Hubo un error: ", error);
        alert("Hubo un problema de conexión. Intenta de nuevo.");
        btnReservar.innerText = "Confirmar Turno";
        btnReservar.disabled = false;
    }
});