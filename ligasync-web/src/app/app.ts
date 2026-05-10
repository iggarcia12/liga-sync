import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ChatbotComponent } from './chatbot/chatbot';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ChatbotComponent, TranslateModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  private translate = inject(TranslateService);
  isDarkMode = false;
  isSidebarCollapsed = false;
  isMobileOpen = false;
  currentLang = 'es';

  ngOnInit() {
    const savedLang = localStorage.getItem('lang') || 'es';
    this.currentLang = savedLang;
    this.translate.use(savedLang);
    this.initTheme();
    this.checkScreenSize();
  }

  cambiarIdioma(lang: string) {
    this.currentLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  toggleIdioma() {
    this.cambiarIdioma(this.currentLang === 'es' ? 'en' : 'es');
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