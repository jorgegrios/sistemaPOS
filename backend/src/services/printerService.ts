/**
 * Printer Service
 * Handles physical thermal printer integration
 * Supports network printers (TCP/IP) and USB printers
 */

import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

export interface PrinterConfig {
  name: string;
  type: 'kitchen' | 'bar';
  interface: string; // TCP/IP: 'tcp://192.168.1.100:9100' or USB path
  printerType: PrinterTypes;
  characterSet?: CharacterSet;
  enabled?: boolean;
}

class PrinterService {
  private printers: Map<string, ThermalPrinter> = new Map();
  private configs: PrinterConfig[] = [];

  /**
   * Initialize printers from environment variables
   */
  initializePrinters(): void {
    // Kitchen printer
    const kitchenInterface = process.env.KITCHEN_PRINTER_INTERFACE;
    const barInterface = process.env.BAR_PRINTER_INTERFACE;

    if (kitchenInterface) {
      this.addPrinter({
        name: 'Kitchen Printer',
        type: 'kitchen',
        interface: kitchenInterface,
        printerType: PrinterTypes.EPSON, // Default to Epson, can be changed via env
        characterSet: CharacterSet.PC852_LATIN2,
        enabled: process.env.KITCHEN_PRINTER_ENABLED !== 'false'
      });
    }

    if (barInterface) {
      this.addPrinter({
        name: 'Bar Printer',
        type: 'bar',
        interface: barInterface,
        printerType: PrinterTypes.EPSON,
        characterSet: CharacterSet.PC852_LATIN2,
        enabled: process.env.BAR_PRINTER_ENABLED !== 'false'
      });
    }

    console.log(`[Printer Service] Initialized ${this.printers.size} printer(s)`);
  }

  /**
   * Add a printer configuration
   */
  addPrinter(config: PrinterConfig): void {
    if (!config.enabled) {
      console.log(`[Printer Service] Printer ${config.name} is disabled`);
      return;
    }

    try {
      const printer = new ThermalPrinter({
        type: config.printerType,
        interface: config.interface,
        characterSet: config.characterSet || CharacterSet.PC852_LATIN2,
        removeSpecialCharacters: false,
        lineCharacter: '-',
        breakLine: BreakLine.WORD,
        options: {
          timeout: 5000,
        }
      });

      this.printers.set(config.type, printer);
      this.configs.push(config);
      console.log(`[Printer Service] Added printer: ${config.name} (${config.type})`);
    } catch (error: any) {
      console.error(`[Printer Service] Error adding printer ${config.name}:`, error.message);
    }
  }

  /**
   * Print text to a specific printer
   */
  async print(ticketType: 'kitchen' | 'bar', content: string): Promise<boolean> {
    const printer = this.printers.get(ticketType);

    if (!printer) {
      console.warn(`[Printer Service] No printer configured for type: ${ticketType}`);
      return false;
    }

    try {
      // Check if printer is connected
      const isConnected = await printer.isPrinterConnected();
      
      if (!isConnected) {
        console.error(`[Printer Service] Printer ${ticketType} is not connected`);
        return false;
      }

      // Clear previous content
      printer.clear();

      // Print content line by line
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          printer.alignLeft();
          printer.print(line);
          printer.newLine();
        }
      }

      // Cut paper
      printer.cut();

      // Execute print
      await printer.execute();
      
      console.log(`[Printer Service] Successfully printed ${ticketType} ticket`);
      return true;
    } catch (error: any) {
      console.error(`[Printer Service] Error printing to ${ticketType}:`, error.message);
      return false;
    }
  }

  /**
   * Print formatted ticket with styling
   */
  async printFormattedTicket(
    ticketType: 'kitchen' | 'bar',
    ticket: {
      orderNumber: string;
      tableId: string;
      items: Array<{ name: string; quantity: number; notes?: string }>;
      createdAt: Date;
      notes?: string;
    }
  ): Promise<boolean> {
    const printer = this.printers.get(ticketType);

    if (!printer) {
      console.warn(`[Printer Service] No printer configured for type: ${ticketType}`);
      return false;
    }

    try {
      const isConnected = await printer.isPrinterConnected();
      
      if (!isConnected) {
        console.error(`[Printer Service] Printer ${ticketType} is not connected`);
        return false;
      }

      printer.clear();

      // Header
      printer.alignCenter();
      printer.setTextSize(2, 2);
      printer.print(ticketType === 'kitchen' ? 'COCINA' : 'BAR');
      printer.newLine();
      printer.setTextSize(1, 1);
      printer.drawLine();
      printer.newLine();

      // Order info
      printer.alignLeft();
      printer.print(`Orden: ${ticket.orderNumber}`);
      printer.newLine();
      printer.print(`Mesa: ${ticket.tableId}`);
      printer.newLine();
      printer.print(`Hora: ${ticket.createdAt.toLocaleTimeString('es-ES')}`);
      printer.newLine();
      printer.drawLine();
      printer.newLine();

      // Items
      for (const item of ticket.items) {
        printer.print(`${item.quantity}x ${item.name}`);
        printer.newLine();
        if (item.notes) {
          printer.print(`   Nota: ${item.notes}`);
          printer.newLine();
        }
      }

      // General notes
      if (ticket.notes) {
        printer.newLine();
        printer.drawLine();
        printer.newLine();
        printer.print(`NOTA: ${ticket.notes}`);
        printer.newLine();
      }

      // Footer
      printer.newLine();
      printer.drawLine();
      printer.newLine();
      printer.alignCenter();
      printer.print(new Date().toLocaleString('es-ES'));
      printer.newLine();
      printer.newLine();
      printer.newLine();

      // Cut paper
      printer.cut();

      // Execute print
      await printer.execute();
      
      console.log(`[Printer Service] Successfully printed formatted ${ticketType} ticket`);
      return true;
    } catch (error: any) {
      console.error(`[Printer Service] Error printing formatted ticket to ${ticketType}:`, error.message);
      return false;
    }
  }

  /**
   * Test printer connection
   */
  async testPrinter(ticketType: 'kitchen' | 'bar'): Promise<boolean> {
    const printer = this.printers.get(ticketType);

    if (!printer) {
      return false;
    }

    try {
      const isConnected = await printer.isPrinterConnected();
      return isConnected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get printer status
   */
  getPrinterStatus(ticketType: 'kitchen' | 'bar'): {
    configured: boolean;
    connected: boolean;
    name?: string;
  } {
    const printer = this.printers.get(ticketType);
    const config = this.configs.find(c => c.type === ticketType);

    if (!printer || !config) {
      return {
        configured: false,
        connected: false
      };
    }

    return {
      configured: true,
      connected: false, // Will be checked async
      name: config.name
    };
  }

  /**
   * Get all printer configurations
   */
  getPrinters(): PrinterConfig[] {
    return [...this.configs];
  }
}

export default new PrinterService();

