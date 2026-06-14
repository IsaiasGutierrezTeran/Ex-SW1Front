import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  PLATFORM_ID,
  signal,
  WritableSignal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Zap,
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
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { ThemeService } from '../../core/services/theme.service';
import { UsuarioService } from '../../core/services/usuario.service';

interface NavItem {
  label: string;
  icon: LucideIconData;
  link: string;
  roles: ('admin' | 'funcionario')[];
}

interface NavGroup {
  label: string;
  icon: LucideIconData;
  expanded: WritableSignal<boolean>;
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    if (this.isBrowser) {
      this.notif.iniciarPolling();
      if (this.auth.getUsuario()) this.usuarioSvc.cargarFotoPerfil();
    }
  }

  protected readonly icons = {
    dashboard:    LayoutDashboard as LucideIconData,
    users:        Users           as LucideIconData,
    departments:  Building2       as LucideIconData,
    policies:     ScrollText      as LucideIconData,
    activities:   Activity        as LucideIconData,
    documents:    FileText        as LucideIconData,
    workflows:    Workflow         as LucideIconData,
    aiSparkles:   Sparkles        as LucideIconData,
    tramites:     ClipboardList   as LucideIconData,
    chevronLeft:  ChevronLeft     as LucideIconData,
    chevronRight: ChevronRight    as LucideIconData,
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
  };

  private readonly storageKey = 'cre.sidebar.collapsed';
  readonly collapsed = signal<boolean>(this.readInitialCollapsed());

  readonly role = computed<'admin' | 'funcionario' | null>(() => {
    if (this.auth.isAdmin()) return 'admin';
    if (this.auth.isFuncionario()) return 'funcionario';
    return null;
  });

  readonly groupGestion: NavGroup = {
    label: 'Gestión',
    icon: this.icons.settings,
    expanded: signal(true),
    items: [
      { label: 'Usuarios',      icon: this.icons.users,       link: '/admin/usuarios',      roles: ['admin'] },
      { label: 'Departamentos', icon: this.icons.departments, link: '/admin/departamentos', roles: ['admin'] },
      { label: 'Políticas',     icon: this.icons.policies,    link: '/admin/politicas',     roles: ['admin'] },
      { label: 'Actividades',   icon: this.icons.activities,  link: '/admin/actividades',   roles: ['admin'] },
      { label: 'Documentos',    icon: this.icons.documents,   link: '/admin/documentos',    roles: ['admin'] },
    ],
  };

  readonly groupFlujos: NavGroup = {
    label: 'Flujos',
    icon: this.icons.flows,
    expanded: signal(true),
    items: [
      { label: 'Diagramas',           icon: this.icons.workflows,   link: '/admin/diagramas',             roles: ['admin'] },
      { label: 'Compartidos conmigo', icon: this.icons.compartidos, link: '/admin/diagramas/compartidos', roles: ['admin'] },
      { label: 'Diseño con IA',       icon: this.icons.aiSparkles,  link: '/admin/diagramas/ia',          roles: ['admin'] },
    ],
  };

  readonly groupAnalisis: NavGroup = {
    label: 'Análisis',
    icon: this.icons.metricas,
    expanded: signal(true),
    items: [
      { label: 'Métricas',          icon: this.icons.metricas,   link: '/admin/metricas',           roles: ['admin'] },
      { label: 'Historial',         icon: this.icons.historial,  link: '/admin/historial',          roles: ['admin'] },
      { label: 'Anomalías IA',      icon: this.icons.aiSparkles, link: '/admin/anomalias',          roles: ['admin'] },
      { label: 'Reportes IA',       icon: this.icons.aiSparkles, link: '/admin/reportes-naturales', roles: ['admin'] },
    ],
  };

  readonly userExpanded = signal(true);

  readonly menuGroups = [
    { key: 'gestion',  group: this.groupGestion },
    { key: 'flujos',   group: this.groupFlujos },
    { key: 'analisis', group: this.groupAnalisis },
  ];

  readonly openMenu = signal<string | null>(null);
  readonly mobileOpen = signal(false);

  readonly brandLink = computed(() =>
    this.role() === 'funcionario' ? '/funcionario/bandeja' : '/admin/dashboard',
  );

  toggleMenu(key: string, ev?: Event): void {
    ev?.stopPropagation();
    this.openMenu.update((cur) => (cur === key ? null : key));
  }

  closeMenus(): void {
    this.openMenu.set(null);
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

  readonly flatItems: NavItem[] = [
    { label: 'Dashboard',     icon: this.icons.dashboard,   link: '/admin/dashboard',     roles: ['admin'] },
    { label: 'Usuarios',      icon: this.icons.users,       link: '/admin/usuarios',      roles: ['admin'] },
    { label: 'Departamentos', icon: this.icons.departments, link: '/admin/departamentos', roles: ['admin'] },
    { label: 'Políticas',     icon: this.icons.policies,    link: '/admin/politicas',     roles: ['admin'] },
    { label: 'Actividades',   icon: this.icons.activities,  link: '/admin/actividades',   roles: ['admin'] },
    { label: 'Documentos',    icon: this.icons.documents,   link: '/admin/documentos',    roles: ['admin'] },
    { label: 'Diagramas',           icon: this.icons.workflows,   link: '/admin/diagramas',             roles: ['admin'] },
    { label: 'Compartidos conmigo', icon: this.icons.compartidos, link: '/admin/diagramas/compartidos', roles: ['admin'] },
    { label: 'Diseño con IA',       icon: this.icons.aiSparkles,  link: '/admin/diagramas/ia',          roles: ['admin'] },
    { label: 'Métricas',      icon: this.icons.metricas,    link: '/admin/metricas',           roles: ['admin'] },
    { label: 'Historial',     icon: this.icons.historial,   link: '/admin/historial',          roles: ['admin'] },
    { label: 'Anomalías IA',  icon: this.icons.aiSparkles,  link: '/admin/anomalias',          roles: ['admin'] },
    { label: 'Reportes IA',   icon: this.icons.aiSparkles,  link: '/admin/reportes-naturales', roles: ['admin'] },
    { label: 'Bandeja',       icon: this.icons.bandeja,     link: '/funcionario/bandeja',      roles: ['funcionario'] },
    { label: 'Notificaciones', icon: this.icons.campana,    link: '/notificaciones',           roles: ['admin', 'funcionario'] },
    { label: 'Compartidos conmigo', icon: this.icons.compartidos, link: '/funcionario/diagramas/compartidos', roles: ['funcionario'] },
  ];

  readonly visibleFlatItems = computed(() => {
    const r = this.role();
    if (!r) return [];
    return this.flatItems.filter((i) => i.roles.includes(r));
  });

  toggle(): void {
    this.collapsed.update((v) => !v);
    if (this.isBrowser) {
      localStorage.setItem(this.storageKey, this.collapsed() ? '1' : '0');
    }
  }

  toggleGroup(group: NavGroup): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      if (this.isBrowser) localStorage.setItem(this.storageKey, '0');
    }
    group.expanded.update((v) => !v);
  }

  toggleUser(): void {
    if (this.collapsed()) {
      this.collapsed.set(false);
      if (this.isBrowser) localStorage.setItem(this.storageKey, '0');
    }
    this.userExpanded.update((v) => !v);
  }

  private readInitialCollapsed(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(this.storageKey) === '1';
  }
}
