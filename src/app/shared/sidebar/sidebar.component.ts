import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  LucideAngularModule,
  LucideIconData,
  LayoutDashboard,
  Users,
  Building2,
  ScrollText,
  Activity,
  Workflow,
  Sparkles,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Settings,
  GitBranch,
  Inbox,
  BarChart2,
  BookOpen,
  FileText,
  Share2,
  Bell,
  UserCircle,
  Menu,
  X,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { ThemeService } from '../../core/services/theme.service';
import { UsuarioService } from '../../core/services/usuario.service';

interface NavItem {
  label: string;
  icon: LucideIconData;
  link: string;
  badge?: boolean;
}

interface NavSection {
  key: string;
  label: string;
  icon: LucideIconData;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly notif = inject(NotificacionesService);
  readonly usuarioSvc = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (this.isBrowser) {
      this.notif.iniciarPolling();
      if (this.auth.getUsuario()) this.usuarioSvc.cargarFotoPerfil();
      this.router.events
        .pipe(
          filter((e): e is NavigationEnd => e instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((e) => {
          this.currentUrl.set(e.urlAfterRedirects);
          // Al navegar, la sub-navegación vuelve a seguir la URL activa.
          this.manualSection.set(null);
          this.mobileOpen.set(false);
          this.openMenu.set(null);
        });
    }
  }

  protected readonly icons = {
    dashboard:    LayoutDashboard as LucideIconData,
    users:        Users           as LucideIconData,
    departments:  Building2       as LucideIconData,
    policies:     ScrollText      as LucideIconData,
    activities:   Activity        as LucideIconData,
    documents:    FileText        as LucideIconData,
    workflows:    Workflow        as LucideIconData,
    aiSparkles:   Sparkles        as LucideIconData,
    chevronDown:  ChevronDown     as LucideIconData,
    logout:       LogOut          as LucideIconData,
    brand:        BookOpen        as LucideIconData,
    sun:          Sun             as LucideIconData,
    moon:         Moon            as LucideIconData,
    settings:     Settings        as LucideIconData,
    flows:        GitBranch       as LucideIconData,
    bandeja:      Inbox           as LucideIconData,
    metricas:     BarChart2       as LucideIconData,
    historial:    BookOpen        as LucideIconData,
    compartidos:  Share2          as LucideIconData,
    campana:      Bell            as LucideIconData,
    perfil:       UserCircle      as LucideIconData,
    menu:         Menu            as LucideIconData,
    close:        X               as LucideIconData,
  };

  readonly role = computed<'admin' | 'funcionario' | null>(() => {
    if (this.auth.isAdmin()) return 'admin';
    if (this.auth.isFuncionario()) return 'funcionario';
    return null;
  });

  private readonly adminSections: NavSection[] = [
    {
      key: 'principal',
      label: 'Principal',
      icon: this.icons.dashboard,
      items: [
        { label: 'Dashboard',      icon: this.icons.dashboard, link: '/admin/dashboard' },
        { label: 'Notificaciones', icon: this.icons.campana,   link: '/notificaciones', badge: true },
      ],
    },
    {
      key: 'gestion',
      label: 'Gestión',
      icon: this.icons.settings,
      items: [
        { label: 'Usuarios',      icon: this.icons.users,       link: '/admin/usuarios' },
        { label: 'Departamentos', icon: this.icons.departments, link: '/admin/departamentos' },
        { label: 'Políticas',     icon: this.icons.policies,    link: '/admin/politicas' },
        { label: 'Actividades',   icon: this.icons.activities,  link: '/admin/actividades' },
        { label: 'Documentos',    icon: this.icons.documents,   link: '/admin/documentos' },
      ],
    },
    {
      key: 'flujos',
      label: 'Flujos',
      icon: this.icons.flows,
      items: [
        { label: 'Diagramas',           icon: this.icons.workflows,   link: '/admin/diagramas' },
        { label: 'Compartidos conmigo', icon: this.icons.compartidos, link: '/admin/diagramas/compartidos' },
        { label: 'Diseño con IA',       icon: this.icons.aiSparkles,  link: '/admin/diagramas/ia' },
      ],
    },
    {
      key: 'analisis',
      label: 'Análisis',
      icon: this.icons.metricas,
      items: [
        { label: 'Métricas',     icon: this.icons.metricas,   link: '/admin/metricas' },
        { label: 'Historial',    icon: this.icons.historial,  link: '/admin/historial' },
        { label: 'Anomalías IA', icon: this.icons.aiSparkles, link: '/admin/anomalias' },
        { label: 'Reportes IA',  icon: this.icons.aiSparkles, link: '/admin/reportes-naturales' },
      ],
    },
  ];

  private readonly funcionarioSections: NavSection[] = [
    {
      key: 'trabajo',
      label: 'Trabajo',
      icon: this.icons.bandeja,
      items: [
        { label: 'Bandeja de Entrada',  icon: this.icons.bandeja,     link: '/funcionario/bandeja' },
        { label: 'Compartidos conmigo', icon: this.icons.compartidos, link: '/funcionario/diagramas/compartidos' },
      ],
    },
    {
      key: 'general',
      label: 'General',
      icon: this.icons.dashboard,
      items: [
        { label: 'Notificaciones', icon: this.icons.campana, link: '/notificaciones', badge: true },
      ],
    },
  ];

  readonly sections = computed<NavSection[]>(() => {
    const r = this.role();
    if (r === 'admin') return this.adminSections;
    if (r === 'funcionario') return this.funcionarioSections;
    return [];
  });

  private readonly currentUrl = signal<string>(this.isBrowser ? this.router.url : '/');
  private readonly manualSection = signal<string | null>(null);

  /** Sección cuya sub-navegación se muestra: manual (clic en rail) o derivada de la URL. */
  readonly activeSection = computed<NavSection | null>(() => {
    const secs = this.sections();
    if (secs.length === 0) return null;
    const manual = secs.find((s) => s.key === this.manualSection());
    if (manual) return manual;
    const url = this.currentUrl();
    const byUrl = secs.find((s) => s.items.some((i) => url.startsWith(i.link)));
    return byUrl ?? secs[0];
  });

  readonly activeSectionKey = computed<string>(() => this.activeSection()?.key ?? '');

  readonly openMenu = signal<string | null>(null);
  readonly mobileOpen = signal(false);

  readonly brandLink = computed(() =>
    this.role() === 'funcionario' ? '/funcionario/bandeja' : '/admin/dashboard',
  );

  selectSection(key: string): void {
    this.manualSection.set(key);
  }

  toggleUserMenu(ev?: Event): void {
    ev?.stopPropagation();
    this.openMenu.update((cur) => (cur === 'user' ? null : 'user'));
  }

  toggleMobile(): void {
    this.mobileOpen.update((v) => !v);
    this.openMenu.set(null);
  }

  onNavigate(): void {
    this.openMenu.set(null);
    this.mobileOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.openMenu() !== null) this.openMenu.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openMenu.set(null);
    this.mobileOpen.set(false);
  }
}
