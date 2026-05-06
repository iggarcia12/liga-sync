import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  isDarkMode = false;
  isSidebarCollapsed = false;
  isMobileOpen = false;

  ngOnInit() {
    this.initTheme();
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768) {
        this.isMobileOpen = false;
      } else {
        // En móvil el sidebar nunca usa el estado colapsado
        this.isSidebarCollapsed = false;
      }
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      this.isDarkMode = false;
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  mostrarMenu(): boolean {
    const ruta = this.router.url.split('?')[0];
    const rutasSinMenu = ['/login', '/registro', '/'];
    return !rutasSinMenu.includes(ruta);
  }

  toggleSidebar() {
    if (window.innerWidth < 768) {
      this.isMobileOpen = !this.isMobileOpen;
    } else {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  closeSidebar() {
    this.isMobileOpen = false;
  }

  salir() {
    this.authService.logout();
  }
}