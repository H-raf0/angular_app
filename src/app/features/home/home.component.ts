import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DecorativeHeaderComponent } from '~shared/components/decorative-header/decorative-header.component';
import { CardComponent } from '~shared/components/card/card.component';

@Component({
  selector: 'app-home',
  imports: [DecorativeHeaderComponent, CardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
