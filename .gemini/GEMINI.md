# aNivel Frontend — Guía de Arquitectura, Dominio y Estándares de Ingeniería

Este documento es la referencia técnica oficial del frontend de **aNivel**. Define la arquitectura, reglas de negocio, estándares de código y directrices para que cualquier desarrollador o agente AI comprenda, mantenga y expanda la aplicación de forma rápida y consistente.

---

## 1. Stack Tecnológico & Convenciones Clave

- **Framework:** Angular 21.2+ (Standalone Components exclusivamente).
- **Estilos:** Tailwind CSS v4 + `@theme` y variables CSS semánticas.
- **Lenguaje:** TypeScript 5.9+ (Tipado estricto, **cero uso de `any`**).
- **Gestión de Estado:** Angular Signals (`signal()`, `computed()`, `input()`, `output()`, `toSignal()`).
- **Detección de Cambios:** `ChangeDetectionStrategy.OnPush` **obligatorio en el 100% de los componentes**.
- **Testing:** Angular Unit Test Runner + Vitest (`ng test --watch=false`).

---

## 2. Mapa Rápido del Repositorio

```
aNivel_frontend/src/app/
├── core/
│   ├── interceptors/        # httpErrorInterceptor (captura centralizada de errores DRF)
│   ├── models/              # Interfaces TypeScript estrictas (Project, MaterialBudget, etc.)
│   ├── services/            # Servicios HTTP con Signals de sólo lectura (asReadonly)
│   └── utils/               # error.utils.ts (parser de errores de red y serializers DRF)
├── layout/
│   ├── header/              # Barra superior con breadcrumbs reactivos derivados (toSignal + computed)
│   └── sidebar/             # Navegación lateral con inputs/outputs reactivos
├── shared/
│   ├── components/          # modal, confirm-dialog, empty-state, toast-container (A11y + OnPush)
│   └── pipes/               # appCurrency ($1.500.000,00), appPercent (10%), appWeight (2.500,0 kg)
└── features/
    ├── dashboard/           # Métricas ejecutivas y accesos directos
    ├── projects/            # Listado de obras y vista detallada de presupuesto (project-detail)
    ├── catalog/             # Catálogo maestro global de materiales
    ├── categories/          # Gestor maestro de categorías y subcategorías
    └── units/               # Unidades de medida de obra y compra comercial
```

---

## 3. Reglas de Dominio y Fórmulas de Presupuesto

### 3.1. Equivalencias y Tipos de Ítems
- **Ítem Normal de Catálogo:** Cómputo métrico en obra $\to$ Cálculo automático de compra con redondeo hacia arriba.
- **Ítem Global (Paquete):** Compra en lote preventiva directa por cantidad y precio unitario pactado (`quantity_obra = null`, `waste_pct = 0`).
- **Ítem Personalizado (Ad-hoc):** Creado directamente dentro de la obra sin requerir registro previo en el catálogo maestro.

### 3.2. Fórmulas Matemáticas en Tiempo Real
1. **Cantidad Neta con Merma:**
   $$\text{Cantidad Neta} = \text{quantity\_obra} \times \left(1 + \frac{\text{waste\_pct}}{100}\right)$$
2. **Compra Requerida (Regla Ceil Obligatoria):**
   $$\text{quantity\_purchase} = \left\lceil \frac{\text{Cantidad Neta}}{\text{conversion\_factor}} \right\rceil$$
3. **Costo Estimado:**
   $$\text{Costo} = \text{quantity\_purchase} \times \text{price\_per\_purchase\_unit}$$
4. **Peso Total Acumulado:**
   $$\text{Peso Total (kg)} = \text{quantity\_purchase} \times \text{weight\_per\_purchase\_unit}$$

---

## 4. Estándares Obligatorios de Código (No Negociables)

### 4.1. Componentes y Change Detection
- Todo componente debe declarar:
  ```typescript
  @Component({
    selector: 'app-ejemplo',
    standalone: true,
    imports: [...],
    templateUrl: './ejemplo.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
  })
  export class EjemploComponent {}
  ```
- **Inputs & Outputs:** Usar exclusivamente `input()`, `input.required()` y `output<T>()`. Prohibido `@Input()` o `@Output()`.

### 4.2. Servicios HTTP y Manejo de Errores
- **Centralización en Interceptor:** Las llamadas HTTP **no deben duplicar** `toast.error()` en los servicios. El interceptor `httpErrorInterceptor` captura automáticamente cualquier error (400, 404, 500, status 0) y muestra la alerta con `extractHttpErrorMessage()`.
- **Omitir toast en llamadas específicas:** Usar `new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true)`.
- **Loading State:** Manejar la finalización del indicador de carga con `finalize(() => this._loading.set(false))`.

### 4.3. Reactividad Limpia con Signals y Effects
- Prohibido mutar señales dentro de `effect()` sin `untracked()`, o usarlos para sincronizar estados que pueden resolverse con `computed()` o inicialización explícita en acciones de usuario.

### 4.4. Plantillas y Formateo
- Usar Pipes Standalone (`appCurrency`, `appPercent`, `appWeight`). Prohibido invocar `.toLocaleString()` dentro del HTML o TypeScript de las vistas.
- Utilizar el control de flujo nativo de Angular (`@if`, `@for`, `@let`, `@switch`).

---

## 5. Comandos de Verificación Rápida

```bash
# Compilar bundle de producción (verificar tipos y plantillas)
npm run build

# Ejecutar suite de pruebas unitarias (Vitest)
npm test

# Servidor de desarrollo local
npm start
```
