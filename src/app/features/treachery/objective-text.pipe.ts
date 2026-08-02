import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'objectiveText',
  standalone: true,
})
export class ObjectiveTextPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    const text = value
        .replaceAll('{X}', '<i class="ms ms-X"></i>')
        .replaceAll('{0}', '<i class="ms ms-0"></i>')
        .replaceAll('{1}', '<i class="ms ms-1"></i>')
        .replaceAll('{2}', '<i class="ms ms-2"></i>')
        .replaceAll('{3}', '<i class="ms ms-3"></i>')
        .replaceAll('{4}', '<i class="ms ms-4"></i>')
        .replaceAll('{5}', '<i class="ms ms-5"></i>')
        .replaceAll('{6}', '<i class="ms ms-6"></i>')
        .replaceAll('{7}', '<i class="ms ms-7"></i>')  
        .replaceAll('{8}', '<i class="ms ms-8"></i>')   
        .replaceAll('{9}', '<i class="ms ms-9"></i>')   
        .replaceAll('{10}', '<i class="ms ms-10"></i>') 
        .replaceAll('{11}', '<i class="ms ms-11"></i>')
        .replaceAll('{12}', '<i class="ms ms-12"></i>') 
        .replaceAll('{13}', '<i class="ms ms-13"></i>')
        .replaceAll('{14}', '<i class="ms ms-14"></i>')
        .replaceAll('{15}', '<i class="ms ms-15"></i>')
        .replaceAll('{16}', '<i class="ms ms-16"></i>')
        .replaceAll('{m}', '<i class="ms ms-ability-d20"></i>')
        .replaceAll('{a}', '<i class="ms ms-acorn"></i>')
        .replaceAll('{T}', '<i class="ms ms-tap"></i>')
        .replaceAll('{w}', '<i class="ms ms-w"></i>')
        .replaceAll('{u}', '<i class="ms ms-u"></i>')
        .replaceAll('{b}', '<i class="ms ms-b"></i>')   
        .replaceAll('{r}', '<i class="ms ms-r"></i>')    
        .replaceAll('{g}', '<i class="ms ms-g"></i>')
        .replaceAll('{c}', '<i class="ms ms-c"></i>');
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }
}