/**
 * Printer Discovery Service
 * Automatically detects and configures thermal printers on the network
 */

import { Pool } from 'pg';
import * as net from 'net';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export interface DiscoveredPrinter {
  ip: string;
  port: number;
  type: 'kitchen' | 'bar' | 'unknown';
  printerType?: PrinterTypes;
  name?: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  interface: string;
}

class PrinterDiscoveryService {
  private discoveredPrinters: Map<string, DiscoveredPrinter> = new Map();
  private scanning: boolean = false;

  /**
   * Scan network for thermal printers
   * Scans common printer ports and IP ranges
   */
  async scanNetwork(options?: {
    ipRange?: string; // e.g., "192.168.1.0/24"
    ports?: number[]; // Default: [9100, 515, 631]
    timeout?: number; // Default: 2000ms
  }): Promise<DiscoveredPrinter[]> {
    if (this.scanning) {
      console.log('[Printer Discovery] Scan already in progress');
      return Array.from(this.discoveredPrinters.values());
    }

    this.scanning = true;
    const discovered: DiscoveredPrinter[] = [];

    try {
      const ports = options?.ports || [9100, 515, 631];
      const timeout = options?.timeout || 2000;
      
      // Get local network IP range
      const ipRange = options?.ipRange || await this.getLocalNetworkRange();
      
      console.log(`[Printer Discovery] Scanning network ${ipRange} on ports ${ports.join(', ')}`);

      // Scan IPs in range
      const ipAddresses = this.generateIPRange(ipRange);
      
      // Scan in parallel (limit concurrency)
      const scanPromises: Promise<DiscoveredPrinter | null>[] = [];
      const batchSize = 20;

      for (let i = 0; i < ipAddresses.length; i += batchSize) {
        const batch = ipAddresses.slice(i, i + batchSize);
        
        for (const ip of batch) {
          for (const port of ports) {
            scanPromises.push(this.scanPrinter(ip, port, timeout));
          }
        }

        // Wait for batch to complete before next batch
        const batchResults = await Promise.all(scanPromises.slice(-batch.length * ports.length));
        const validPrinters = batchResults.filter((p): p is DiscoveredPrinter => p !== null);
        discovered.push(...validPrinters);
      }

      // Update discovered printers map
      for (const printer of discovered) {
        this.discoveredPrinters.set(printer.interface, printer);
      }

      // Auto-configure printers
      await this.autoConfigurePrinters(discovered);

      console.log(`[Printer Discovery] Found ${discovered.length} printer(s)`);
    } catch (error: any) {
      console.error('[Printer Discovery] Error scanning network:', error.message);
    } finally {
      this.scanning = false;
    }

    return discovered;
  }

  /**
   * Scan a specific IP and port for printer
   */
  private async scanPrinter(
    ip: string,
    port: number,
    timeout: number
  ): Promise<DiscoveredPrinter | null> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const onConnect = async () => {
        if (resolved) return;
        resolved = true;
        socket.destroy();

        try {
          // Try to detect printer type
          const printerType = await this.detectPrinterType(ip, port);
          
          const printer: DiscoveredPrinter = {
            ip,
            port,
            type: 'unknown',
            printerType: printerType || PrinterTypes.EPSON,
            status: 'online',
            lastSeen: new Date(),
            interface: `tcp://${ip}:${port}`
          };

          resolve(printer);
        } catch (error) {
          resolve(null);
        }
      };

