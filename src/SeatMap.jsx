import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    getReservationState,
    getSeatRows,
    RESERVATION_EVENT,
    toggleSeat
} from './reservation-store.js';

function SeatMap() {
    const [state, setState] = useState(getReservationState);
    const rows = getSeatRows();
    const occupied = new Set(state.occupiedSeats);
    const selected = new Set(state.selectedSeats);

    useEffect(() => {
        const update = event => setState(event.detail);
        document.addEventListener(RESERVATION_EVENT, update);
        return () => document.removeEventListener(RESERVATION_EVENT, update);
    }, []);

    return (
        <div role="group" aria-label="Mapa de butacas">
            {rows.map(row => (
                <div className="fila" key={row.label}>
                    <span>{row.label}</span>
                    {row.seats.map(code => {
                        const isOccupied = occupied.has(code);
                        return (
                            <button
                                className={`asiento${isOccupied ? ' ocupado' : ''}`}
                                key={code}
                                type="button"
                                aria-label={`Butaca ${code}${isOccupied ? ', ocupada' : ''}`}
                                aria-pressed={selected.has(code)}
                                disabled={!state.currentFunction || isOccupied}
                                onClick={() => toggleSeat(code)}
                            >
                                {isOccupied ? '✕' : ''}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

createRoot(document.getElementById('mapa')).render(<SeatMap />);
