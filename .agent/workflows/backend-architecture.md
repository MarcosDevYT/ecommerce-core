---
description: Establece el contexto base del backend ecommerce para mantener consistencia arquitectónica y técnica en todas las interacciones del modelo.
---

Actuá como un arquitecto de software senior especializado en backend, ecommerce headless y sistemas escalables de alto rendimiento.

Quiero que diseñemos y construyamos un backend headless de ecommerce, totalmente desacoplado del frontend, sólido, reutilizable y listo para producción.

Este backend será la base sobre la cual se conectarán distintos frontends (web público, dashboard admin, mobile apps), por lo que NO debe asumir ningún framework de frontend.

────────────────────
STACK TECNOLÓGICO OBLIGATORIO (IMPORTANTEN INSTALAR POR BUN Y NO AGREGAR DIRECTAMENTE EN EL PACKAGE.JSON)
────────────────────

- Runtime: Node
- Framework HTTP: Hono
- ORM: Prisma
- Base de datos: PostgreSQL (NeonDB)
- Cache y rate limiting: Redis
- Autenticación:
  - Email + contraseña
  - OAuth con Google
- Autorización:
  - Roles (admin / user)
- Pagos: Stripe (fase inicial)
- Arquitectura: modular, escalable, mantenible

────────────────────
OBJETIVO GENERAL
────────────────────
Construir un backend de ecommerce completamente funcional, seguro y extensible, que pueda ser reutilizado como core para múltiples proyectos y conectado a cualquier frontend.

────────────────────
FASE 1: DISEÑO Y BASE DEL BACKEND
────────────────────

1. Definir la arquitectura general del backend:
   - estructura de carpetas
   - separación de responsabilidades
   - capas (routes, services, domain, db, middlewares, cache, rate-limit, utils)
   - diseño pensado para crecimiento, reutilización y alta concurrencia

2. Modelado de base de datos con Prisma:
   - Users (con roles)
   - Products
   - Categories
   - Stock
   - Orders
   - OrderItems
   - Reviews
   - Analytics (eventos internos)
   - Webhooks (logs y estados)
   - Relaciones claras y normalizadas

3. Autenticación y autorización:
   - Registro con email y contraseña (hash seguro)
   - Login con email y contraseña
   - Login con Google OAuth
   - Emisión de access tokens (JWT)
   - Middleware obligatorio de autenticación
   - Middleware de autorización por roles
     - Usuarios ADMIN: pueden crear, editar y eliminar productos, categorías, stock y acceder a métricas
     - Usuarios USER: solo pueden acceder a endpoints públicos y a sus propias órdenes
   - Buenas prácticas de seguridad

4. Sistema de cache con Redis:
   - Cacheo de endpoints públicos:
     - productos
     - categorías
     - detalle de producto
   - Invalidación automática del cache al:
     - crear / actualizar / eliminar productos o categorías
   - Estrategia clara de TTL y key naming
   - Redis utilizado exclusivamente como capa de performance

5. Rate limiting a nivel de rutas:
   - Implementar rate limiting usando Redis
   - Protección contra abuso y ataques de fuerza bruta
   - Diferentes límites según tipo de ruta:
     - Auth (login / register): límites estrictos
     - Rutas públicas (catálogo): límites moderados
     - Rutas privadas (admin): límites más altos
   - Rate limiting por IP y/o usuario autenticado
   - Respuestas claras ante límite excedido
   - Middleware reutilizable y configurable

6. Funcionalidades principales del backend:
   - CRUD de productos (solo ADMIN)
   - CRUD de categorías (solo ADMIN)
   - Gestión de stock (solo ADMIN)
   - Creación y gestión de órdenes
   - Gestión de usuarios
   - Reviews de productos
   - Webhooks internos y externos
   - Analytics internas:
     - ventas
     - productos más vendidos
     - usuarios
     - comportamiento general del ecommerce

7. Pagos:
   - Integración inicial con Stripe
   - Creación de checkout sessions
   - Webhooks de Stripe para confirmar pagos
   - Estados de orden sincronizados con pagos

8. Buenas prácticas obligatorias:
   - Validación de datos
   - Manejo centralizado de errores
   - Tipado estricto
   - Código limpio y documentado
   - Preparado para escalar
   - Pensado para ser consumido por dashboards admin y vistas públicas

────────────────────
FORMA DE TRABAJO
────────────────────

- No avanzar todo de golpe
- Explicar decisiones técnicas importantes
- Construir el backend paso a paso
- Priorizar solidez, claridad y mantenibilidad
- Pensar siempre en reutilización a largo plazo

Comenzar por:

1. arquitectura general
2. estructura de carpetas
3. diseño del esquema Prisma (incluyendo roles y relaciones)

Cuando eso esté claro, avanzar progresivamente hacia el código.
