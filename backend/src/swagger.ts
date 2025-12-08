/**
 * OpenAPI/Swagger Specification for Sistema POS Backend
 * Defines all API endpoints, request/response schemas, and security requirements
 */

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema POS - REST API',
    description: 'Complete Point of Sale system with multi-provider payment processing, order management, menu management, and JWT authentication',
    version: '1.0.0',
    contact: {
      name: 'API Support',
      email: 'support@sistemaapos.com'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    },
    {
      url: 'https://api.sistemaapos.com',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User login, registration, and token management' },
    { name: 'Orders', description: 'Order creation, management, and status tracking' },
    { name: 'Menus', description: 'Menu items, categories, and restaurant management' },
    { name: 'Payments', description: 'Payment processing with multiple providers' },
    { name: 'Webhooks', description: 'Payment provider webhooks for transaction updates' },
    { name: 'Health', description: 'System health and status checks' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/v1/auth/login'
      }
    },
    schemas: {
      // Authentication schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'waiter@testrestaurant.com' },
          password: { type: 'string', format: 'password', example: 'password_waiter' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'manager', 'waiter', 'cashier'] },
              restaurantId: { type: 'string', format: 'uuid' }
            }
          }
        }
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'name', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'manager', 'waiter', 'cashier'] },
          restaurantId: { type: 'string', format: 'uuid' }
        }
      },

      // Order schemas
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          restaurantId: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string', example: 'ORD-001' },
          tableId: { type: 'string', format: 'uuid' },
          waiterId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
          subtotal: { type: 'number', example: 100.00 },
          tax: { type: 'number', example: 10.00 },
          discount: { type: 'number', example: 0 },
          tip: { type: 'number', example: 0 },
          total: { type: 'number', example: 110.00 },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                menuItemId: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'integer' },
                description: { type: 'string' }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateOrderRequest: {
        type: 'object',
        required: ['restaurantId', 'tableId', 'waiterId'],
        properties: {
          restaurantId: { type: 'string', format: 'uuid' },
          tableId: { type: 'string', format: 'uuid' },
          waiterId: { type: 'string', format: 'uuid' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['menuItemId', 'quantity'],
              properties: {
                menuItemId: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer', minimum: 1 }
              }
            }
          }
        }
      },
      UpdateOrderRequest: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'completed', 'cancelled'] },
          discount: { type: 'number', minimum: 0 },
          tip: { type: 'number', minimum: 0 }
        }
      },
      AddOrderItemRequest: {
        type: 'object',
        required: ['menuItemId', 'quantity'],
        properties: {
          menuItemId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1 }
        }
      },

      // Menu schemas
      Menu: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          restaurantId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                displayOrder: { type: 'integer' }
              }
            }
          },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      MenuItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          menuId: { type: 'string', format: 'uuid' },
          categoryId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', example: 25.99 },
          available: { type: 'boolean' },
          displayOrder: { type: 'integer' },
          metadata: { type: 'object' }
        }
      },
      CreateMenuItemRequest: {
        type: 'object',
        required: ['menuId', 'categoryId', 'name', 'price'],
        properties: {
          menuId: { type: 'string', format: 'uuid' },
          categoryId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          available: { type: 'boolean', default: true },
          displayOrder: { type: 'integer' },
          metadata: { type: 'object' }
        }
      },
      UpdateMenuItemRequest: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          available: { type: 'boolean' },
          displayOrder: { type: 'integer' },
          metadata: { type: 'object' }
        }
      },

      // Payment schemas
      ProcessPaymentRequest: {
        type: 'object',
        required: ['orderId', 'provider', 'amount', 'currency'],
        properties: {
          orderId: { type: 'string', format: 'uuid' },
          provider: { type: 'string', enum: ['stripe', 'square', 'mercado_pago', 'paypal'] },
          amount: { type: 'number', example: 110.00 },
          currency: { type: 'string', example: 'USD' },
          token: { type: 'string', description: 'Payment method token/nonce' },
          metadata: { type: 'object' }
        }
      },
      PaymentResponse: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          transactionId: { type: 'string' },
          orderId: { type: 'string', format: 'uuid' },
          provider: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'succeeded', 'failed', 'refunded'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },

      // Error response
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Check if the API is running',
        tags: ['Health'],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    ts: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Authentication endpoints
    '/api/v1/auth/login': {
      post: {
        summary: 'User login',
        description: 'Authenticate user with email and password. Returns JWT token.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '401': {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/register': {
      post: {
        summary: 'Register new user',
        description: 'Create a new user account (admin-only)',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          '400': {
            description: 'Invalid request or user already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/verify': {
      post: {
        summary: 'Verify JWT token',
        description: 'Verify the validity of a JWT token',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Token is valid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    valid: { type: 'boolean' },
                    user: { type: 'object' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Token is invalid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/auth/logout': {
      post: {
        summary: 'User logout',
        description: 'Invalidate the current session',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Logout successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Orders endpoints
    '/api/v1/orders': {
      post: {
        summary: 'Create order',
        description: 'Create a new order with optional items',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' }
              }
            }
          },
          '400': {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      get: {
        summary: 'List orders',
        description: 'Get all orders with optional filtering',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'restaurantId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'completed', 'cancelled'] }
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 }
          },
          {
            name: 'offset',
            in: 'query',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'Orders list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/orders/{orderId}': {
      get: {
        summary: 'Get order details',
        description: 'Get a specific order with all items',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Order details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' }
              }
            }
          },
          '404': {
            description: 'Order not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        summary: 'Update order',
        description: 'Update order status, discount, or tip',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrderRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Order updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Cancel order',
        description: 'Cancel an order (only if not paid)',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Order cancelled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/orders/{orderId}/items': {
      post: {
        summary: 'Add item to order',
        description: 'Add a menu item to an existing order and recalculate totals',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'orderId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddOrderItemRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Item added to order',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' }
              }
            }
          }
        }
      }
    },

    // Menus endpoints
    '/api/v1/menus/{restaurantId}': {
      get: {
        summary: 'List restaurant menus',
        description: 'Get all menus for a restaurant',
        tags: ['Menus'],
        parameters: [
          {
            name: 'restaurantId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Menus list',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Menu' }
                }
              }
            }
          }
        }
      }
    },
    '/api/v1/menus/{restaurantId}/{menuId}': {
      get: {
        summary: 'Get menu with items',
        description: 'Get a specific menu with all categories and items',
        tags: ['Menus'],
        parameters: [
          {
            name: 'restaurantId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'menuId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Menu with items',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Menu' }
              }
            }
          }
        }
      }
    },
    '/api/v1/menus': {
      post: {
        summary: 'Create menu item',
        description: 'Create a new menu item',
        tags: ['Menus'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateMenuItemRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Menu item created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' }
              }
            }
          }
        }
      }
    },
    '/api/v1/menus/{id}': {
      put: {
        summary: 'Update menu item',
        description: 'Update a menu item',
        tags: ['Menus'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMenuItemRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Menu item updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' }
              }
            }
          }
        }
      },
      delete: {
        summary: 'Delete menu item',
        description: 'Delete a menu item',
        tags: ['Menus'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Menu item deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // Payments endpoints
    '/api/v1/payments/process': {
      post: {
        summary: 'Process payment',
        description: 'Process payment through specified provider',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProcessPaymentRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Payment processed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentResponse' }
              }
            }
          },
          '400': {
            description: 'Payment failed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/payments/{paymentId}': {
      get: {
        summary: 'Get payment details',
        description: 'Get details of a specific payment',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'paymentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Payment details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentResponse' }
              }
            }
          }
        }
      }
    },
    '/api/v1/payments/{paymentId}/refund': {
      post: {
        summary: 'Refund payment',
        description: 'Request a refund for a payment',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'paymentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  reason: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Refund processed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaymentResponse' }
              }
            }
          }
        }
      }
    },

    // Webhooks endpoints
    '/api/v1/webhooks/stripe': {
      post: {
        summary: 'Stripe webhook',
        description: 'Webhook endpoint for Stripe payment events',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook received'
          }
        }
      }
    },
    '/api/v1/webhooks/square': {
      post: {
        summary: 'Square webhook',
        description: 'Webhook endpoint for Square payment events',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook received'
          }
        }
      }
    },
    '/api/v1/webhooks/mercado-pago': {
      post: {
        summary: 'Mercado Pago webhook',
        description: 'Webhook endpoint for Mercado Pago payment events',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook received'
          }
        }
      }
    },
    '/api/v1/webhooks/paypal': {
      post: {
        summary: 'PayPal webhook',
        description: 'Webhook endpoint for PayPal payment events',
        tags: ['Webhooks'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook received'
          }
        }
      }
    }
  }
};
