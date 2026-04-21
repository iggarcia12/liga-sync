import { Component, inject, OnInit } from '@angular/core';
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
  public authService = inject(AuthService); // Hacerlo público para usarlo en el HTML
  isDarkMode = false;

  ngOnInit() {
    this.initTheme();
  }

  // Inicializa el tema leyendo del localStorage o de las preferencias del sistema
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

  // Alterna entre modo oscuro y claro y lo guarda
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    const theme = this.isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  mostrarMenu(): boolean {
    const rutasSinMenu = ['/login', '/registro', '/'];
    return !rutasSinMenu.includes(this.router.url);
  }

  salir() {
    this.authService.logout();
  }
}