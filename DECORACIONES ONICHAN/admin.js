// 1. Importamos las herramientas de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. TU CONFIGURACIÓN EXACTA
const firebaseConfig = {
  apiKey: "AIzaSyCbV-vrmklTmmo9gwgzPnUAkqz4NgUD8LM",
  authDomain: "appturnosstudio.firebaseapp.com",
  projectId: "appturnosstudio",
  storageBucket: "appturnosstudio.firebasestorage.app",
  messagingSenderId: "912224316233",
  appId: "1:912224316233:web:cad5b38c6a831641214898"
};

// 3. Inicializamos Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listaTurnos = document.getElementById('lista-turnos');
const tablaTurnos = document.getElementById('tabla-turnos');
const mensajeCargando = document.getElementById('cargando');

// 4. Función para descargar los turnos ORDENADOS
async function cargarTurnos() {
    try {
        const querySnapshot = await getDocs(collection(db, "Turnos"));
        listaTurnos.innerHTML = '';

        if (querySnapshot.empty) {
            mensajeCargando.innerText = "No hay turnos agendados aún.";
            return;
        }

        let listaTemporal = [];
        querySnapshot.forEach((doc) => {
            listaTemporal.push({ id: doc.id, ...doc.data() });
        });

        listaTemporal.sort((a, b) => {
            const fechaHoraA = a.fecha + " " + a.hora;
            const fechaHoraB = b.fecha + " " + b.hora;
            return fechaHoraA.localeCompare(fechaHoraB); 
        });

        listaTemporal.forEach((turno) => {
            // Si el turno ya tiene una nota guardada, la mostramos. Si no, lo dejamos vacío.
            const notaActual = turno.nota || "";

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${turno.fecha}</strong> <br> ${turno.hora}</td>
                <td>${turno.cliente}</td>
                <td>${formatearServicio(turno.servicio)}</td>
                <td><a href="https://wa.me/${turno.telefono}" target="_blank">📲 ${turno.telefono}</a></td>
                <td class="estado-${turno.estado.toLowerCase()}">${turno.estado}</td>
                
                <td>
                    <textarea id="nota-${turno.id}" class="input-nota" placeholder="Ej: Cobrar $1,500, diseño calavera...">${notaActual}</textarea>
                    <button class="btn-accion" style="background-color: #f39c12; margin-top: 5px; width: 100%;" onclick="guardarNota('${turno.id}')">💾 Guardar Nota</button>
                </td>

                <td>
                    <button class="btn-accion" onclick="cambiarEstado('${turno.id}', 'Confirmado')">Confirmar</button>
                    <button class="btn-accion btn-cancelar" onclick="cambiarEstado('${turno.id}', 'Cancelado')">Cancelar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarTurno('${turno.id}')">🗑️ Borrar</button>
                </td>
            `;
            listaTurnos.appendChild(fila);
        });

        mensajeCargando.classList.add('oculto');
        tablaTurnos.classList.remove('oculto');

    } catch (error) {
        console.error("Error al cargar los turnos:", error);
        mensajeCargando.innerText = "Hubo un error al cargar la agenda.";
    }
}

function formatearServicio(servicioValue) {
    const nombres = {
        'unas_acrilicas': 'Uñas Acrílicas',
        'unas_gelish': 'Uñas Gelish',
        'tatuaje_pequeno': 'Tatuaje Pequeño',
        'tatuaje_mediano': 'Tatuaje Mediano',
        'limpieza_facial': 'Limpieza Facial'
    };
    return nombres[servicioValue] || servicioValue;
}

// 5. Cambiar Estado
async function cambiarEstado(idTurno, nuevoEstado) {
    try {
        const turnoRef = doc(db, "Turnos", idTurno);
        await updateDoc(turnoRef, { estado: nuevoEstado });
        alert(`¡El turno ha sido ${nuevoEstado}!`);
        cargarTurnos(); 
    } catch (error) {
        alert("Hubo un error al cambiar el estado.");
    }
}

// 6. Eliminar Turno
async function eliminarTurno(idTurno) {
    const confirmacion = confirm("¿Seguro que quieres borrar este turno definitivamente?");
    if (confirmacion) {
        try {
            await deleteDoc(doc(db, "Turnos", idTurno));
            alert("🗑️ ¡Turno eliminado correctamente!");
            cargarTurnos(); 
        } catch (error) {
            alert("Hubo un error al intentar borrar el turno.");
        }
    }
}

// 7. GUARDAR NOTA PRIVADA
async function guardarNota(idTurno) {
    const cajitaNota = document.getElementById(`nota-${idTurno}`);
    const textoNota = cajitaNota.value;
    
    // Cambiamos el texto del botón para que sepas que está guardando
    const btnGuardar = cajitaNota.nextElementSibling;
    const textoOriginal = btnGuardar.innerText;
    btnGuardar.innerText = "⏳ Guardando...";
    
    try {
        const turnoRef = doc(db, "Turnos", idTurno);
        // Actualizamos Firebase solo con el campo "nota"
        await updateDoc(turnoRef, { nota: textoNota });
        alert("📝 ¡Nota guardada con éxito!");
        btnGuardar.innerText = textoOriginal;
    } catch (error) {
        console.error("Error al guardar nota:", error);
        alert("Hubo un error al guardar la nota. Intenta de nuevo.");
        btnGuardar.innerText = textoOriginal;
    }
}

// 8. BUSCADOR
const inputBuscador = document.getElementById('buscador-clientes');
if (inputBuscador) {
    inputBuscador.addEventListener('input', function() {
        const textoBusqueda = this.value.toLowerCase(); 
        const filasTabla = document.querySelectorAll('#lista-turnos tr');
        filasTabla.forEach(fila => {
            if (fila.textContent.toLowerCase().includes(textoBusqueda)) {
                fila.style.display = ''; 
            } else {
                fila.style.display = 'none'; 
            }
        });
    });
}

// Exponemos las funciones para los botones HTML
window.cambiarEstado = cambiarEstado;
window.eliminarTurno = eliminarTurno;
window.guardarNota = guardarNota;

// Iniciamos la carga
cargarTurnos();