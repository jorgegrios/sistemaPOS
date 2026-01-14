/**
 * Printer Management Routes
 * Manage thermal printers configuration and status
 */

import { Router, Request, Response } from 'express';
import printerService from '../services/printerService';
import printerDiscovery from '../services/printerDiscovery';

const router = Router();

/**
 * GET /api/v1/printers
 * List all configured printers
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const printers = printerService.getPrinters();
    const statuses = await Promise.all(
      printers.map(async (printer) => {
        const connected = await printerService.testPrinter(printer.type);
        return {
          ...printer,
          connected,
          status: connected ? 'online' : 'offline'
        };
      })
    );

    return res.json({ printers: statuses });
  } catch (error: any) {
    console.error('[Printers] Error listing printers:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/printers/:type/status
 * Get status of a specific printer
 */
router.get('/:type/status', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (type !== 'kitchen' && type !== 'bar') {
      return res.status(400).json({ error: 'Invalid printer type. Must be "kitchen" or "bar"' });
    }

    const status = printerService.getPrinterStatus(type as 'kitchen' | 'bar');
    const connected = await printerService.testPrinter(type as 'kitchen' | 'bar');

    return res.json({
      ...status,
      connected
    });
  } catch (error: any) {
    console.error('[Printers] Error getting printer status:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/printers/:type/test
 * Send a test print to a printer
 */
router.post('/:type/test', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;

    if (type !== 'kitchen' && type !== 'bar') {
      return res.status(400).json({ error: 'Invalid printer type. Must be "kitchen" or "bar"' });
    }

    const testContent = `
╔═══════════════════════════════╗
║        TEST PRINT             ║
╠═══════════════════════════════╣
Printer Type: ${type.toUpperCase()}
Time: ${new Date().toLocaleString('es-ES')}
╚═══════════════════════════════╝
    `.trim();

    const printed = await printerService.print(type as 'kitchen' | 'bar', testContent);

    if (printed) {
      return res.json({ ok: true, message: 'Test print sent successfully' });
    } else {
      return res.status(503).json({ error: 'Printer not available or not connected' });
    }
  } catch (error: any) {
    console.error('[Printers] Error sending test print:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/printers/:type/print
 * Print custom content to a printer
 */
router.post('/:type/print', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { content } = req.body;

    if (type !== 'kitchen' && type !== 'bar') {
      return res.status(400).json({ error: 'Invalid printer type. Must be "kitchen" or "bar"' });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' });
    }

    const printed = await printerService.print(type as 'kitchen' | 'bar', content);

    if (printed) {
      return res.json({ ok: true, message: 'Content printed successfully' });
    } else {
      return res.status(503).json({ error: 'Printer not available or not connected' });
    }
  } catch (error: any) {
    console.error('[Printers] Error printing content:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/printers/discover
 * Start automatic printer discovery on the network
 */
router.post('/discover', async (req: Request, res: Response) => {
  try {
    const { ipRange, ports, timeout } = req.body;

    const discovered = await printerDiscovery.scanNetwork({
      ipRange,
      ports,
      timeout
    });

    return res.json({
      ok: true,
      count: discovered.length,
      printers: discovered,
      message: `Found ${discovered.length} printer(s)`
    });
  } catch (error: any) {
    console.error('[Printers] Error discovering printers:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/printers/discovered
 * Get list of all discovered printers
 */
router.get('/discovered', async (req: Request, res: Response) => {
  try {
    const discovered = printerDiscovery.getDiscoveredPrinters();
    return res.json({ printers: discovered });
  } catch (error: any) {
    console.error('[Printers] Error getting discovered printers:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/printers/:type/assign
 * Manually assign a discovered printer to kitchen or bar
 */
router.post('/:type/assign', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { interface: printerInterface } = req.body;

    if (type !== 'kitchen' && type !== 'bar') {
      return res.status(400).json({ error: 'Invalid printer type. Must be "kitchen" or "bar"' });
    }

    if (!printerInterface) {
      return res.status(400).json({ error: 'Printer interface is required' });
    }

    const discovered = printerDiscovery.getDiscoveredPrinters();
    const printer = discovered.find(p => p.interface === printerInterface);

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found. Run discovery first.' });
    }

    printer.type = type as 'kitchen' | 'bar';
    
    // Save configuration
    await printerDiscovery.savePrinterConfig(type as 'kitchen' | 'bar', printer);

    // Re-initialize printer service
    printerService.initializePrinters();

    return res.json({
      ok: true,
      message: `Printer assigned to ${type}`,
      printer
    });
  } catch (error: any) {
    console.error('[Printers] Error assigning printer:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;

