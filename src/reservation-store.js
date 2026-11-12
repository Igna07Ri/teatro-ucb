import {
    butacasOcupadas,
    confirmarReserva as guardarReserva,
    usuarioActual
} from '../js/supabase.js';

export const PRICE_PER_SEAT = 40;
export const RESERVATION_EVENT = 'reserva-actualizada';
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLUMNS = 10;

let currentFunction = null;
let selectedSeats = new Set();
let occupiedSeats = new Set();
let message = '';
let messageType = '';
let loading = false;
let loadError = false;
let confirming = false;
let functionRequest = 0;

export function getReservationState() {
    return {
        currentFunction,
        selectedSeats: [...selectedSeats].sort(),
        occupiedSeats: [...occupiedSeats],
        total: selectedSeats.size * PRICE_PER_SEAT,
        message,
        messageType,
        loading,
        loadError,
        confirming
    };
}

function publish() {
    document.dispatchEvent(new CustomEvent(RESERVATION_EVENT, {
        detail: getReservationState()
    }));
}

export async function selectFunction(selectedFunction) {
    if (currentFunction?.id === selectedFunction?.id) return;

    const request = ++functionRequest;
    currentFunction = selectedFunction;
    selectedSeats = new Set();
    occupiedSeats = new Set();
    message = '';
    messageType = '';
    loading = Boolean(selectedFunction);
    loadError = false;
    publish();

    if (!selectedFunction) return;

    try {
        const seats = await butacasOcupadas(selectedFunction.id);
        if (request !== functionRequest) return;
        occupiedSeats = new Set(seats);
    } catch (error) {
        if (request !== functionRequest) return;
        loadError = true;
        message = `No se pudieron cargar las butacas ocupadas: ${errorMessage(error)}`;
        messageType = 'error';
    } finally {
        if (request === functionRequest) {
            loading = false;
            publish();
        }
    }
}

export function toggleSeat(seatCode) {
    if (!currentFunction || loading || loadError || confirming) return;
    if (occupiedSeats.has(seatCode)) return;

    if (selectedSeats.has(seatCode)) {
        selectedSeats.delete(seatCode);
    } else {
        selectedSeats.add(seatCode);
    }

    message = '';
    messageType = '';
    publish();
}

export async function confirmReservation() {
    if (!currentFunction || selectedSeats.size === 0 || loading || loadError || confirming) return;

    const functionId = currentFunction.id;
    const seats = [...selectedSeats].sort();
    const total = seats.length * PRICE_PER_SEAT;
    confirming = true;
    message = '';
    messageType = '';
    publish();

    try {
        const user = await usuarioActual();
        if (!user) {
            window.location.assign(new URL('login.html', document.baseURI).href);
            return;
        }

        await guardarReserva(functionId, seats);

        if (currentFunction?.id === functionId) {
            seats.forEach(seat => occupiedSeats.add(seat));
            selectedSeats = new Set();
        }
        message = `Reserva confirmada para ${functionId}: ${seats.join(', ')}. Total Bs ${total}.`;
        messageType = 'success';
    } catch (error) {
        message = `No se pudo confirmar la reserva: ${errorMessage(error)}`;
        messageType = 'error';

        if (
            currentFunction?.id === functionId
            && error instanceof Error
            && error.message.includes('Alguna butaca ya fue reservada')
        ) {
            try {
                occupiedSeats = new Set(await butacasOcupadas(functionId));
                occupiedSeats.forEach(seat => selectedSeats.delete(seat));
                message = 'Alguna butaca ya fue reservada. Se actualizó el mapa; revisa tu selección.';
            } catch (refreshError) {
                console.error('No se pudo actualizar el mapa tras el conflicto de reserva.', refreshError);
                loadError = true;
                message += ' No se pudo actualizar el mapa de butacas.';
            }
        }
    } finally {
        confirming = false;
        publish();
    }
}

function errorMessage(error) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return 'Error desconocido.';
}

export function getSeatRows() {
    return ROWS.map(row => ({
        label: row,
        seats: Array.from({ length: COLUMNS }, (_, index) => `${row}${index + 1}`)
    }));
}
