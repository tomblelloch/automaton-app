import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  symbols: string[];
}

export interface CheckableSymbol {
  name: string;
  checked: boolean;
}

@Component({
  selector: 'app-input-symbol-modal',
  templateUrl: './input-symbol-modal.component.html',
})
export class InputSymbolModalComponent {
  allChecked: boolean = false;
  symbols: CheckableSymbol[] = [];

  constructor(
    public dialogRef: MatDialogRef<InputSymbolModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    for (const symbol of data.symbols) {
      this.symbols.push({ name: symbol, checked: false });
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateAllChecked() {
    this.allChecked = this.symbols.every((t) => t.checked);
  }

  someChecked(): boolean {
    return this.symbols.filter((t) => t.checked).length > 0 && !this.allChecked;
  }

  setAll(selected: boolean) {
    this.allChecked = selected;
    this.symbols.forEach((t) => (t.checked = selected));
  }
}
