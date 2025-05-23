import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';

import { IconDirective } from '@coreui/icons-angular';
import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
    selector: 'app-dashboard',
    templateUrl: './default-layout.component.html',
    styleUrls: ['./default-layout.component.scss'],
    imports: [
      SidebarComponent,
      SidebarHeaderComponent,
      SidebarBrandComponent,
      SidebarNavComponent,
      SidebarFooterComponent,
      SidebarToggleDirective,
      SidebarTogglerDirective,
      ContainerComponent,
      DefaultFooterComponent,
      DefaultHeaderComponent,
      // Remove or comment out this line:
      // IconDirective,
      NgScrollbar,
      RouterOutlet,
      RouterLink,
      ShadowOnScrollDirective
     ]
})
export class DefaultLayoutComponent {
  public navItems = [...navItems];

  onScrollbarUpdate($event: any) {
    // if ($event.verticalUsed) {
    // console.log('verticalUsed', $event.verticalUsed);
    // }
  }
}


// export class DefaultLayoutComponent {
//   public navItems = [...navItems];
// }