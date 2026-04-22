import { Component, OnInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cursor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cursor" #dot></div>
    <div class="cursor-ring" #ring></div>
  `,
  styles: [`
    .cursor {
      width: 8px; height: 8px;
      background: var(--rose-gold);
      border-radius: 50%;
      position: fixed; pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
      transition: transform 0.1s ease;
    }
    .cursor-ring {
      width: 32px; height: 32px;
      border: 1px solid var(--rose-gold);
      border-radius: 50%;
      position: fixed; pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      transition: left 0.12s ease, top 0.12s ease, transform 0.2s ease, opacity 0.2s ease;
      opacity: 0.6;
    }
  `]
})
export class CursorComponent implements OnInit {
  @ViewChild('dot', { static: true }) dot!: ElementRef<HTMLDivElement>;
  @ViewChild('ring', { static: true }) ring!: ElementRef<HTMLDivElement>;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    document.addEventListener('mousemove', (e) => {
      const x = e.clientX + 'px';
      const y = e.clientY + 'px';
      this.renderer.setStyle(this.dot.nativeElement, 'left', x);
      this.renderer.setStyle(this.dot.nativeElement, 'top', y);
      this.renderer.setStyle(this.ring.nativeElement, 'left', x);
      this.renderer.setStyle(this.ring.nativeElement, 'top', y);
    });

    document.addEventListener('mouseover', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('a, button, [role="button"], input, select, label, .clickable')) {
        this.renderer.setStyle(this.dot.nativeElement, 'transform', 'translate(-50%,-50%) scale(2)');
        this.renderer.setStyle(this.ring.nativeElement, 'transform', 'translate(-50%,-50%) scale(1.5)');
        this.renderer.setStyle(this.ring.nativeElement, 'opacity', '0.3');
      } else {
        this.renderer.setStyle(this.dot.nativeElement, 'transform', 'translate(-50%,-50%) scale(1)');
        this.renderer.setStyle(this.ring.nativeElement, 'transform', 'translate(-50%,-50%) scale(1)');
        this.renderer.setStyle(this.ring.nativeElement, 'opacity', '0.6');
      }
    });
  }
}
