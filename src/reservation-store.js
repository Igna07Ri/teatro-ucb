export const PRICE_PER_SEAT = 40;
export const RESERVATION_EVENT = 'reserva-actualizada';
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const COLUMNS = 10;

let currentFunction = null;
let selectedSeats = new Set();
let message = '';

function reservationKey(functionId) {
    return `reservas-funcion-${functionId}`;
}

function savedSeats(functionId) {
    const stored = localStorage.getItem(reservationKey(functionId));
    if (!stored) return [];

    const seats = JSON.parse(stored);
    if (!Array.isArray(seats) || !seats.every(seat => typeof seat === 'string')) {
        throw new Error(`Las reservas guardadas para ${functionId} tienen un formato inválido.`);
    }

    return seats;
}

function baseOccupiedSeats(functionId) {
    let seed = [...functionId].reduce((value, char) => value + char.charCodeAt(0), 0);
    const seats = [];

    ROWS.forEach(row => {
        for (let column = 1; column <= COLUMNS; column++) {
            seed = (seed * 9301 + 49297) % 233280;
            if (seed / 233280 < 0.22) seats.push(`${row}${column}`);
        }
    });

    return seats;
}

export function getReservationState() {
    if (!currentFunction) {
        return {
            currentFunction: null,
            selectedSeats: [],
            occupiedSeats: [],
            total: 0,
            message
        };
    }

    const occupiedSeats = new Set([
        ...baseOccupiedSeats(currentFunction.id),
        ...savedSeats(currentFunction.id)
    ]);

    return {
        currentFunction,
        selectedSeats: [...selectedSeats].sort(),
        occupiedSeats: [...occupiedSeats],
        total: selectedSeats.size * PRICE_PER_SEAT,
        message
    };
}

function publish() {
    document.dispatchEvent(new CustomEvent(RESERVATION_EVENT, {
        detail: getReservationState()
    }));
}

export function selectFunction(selectedFunction) {
    if (currentFunction?.id === selectedFunction?.id) return;

    currentFunction = selectedFunction;
    selectedSeats = new Set();
    message = '';
    publish();
}

export function toggleSeat(seatCode) {
    if (!currentFunction) return;

    const occupiedSeats = new Set(getReservationState().occupiedSeats);
    if (occupiedSeats.has(seatCode)) return;

    if (selectedSeats.has(seatCode)) {
        selectedSeats.delete(seatCode);
    } else {
        selectedSeats.add(seatCode);
    }

    message = '';
    publish();
}

export function confirmReservation() {
    if (!currentFunction || selectedSeats.size === 0) return;

    const seats = [...selectedSeats].sort();
    const total = seats.length * PRICE_PER_SEAT;
    const saved = new Set(savedSeats(currentFunction.id));
    seats.forEach(seat => saved.add(seat));
    localStorage.setItem(reservationKey(currentFunction.id), JSON.stringify([...saved]));

    selectedSeats = new Set();
    message = `Reserva confirmada: ${seats.join(', ')}. Total Bs ${total}.`;
    publish();
}

export function getSeatRows() {
    return ROWS.map(row => ({
        label: row,
        seats: Array.from({ length: COLUMNS }, (_, index) => `${row}${index + 1}`)
    }));
}
