import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TramiteC2Service } from '../services/tramite-c2.service';

export const tramiteOwnershipGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tramiteId = route.params['id'] as string;
  const auth = inject(AuthService);
  const router = inject(Router);
  const tramiteSvc = inject(TramiteC2Service);

  if (auth.isAdmin()) return true;

  const miUserId = auth.getUserId();
  if (!tramiteId || !miUserId) {
    return router.createUrlTree(['/no-autorizado']);
  }

  return tramiteSvc.getExpediente(tramiteId).pipe(
    map((exp: any) => {
      const secciones: any[] = exp?.secciones ?? [];
      const esActiva = (e: string | undefined) =>
        ['En ejecucion', 'Pendiente de recepcion', 'Observado', 'en_curso'].includes(e ?? '');
      const ok = secciones.some(
        (s) => esActiva(s?.infoSeccion?.estado) && s?.infoSeccion?.funcionarioId === miUserId,
      );
      return ok ? true : router.createUrlTree(['/no-autorizado']);
    }),
    catchError(() => of(router.createUrlTree(['/no-autorizado']))),
  );
};
