import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    console.log('🌱 Iniciando seed de menú Latino NYC para compañía default...');

    try {
        // 1. Obtener compañía default y su restaurante
        const companyResult = await pool.query("SELECT id FROM companies WHERE slug = 'default' LIMIT 1");
        if (companyResult.rows.length === 0) {
            console.error('❌ No se encontró la compañía "default".');
            return;
        }
        const companyId = companyResult.rows[0].id;

        const restaurantResult = await pool.query("SELECT id FROM restaurants WHERE company_id = $1 LIMIT 1", [companyId]);
        if (restaurantResult.rows.length === 0) {
            console.error('❌ No se encontró un restaurante para la compañía default.');
            return;
        }
        const restaurantId = restaurantResult.rows[0].id;

        // 2. Crear o actualizar Menú Principal
        let menuId: string;
        const existingMenu = await pool.query("SELECT id FROM menus WHERE company_id = $1 AND restaurant_id = $2 LIMIT 1", [companyId, restaurantId]);

        if (existingMenu.rows.length > 0) {
            menuId = existingMenu.rows[0].id;
            console.log(`📋 Usando menú existente: ${menuId}`);
        } else {
            menuId = uuidv4();
            await pool.query(
                "INSERT INTO menus (id, company_id, restaurant_id, name, active) VALUES ($1, $2, $3, $4, true)",
                [menuId, companyId, restaurantId, 'Menú Latino NYC']
            );
            console.log(`📋 Nuevo menú creado: ${menuId}`);
        }

        // 3. Limpiar datos viejos (opcional, pero ayuda a que se vea limpio)
        // No borramos todo, solo items relacionados con este menú para evitar romper relaciones de órdenes viejas
        // Pero como es un entorno de desarrollo/prueba solicitado por el usuario, vamos a insertar datos nuevos.

        // 4. Categorias
        const categories = [
            { id: uuidv4(), name: 'Entradas & Snacks', order: 1, type: 'kitchen' },
            { id: uuidv4(), name: 'Platos Fuertes (Colombia & NYC)', order: 2, type: 'kitchen' },
            { id: uuidv4(), name: 'Especialidades Dominicanas & PR', order: 3, type: 'kitchen' },
            { id: uuidv4(), name: 'Pescados & Mariscos', order: 4, type: 'kitchen' },
            { id: uuidv4(), name: 'Sopas & Caldos', order: 5, type: 'kitchen' },
            { id: uuidv4(), name: 'Guarniciones (Sides)', order: 6, type: 'kitchen' },
            { id: uuidv4(), name: 'Postres Caseros', order: 7, type: 'kitchen' },
            { id: uuidv4(), name: 'Bebidas Naturales & Sodas', order: 8, type: 'bar' },
            { id: uuidv4(), name: 'Cocteles & Licores', order: 9, type: 'bar' }
        ];

        for (const cat of categories) {
            await pool.query(
                "INSERT INTO menu_categories (id, menu_id, company_id, name, display_order, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
                [cat.id, menuId, companyId, cat.name, cat.order, JSON.stringify({ type: cat.type })]
            );
        }
        console.log(`✅ ${categories.length} categorías creadas.`);

        // 5. Modificadores (Salsas, Términos de carne, etc)
        const modifiers = [
            { id: uuidv4(), name: 'Término Medio', price: 0 },
            { id: uuidv4(), name: 'Término 3/4', price: 0 },
            { id: uuidv4(), name: 'Bien Cocido', price: 0 },
            { id: uuidv4(), name: 'Extra Ají', price: 0.50 },
            { id: uuidv4(), name: 'Con Queso Extra', price: 2.00 },
            { id: uuidv4(), name: 'Para llevar', price: 0.50 },
            { id: uuidv4(), name: 'Salsa Chimichurri', price: 1.00 },
            { id: uuidv4(), name: 'Salsa Rosada', price: 0.50 },
            { id: uuidv4(), name: 'Picante Nivel Latino', price: 0 }
        ];

        for (const mod of modifiers) {
            await pool.query(
                "INSERT INTO modifiers (id, company_id, name, price_delta, active) VALUES ($1, $2, $3, $4, true)",
                [mod.id, companyId, mod.name, mod.price]
            );
        }
        console.log(`✅ ${modifiers.length} modificadores generales creados.`);

        // 6. Platos y Bebidas (~50 items)
        const items = [
            // Entradas
            { catNum: 0, name: 'Empanadas Colombianas (3)', desc: 'Carne y papa con ají casero', price: 7.50 },
            { catNum: 0, name: 'Tostones con Guacamole', desc: 'Plátano verde frito con guacamole fresco', price: 9.95 },
            { catNum: 0, name: 'Arepa con Queso', desc: 'Arepa de maíz blanco asada con queso derretido', price: 6.50 },
            { catNum: 0, name: 'Chicharrón con Arepa', desc: 'Tocino de cerdo crocante con arepitas', price: 11.00 },
            { catNum: 0, name: 'Ceviche de Camarón', desc: 'Estilo costeño con cebolla morada y cilantro', price: 14.50 },
            { catNum: 0, name: 'Maduros con Queso', desc: 'Plátano maduro frito con queso y crema', price: 7.95 },

            // Platos Fuertes
            { catNum: 1, name: 'Bandeja Paisa Tradicional', desc: 'Carne, chicharrón, huevo, arroz, frijol, arepa y aguacate', price: 22.50 },
            { catNum: 1, name: 'Lomo Saltado Queens', desc: 'Trazos de lomo, cebolla, tomate y papas fritas sobre arroz', price: 19.95 },
            { catNum: 1, name: 'Arroz con Pollo Abuela', desc: 'Servido con ensalada rusa y maduros', price: 16.50 },
            { catNum: 1, name: 'Pabellón Criollo', desc: 'Carne mechada, arroz, frijoles negros y tajadas', price: 18.00 },
            { catNum: 1, name: 'Overnight Steak & Eggs', desc: 'Favorito de NYC: Churrasco con huevos y papas', price: 24.50 },
            { catNum: 1, name: 'Entraña a la Parrilla', desc: 'Corte premium de 12oz con chimichurri', price: 28.00 },
            { catNum: 1, name: 'Pechuga Gratinada', desc: 'Pollo en salsa de champiñones y queso mozarella', price: 17.50 },

            // Dominican & PR
            { catNum: 2, name: 'Mofongo de Chicharrón', desc: 'Plátano machacado con ajo y cerdo, con caldo aparte', price: 18.95 },
            { catNum: 2, name: 'Sancocho de 7 Carnes', desc: 'Estilo Dominicano con víveres y arroz blanco', price: 19.50 },
            { catNum: 2, name: 'La Bandera Dominicana', desc: 'Arroz, habichuela, pollo guisado y fritos verdes', price: 15.00 },
            { catNum: 2, name: 'Chivo Liniero', desc: 'Chivo guisado picantico con yuca al mojo', price: 21.00 },
            { catNum: 2, name: 'Mofongo de Camarones', desc: 'En salsa criolla de ajo y tomate', price: 23.50 },
            { catNum: 2, name: 'Pernil Horneado', desc: 'Cerdo asado lentamente, piel crocante', price: 17.00 },

            // Mariscos
            { catNum: 3, name: 'Pargo Rojo Frito', desc: 'Pescado entero con arroz con coco y patacones', price: 26.00 },
            { catNum: 3, name: 'Cazuela de Mariscos', desc: 'Mixtura en salsa cremosa de coco', price: 25.00 },
            { catNum: 3, name: 'Arroz Marinero', desc: 'Arroz con camarón, pulpo, calamar y almejas', price: 22.00 },
            { catNum: 3, name: 'Filete de Basa al Ajillo', desc: 'Suave filete blanco en abundante ajo', price: 18.50 },
            { catNum: 3, name: 'Camarones al Tequila', desc: 'Salteados con un toque de tequila y chile', price: 20.95 },

            // Sopas
            { catNum: 4, name: 'Ajiaco Santafereño', desc: 'Sopa de tres papas, pollo, guascas, crema y alcaparras', price: 18.00 },
            { catNum: 4, name: 'Mondongo Paisa', desc: 'Sopa de callo con cerdo, chorizo y papa', price: 16.50 },
            { catNum: 4, name: 'Sopa de Lentejas', desc: 'Con chorizo y calabaza', price: 12.00 },
            { catNum: 4, name: 'Consomé de Menudencias', desc: 'Sopa ligera con arroz y cilantro', price: 10.00 },
            { catNum: 4, name: 'Asopado de Mariscos', desc: 'Arroz caldoso con lo mejor del mar', price: 24.00 },

            // Sides
            { catNum: 5, name: 'Arroz con Coco', desc: 'Dulce y saladito', price: 5.50 },
            { catNum: 5, name: 'Frijoles Rojos', desc: 'Guisados con plátano y zanahoria', price: 4.50 },
            { catNum: 5, name: 'Yucca al Mojo', desc: 'Hervida con ajo y cebolla', price: 6.00 },
            { catNum: 5, name: 'Ensalada de Aguacate', desc: 'Rodajas frescas con vinagreta', price: 7.00 },
            { catNum: 5, name: 'Papas Chorreadas', desc: 'Con salsa de queso y cebolla', price: 6.50 },
            { catNum: 5, name: 'Vegetales Salteados', desc: 'Mix de temporada al wok', price: 5.00 },

            // Postres
            { catNum: 6, name: 'Tres Leches de Maracuyá', desc: 'Versión cítrica del postre clásico', price: 8.50 },
            { catNum: 6, name: 'Flan de Queso y Caramelo', desc: 'Muy cremoso, receta tradicional', price: 6.95 },
            { catNum: 6, name: 'Arroz con Leche', desc: 'Con canela y pasas', price: 5.50 },
            { catNum: 6, name: 'Churros con Dulce de Leche', desc: '6 churros calientes azucarados', price: 9.00 },
            { catNum: 6, name: 'Brevas con Arequipe', desc: 'Higos en almíbar con manjar blanco', price: 7.50 },

            // Bebidas
            { catNum: 7, name: 'Jugo de Maracuyá', desc: 'En agua o leche', price: 4.50 },
            { catNum: 7, name: 'Jugo de Lulo', desc: 'Fruta exótica colombiana', price: 4.50 },
            { catNum: 7, name: 'Limonada de Coco', desc: 'Frapé refrescante', price: 6.00 },
            { catNum: 7, name: 'Soda Colombiana', desc: '330ml lata', price: 3.00 },
            { catNum: 7, name: 'Batido de Papaya', desc: 'Muy cremoso con leche entera', price: 6.50 },
            { catNum: 7, name: 'Aguapanela con Limón', desc: 'Caliente o fría', price: 3.50 },
            { catNum: 7, name: 'Café de Colombia', desc: 'Tinto o con leche', price: 3.00 },

            // Cocteles
            { catNum: 8, name: 'Mojito de Guayaba', desc: 'Ron blanco, menta y guayaba real', price: 12.00 },
            { catNum: 8, name: 'Margarita de Jalapeño', desc: 'Picante y refrescante', price: 13.00 },
            { catNum: 8, name: 'Caipirinha de Maracuyá', desc: 'Cachaça brasileña y fruta', price: 12.50 },
            { catNum: 8, name: 'Shot de Aguardiente', desc: 'Antioqueño (Tapa Azul)', price: 7.00 },
            { catNum: 8, name: 'Cerveza Aguila/Corona', desc: 'Botella importada', price: 6.00 },
            { catNum: 8, name: 'Sangría Tinta (Jarra)', desc: 'Vino tinto y frutas frescas', price: 35.00 }
        ];

        for (const item of items) {
            const categoryId = categories[item.catNum].id;
            const itemId = uuidv4();

            await pool.query(
                `INSERT INTO menu_items (id, company_id, category_id, name, description, price, base_price, available, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $6, true, 0)`,
                [itemId, companyId, categoryId, item.name, item.desc, item.price]
            );

            // Asociar modificadores a los platos fuertes (ejemplo de relación)
            if (item.catNum === 1 || item.catNum === 2) {
                // Añadir términos de carne a platos con carne
                if (item.name.toLowerCase().includes('steak') || item.name.toLowerCase().includes('entraña')) {
                    for (let i = 0; i < 3; i++) { // Los 3 términos
                        await pool.query("INSERT INTO product_modifiers (id, company_id, product_id, modifier_id) VALUES ($1,$2,$3,$4)",
                            [uuidv4(), companyId, itemId, modifiers[i].id]);
                    }
                }
                // Añadir picante a todo
                await pool.query("INSERT INTO product_modifiers (id, company_id, product_id, modifier_id) VALUES ($1,$2,$3,$4)",
                    [uuidv4(), companyId, itemId, modifiers[8].id]);
            }
        }

        console.log(`✅ ${items.length} items de menú creados con éxito.`);

        // 7. Ingredientes base para costeo
        const ingredientData = [
            { name: 'Arroz Blanco', unit: 'lb', cost: 0.65 },
            { name: 'Frijol Rojo', unit: 'lb', cost: 1.10 },
            { name: 'Aceite Vegetal', unit: 'gal', cost: 12.00 },
            { name: 'Sal Refinada', unit: 'lb', cost: 0.30 },
            { name: 'Azúcar Blanca', unit: 'lb', cost: 0.80 },
            { name: 'Cebolla Larga', unit: 'lb', cost: 1.50 },
            { name: 'Tomate Milano', unit: 'lb', cost: 1.20 },
            { name: 'Cilantro', unit: 'lb', cost: 2.50 },
            { name: 'Carne de Res (Churrasco)', unit: 'lb', cost: 7.50 },
            { name: 'Tocino de Cerdo', unit: 'lb', cost: 4.80 },
            { name: 'Pollo (Pechuga)', unit: 'lb', cost: 3.20 },
            { name: 'Camarón (31/40)', unit: 'lb', cost: 8.50 },
            { name: 'Huevo AA', unit: 'unidad', cost: 0.15 },
            { name: 'Plátano Verde (Macho)', unit: 'unidad', cost: 0.45 },
            { name: 'Plátano Maduro', unit: 'unidad', cost: 0.50 },
            { name: 'Yuca Fresca', unit: 'lb', cost: 0.90 },
            { name: 'Aguacate Hass', unit: 'lb', cost: 2.10 },
            { name: 'Leche Entera', unit: 'gal', cost: 4.20 },
            { name: 'Queso Campesino', unit: 'lb', cost: 4.50 },
            { name: 'Maracuyá (Pulpa)', unit: 'kg', cost: 3.80 }
        ];

        for (const ing of ingredientData) {
            await pool.query(
                "INSERT INTO inventory_items (id, company_id, restaurant_id, name, unit, cost_per_unit, active) VALUES ($1, $2, $3, $4, $5, $6, true)",
                [uuidv4(), companyId, restaurantId, ing.name, ing.unit, ing.cost]
            );
        }
        console.log(`✅ ${ingredientData.length} ingredientes básicos para inventario creados.`);

        console.log('\n🎉 Seed Latino NYC completado!');
        console.log('\nResumen:');
        console.log(`- Compañía: Default (${companyId})`);
        console.log(`- Restaurante ID: ${restaurantId}`);
        console.log(`- Menú: Latino NYC`);
        console.log(`- Items: ${items.length}`);
        console.log(`- Categorías: ${categories.length}`);

    } catch (error: any) {
        console.error('❌ Error en seed:', error);
    } finally {
        await pool.end();
    }
}

run();
