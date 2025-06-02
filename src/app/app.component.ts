import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DossierComponent } from "./components/dossier/dossier.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DossierComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'dossier';
}
