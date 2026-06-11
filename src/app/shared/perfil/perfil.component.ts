import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario.service';
import { mensajeAmigable } from '../../core/utils/error-messages';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container-fluid py-4">
      <div class="mb-4">
        <h1 class="h4 mb-0 page-title">Mi Perfil</h1>
        <p class="text-muted small mb-0">Administra tu información personal, foto y contraseña.</p>
      </div>

      <div class="row g-4">
        <!-- Avatar + identidad -->
        <div class="col-12 col-lg-4">
          <div class="card shadow-sm h-100">
            <div class="card-body text-center">
              <div class="perfil-avatar mx-auto">
                @if (fotoUrl()) {
                  <img [src]="fotoUrl()" alt="Foto de perfil" />
                } @else {
                  <span class="perfil-avatar-inicial">{{ inicial() }}</span>
                }
              </div>

              <h2 class="h5 mb-1 mt-3">{{ usuario()?.nombre }} {{ usuario()?.apellido }}</h2>
              <p class="text-muted small mb-1">{{ usuario()?.email }}</p>
              <span class="badge bg-primary text-capitalize">{{ usuario()?.tipo }}</span>

              <div class="mt-3">
                <label class="btn btn-outline-primary btn-sm w-100" [class.disabled]="subiendoFoto()">
                  @if (subiendoFoto()) { Subiendo… } @else { Cambiar foto }
                  <input type="file" accept="image/*" hidden (change)="onFoto($event)" [disabled]="subiendoFoto()" />
                </label>
                <p class="text-muted x-small mt-2 mb-0">JPG o PNG. Se guarda de forma segura en el servidor.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Datos personales + contraseña -->
        <div class="col-12 col-lg-8">
          <div class="card shadow-sm mb-4">
            <div class="card-header fw-semibold">Información personal</div>
            <div class="card-body">
              @if (msgPerfil()) { <div class="alert alert-success py-2">{{ msgPerfil() }}</div> }
              @if (errPerfil()) { <div class="alert alert-danger py-2">{{ errPerfil() }}</div> }

              <form [formGroup]="perfilForm" (ngSubmit)="guardarPerfil()" novalidate>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Nombre</label>
                    <input class="form-control" formControlName="nombre" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Apellido</label>
                    <input class="form-control" formControlName="apellido" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Teléfono</label>
                    <input class="form-control" formControlName="telefono" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">DNI / CI</label>
                    <input class="form-control" formControlName="dni" />
                  </div>
                  <div class="col-12">
                    <label class="form-label">Dirección</label>
                    <input class="form-control" formControlName="direccion" />
                  </div>
                </div>
                <div class="text-end mt-3">
                  <button type="submit" class="btn btn-primary" [disabled]="guardando() || perfilForm.invalid">
                    @if (guardando()) { Guardando… } @else { Guardar cambios }
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="card shadow-sm">
            <div class="card-header fw-semibold">Cambiar contraseña</div>
            <div class="card-body">
              @if (msgPass()) { <div class="alert alert-success py-2">{{ msgPass() }}</div> }
              @if (errPass()) { <div class="alert alert-danger py-2">{{ errPass() }}</div> }

              <form [formGroup]="passForm" (ngSubmit)="cambiarPass()" novalidate>
                <div class="row g-3">
                  <div class="col-12">
                    <label class="form-label">Contraseña actual</label>
                    <input type="password" class="form-control" formControlName="actual" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Nueva contraseña</label>
                    <input type="password" class="form-control" formControlName="nueva" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Confirmar nueva</label>
                    <input type="password" class="form-control" formControlName="confirmar" />
                  </div>
                </div>
                <div class="text-end mt-3">
                  <button type="submit" class="btn btn-primary" [disabled]="cambiandoPass() || passForm.invalid">
                    @if (cambiandoPass()) { Actualizando… } @else { Cambiar contraseña }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .perfil-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      display: grid;
      place-items: center;
      background: var(--cre-gradient-brand);
      box-shadow: var(--cre-shadow-md);
    }
    .perfil-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .perfil-avatar-inicial { color: #fff; font-size: 3rem; font-weight: 800; }
    .x-small { font-size: 0.72rem; }
  `],
})
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioSvc = inject(UsuarioService);

  readonly usuario = signal<any | null>(null);
  readonly fotoUrl = signal<string | null>(null);
  readonly guardando = signal(false);
  readonly cambiandoPass = signal(false);
  readonly subiendoFoto = signal(false);
  readonly msgPerfil = signal('');
  readonly errPerfil = signal('');
  readonly msgPass = signal('');
  readonly errPass = signal('');

  readonly perfilForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    telefono: [''],
    dni: [''],
    direccion: [''],
  });

  readonly passForm = this.fb.nonNullable.group({
    actual: ['', Validators.required],
    nueva: ['', [Validators.required, Validators.minLength(6)]],
    confirmar: ['', Validators.required],
  });

  readonly inicial = computed(() => {
    const u = this.usuario();
    return u?.nombre ? String(u.nombre).charAt(0).toUpperCase() : '?';
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.usuarioSvc.miPerfil().subscribe({
      next: (u: any) => {
        this.usuario.set(u);
        this.perfilForm.patchValue({
          nombre: u.nombre ?? '',
          apellido: u.apellido ?? '',
          telefono: u.telefono ?? '',
          dni: u.dni ?? '',
          direccion: u.direccion ?? '',
        });
        this.cargarFoto();
      },
      error: (e) => this.errPerfil.set(mensajeAmigable(e)),
    });
  }

  private cargarFoto(): void {
    this.usuarioSvc.miFoto().subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) this.fotoUrl.set(URL.createObjectURL(blob));
      },
      error: () => {},
    });
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid || this.guardando()) return;
    this.guardando.set(true);
    this.msgPerfil.set('');
    this.errPerfil.set('');
    this.usuarioSvc.actualizarMiPerfil(this.perfilForm.getRawValue()).subscribe({
      next: (u) => {
        this.usuario.set(u);
        this.msgPerfil.set('Datos actualizados correctamente.');
        this.guardando.set(false);
      },
      error: (e) => {
        this.errPerfil.set(mensajeAmigable(e));
        this.guardando.set(false);
      },
    });
  }

  cambiarPass(): void {
    if (this.passForm.invalid || this.cambiandoPass()) return;
    const { actual, nueva, confirmar } = this.passForm.getRawValue();
    if (nueva !== confirmar) {
      this.errPass.set('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    this.cambiandoPass.set(true);
    this.msgPass.set('');
    this.errPass.set('');
    this.usuarioSvc.cambiarPassword(actual, nueva).subscribe({
      next: () => {
        this.msgPass.set('Contraseña actualizada correctamente.');
        this.passForm.reset();
        this.cambiandoPass.set(false);
      },
      error: (e) => {
        this.errPass.set(mensajeAmigable(e));
        this.cambiandoPass.set(false);
      },
    });
  }

  onFoto(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.subiendoFoto.set(true);
    this.usuarioSvc.subirFoto(file).subscribe({
      next: (u) => {
        this.usuario.set(u);
        this.cargarFoto();
        this.subiendoFoto.set(false);
      },
      error: () => this.subiendoFoto.set(false),
    });
    input.value = '';
  }
}