      const onError = () => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      };

      const onTimeout = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(null);
        }
      };

      socket.setTimeout(timeout);
      socket.once('connect', onConnect);
      socket.once('error', onError);
      socket.once('timeout', onTimeout);

      try {
        socket.connect(port, ip);
      } catch (error) {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }
    });
  }

  /**
   * Detect printer type by sending test commands
   */
  private async detectPrinterType(ip: string, port: number): Promise<PrinterTypes | null> {
    // Try EPSON first (most common)
    try {
      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `tcp://${ip}:${port}`,
        options: { timeout: 1000 }
      });

      const connected = await printer.isPrinterConnected();
      if (connected) {
        return PrinterTypes.EPSON;
      }
    } catch (error) {
      // Not EPSON, try others
    }

    // Try STAR
    try {
      const printer = new ThermalPrinter({
        type: PrinterTypes.STAR,
        interface: `tcp://${ip}:${port}`,
        options: { timeout: 1000 }
      });

      const connected = await printer.isPrinterConnected();
      if (connected) {
        return PrinterTypes.STAR;
      }
    } catch (error) {
      // Not STAR
    }

    // Default to EPSON if connection works
    return PrinterTypes.EPSON;
  }

  /**
   * Get local network IP range
   */
  private async getLocalNetworkRange(): Promise<string> {
    const os = require('os');
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          const ip = iface.address;
          const parts = ip.split('.');
          return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
        }
      }
    }

    // Default fallback
    return '192.168.1.0/24';
  }

  /**
   * Generate IP addresses from CIDR range
   */
  private generateIPRange(cidr: string): string[] {
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength || '24', 10);
    const parts = network.split('.').map(Number);
    
    const ips: string[] = [];
    const hostBits = 32 - prefix;
    const hostCount = Math.pow(2, hostBits);

    // Limit to first 254 hosts (avoid broadcast)
    const maxHosts = Math.min(hostCount - 2, 254);

    for (let i = 1; i <= maxHosts; i++) {
      const ip = [
        parts[0],
        parts[1],
        parts[2],
        (parts[3] || 0) + i
      ].join('.');
      ips.push(ip);
    }

    return ips;
  }

  /**
   * Auto-configure discovered printers
   * Assigns printers to kitchen/bar based on naming or first available
   */
  private async autoConfigurePrinters(printers: DiscoveredPrinter[]): Promise<void> {
    if (printers.length === 0) return;

    try {
      // Check if we already have configured printers
      const existingKitchen = process.env.KITCHEN_PRINTER_INTERFACE;
      const existingBar = process.env.BAR_PRINTER_INTERFACE;

      // If no printers configured, auto-assign
      if (!existingKitchen && !existingBar) {
        // Assign first printer to kitchen
        if (printers.length >= 1) {
          const kitchenPrinter = printers[0];
          kitchenPrinter.type = 'kitchen';
          await this.savePrinterConfig('kitchen', kitchenPrinter);
          console.log(`[Printer Discovery] Auto-configured kitchen printer: ${kitchenPrinter.interface}`);
        }

        // Assign second printer to bar
        if (printers.length >= 2) {
          const barPrinter = printers[1];
          barPrinter.type = 'bar';
          await this.savePrinterConfig('bar', barPrinter);
          console.log(`[Printer Discovery] Auto-configured bar printer: ${barPrinter.interface}`);
        }
      } else {
        // Try to match by IP or name
        for (const printer of printers) {
          // Check if matches existing kitchen config
          if (existingKitchen && printer.interface === existingKitchen) {
            printer.type = 'kitchen';
            await this.savePrinterConfig('kitchen', printer);
          }
          // Check if matches existing bar config
          else if (existingBar && printer.interface === existingBar) {
            printer.type = 'bar';
            await this.savePrinterConfig('bar', printer);
          }
          // Try to detect by name
          else if (printer.name) {
            const nameLower = printer.name.toLowerCase();
            if (nameLower.includes('kitchen') || nameLower.includes('cocina')) {
              printer.type = 'kitchen';
              await this.savePrinterConfig('kitchen', printer);
            } else if (nameLower.includes('bar') || nameLower.includes('bebidas')) {
              printer.type = 'bar';
              await this.savePrinterConfig('bar', printer);
            }
          }
        }
      }

      // Save all discovered printers to database
      await this.saveDiscoveredPrinters(printers);
    } catch (error: any) {
      console.error('[Printer Discovery] Error auto-configuring printers:', error.message);
    }
  }

  /**
   * Save printer configuration to database
   */
  async savePrinterConfig(type: 'kitchen' | 'bar', printer: DiscoveredPrinter): Promise<void> {
    try {
      // Create or update printer configuration table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS printer_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(20) UNIQUE NOT NULL,
          interface VARCHAR(255) NOT NULL,
          ip VARCHAR(45) NOT NULL,
          port INTEGER NOT NULL,
          printer_type VARCHAR(50),
          name VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active',
          auto_discovered BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await pool.query(`
        INSERT INTO printer_configs (type, interface, ip, port, printer_type, name, auto_discovered, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT (type) 
        DO UPDATE SET 
          interface = EXCLUDED.interface,
          ip = EXCLUDED.ip,
          port = EXCLUDED.port,
          printer_type = EXCLUDED.printer_type,
          name = EXCLUDED.name,
          updated_at = NOW()
      `, [
        type,
        printer.interface,
        printer.ip,
        printer.port,
        printer.printerType || 'epson',
        printer.name || null
      ]);

      // Update environment (for current session)
      if (type === 'kitchen') {
        process.env.KITCHEN_PRINTER_INTERFACE = printer.interface;
        process.env.KITCHEN_PRINTER_ENABLED = 'true';
      } else if (type === 'bar') {
        process.env.BAR_PRINTER_INTERFACE = printer.interface;
        process.env.BAR_PRINTER_ENABLED = 'true';
      }
    } catch (error: any) {
      console.error(`[Printer Discovery] Error saving ${type} printer config:`, error.message);
    }
  }

  /**
   * Save discovered printers to database
   */
  private async saveDiscoveredPrinters(printers: DiscoveredPrinter[]): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS discovered_printers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ip VARCHAR(45) NOT NULL,
          port INTEGER NOT NULL,
          type VARCHAR(20),
          printer_type VARCHAR(50),
          name VARCHAR(255),
          interface VARCHAR(255) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'online',
          last_seen TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      for (const printer of printers) {
        await pool.query(`
          INSERT INTO discovered_printers (ip, port, type, printer_type, name, interface, status, last_seen, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (interface) 
          DO UPDATE SET 
            status = EXCLUDED.status,
            last_seen = EXCLUDED.last_seen,
            updated_at = NOW()
        `, [
          printer.ip,
          printer.port,
          printer.type,
          printer.printerType || 'epson',
          printer.name || null,
          printer.interface,
          printer.status,
          printer.lastSeen || new Date(),
          new Date()
        ]);
      }
    } catch (error: any) {
      console.error('[Printer Discovery] Error saving discovered printers:', error.message);
    }
  }

  /**
   * Load printer configurations from database
   */
  async loadPrinterConfigs(): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT * FROM printer_configs WHERE status = 'active'
      `);

      for (const row of result.rows) {
        if (row.type === 'kitchen') {
          process.env.KITCHEN_PRINTER_INTERFACE = row.interface;
          process.env.KITCHEN_PRINTER_ENABLED = 'true';
        } else if (row.type === 'bar') {
          process.env.BAR_PRINTER_INTERFACE = row.interface;
          process.env.BAR_PRINTER_ENABLED = 'true';
        }
      }

      console.log(`[Printer Discovery] Loaded ${result.rows.length} printer config(s) from database`);
    } catch (error: any) {
      // Table might not exist yet, that's okay
      console.log('[Printer Discovery] No existing printer configs found');
    }
  }

  /**
   * Get all discovered printers
   */
  getDiscoveredPrinters(): DiscoveredPrinter[] {
    return Array.from(this.discoveredPrinters.values());
  }

  /**
   * Get printer by type
   */
  getPrinterByType(type: 'kitchen' | 'bar'): DiscoveredPrinter | null {
    for (const printer of this.discoveredPrinters.values()) {
      if (printer.type === type) {
        return printer;
      }
    }
    return null;
  }

  /**
   * Start periodic scanning (optional)
   */
  startPeriodicScan(intervalMinutes: number = 30): void {
    setInterval(() => {
      if (!this.scanning) {
        console.log('[Printer Discovery] Starting periodic scan...');
        this.scanNetwork();
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export default new PrinterDiscoveryService();

