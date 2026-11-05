import '@angular/compiler';
import 'zone.js';
import { ChangeDetectorRef, Component, inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import {
    confirmReservation,
    getReservationState,
    RESERVATION_EVENT
} from './reservation-store.js';

class ReservationSummaryComponent {
    constructor() {
        this.changeDetector = inject(ChangeDetectorRef);
        this.state = getReservationState();
        this.updateState = event => {
            this.state = event.detail;
            this.changeDetector.detectChanges();
        };
        document.addEventListener(RESERVATION_EVENT, this.updateState);
    }

    confirm() {
        confirmReservation();
    }
}

Component({
    selector: 'app-reservation-summary',
    standalone: false,
    template: `
        <div class="resumen" aria-live="polite">
            <p>Butacas: <strong>{{ state.selectedSeats.length ? state.selectedSeats.join(', ') : 'ninguna' }}</strong></p>
            <p>Total: <strong>Bs {{ state.total }}</strong></p>
        </div>
        <button class="btn" type="button" [disabled]="!state.selectedSeats.length" (click)="confirm()">
            Confirmar reserva
        </button>
        <p class="mensaje" role="status">{{ state.message }}</p>
    `
})(ReservationSummaryComponent);

class ReservationSummaryModule {}

NgModule({
    imports: [BrowserModule],
    declarations: [ReservationSummaryComponent],
    bootstrap: [ReservationSummaryComponent]
})(ReservationSummaryModule);

platformBrowserDynamic()
    .bootstrapModule(ReservationSummaryModule)
    .catch(error => {
        console.error('No se pudo iniciar el resumen Angular de la reserva.', error);
        const root = document.querySelector('app-reservation-summary');
        if (root) root.textContent = 'No se pudo cargar el resumen de la reserva.';
    });
