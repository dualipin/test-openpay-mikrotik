# 🌐 MikroTik Internet Sales - OpenPay Integration

Sistema automático para vender acceso a internet por tiempo, integrando pagos con OpenPay y control de usuarios en MikroTik RouterOS Hotspot.

```
test-openpay-mikrotik
├─ apps
│  ├─ admin
│  │  ├─ eslint.config.js
│  │  ├─ index.html
│  │  ├─ package.json
│  │  ├─ public
│  │  │  ├─ favicon.svg
│  │  │  └─ icons.svg
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ App.css
│  │  │  ├─ App.tsx
│  │  │  ├─ assets
│  │  │  │  ├─ hero.png
│  │  │  │  ├─ react.svg
│  │  │  │  └─ vite.svg
│  │  │  ├─ index.css
│  │  │  └─ main.tsx
│  │  ├─ tsconfig.app.json
│  │  ├─ tsconfig.json
│  │  ├─ tsconfig.node.json
│  │  └─ vite.config.ts
│  ├─ api
│  │  ├─ .env
│  │  ├─ .prettierrc
│  │  ├─ eslint.config.mjs
│  │  ├─ generated
│  │  │  └─ prisma
│  │  │     ├─ browser.ts
│  │  │     ├─ client.ts
│  │  │     ├─ commonInputTypes.ts
│  │  │     ├─ enums.ts
│  │  │     ├─ internal
│  │  │     │  ├─ class.ts
│  │  │     │  ├─ prismaNamespace.ts
│  │  │     │  └─ prismaNamespaceBrowser.ts
│  │  │     ├─ models
│  │  │     │  ├─ Hotspot.ts
│  │  │     │  ├─ NetworkAccess.ts
│  │  │     │  ├─ Order.ts
│  │  │     │  ├─ Payment.ts
│  │  │     │  ├─ Plan.ts
│  │  │     │  ├─ Profile.ts
│  │  │     │  ├─ Router.ts
│  │  │     │  ├─ Service.ts
│  │  │     │  ├─ Tenant.ts
│  │  │     │  └─ User.ts
│  │  │     └─ models.ts
│  │  ├─ nest-cli.json
│  │  ├─ package.json
│  │  ├─ prisma
│  │  │  ├─ migrations
│  │  │  │  ├─ 20260608053530_initial
│  │  │  │  │  └─ migration.sql
│  │  │  │  └─ migration_lock.toml
│  │  │  └─ schema.prisma
│  │  ├─ prisma.config.ts
│  │  ├─ README.md
│  │  ├─ src
│  │  │  ├─ app.controller.ts
│  │  │  ├─ app.module.ts
│  │  │  ├─ app.service.ts
│  │  │  ├─ main.ts
│  │  │  ├─ payments
│  │  │  │  ├─ interfaces
│  │  │  │  │  └─ payment-processor.interface.ts
│  │  │  │  ├─ payments.controller.ts
│  │  │  │  ├─ payments.module.ts
│  │  │  │  └─ services
│  │  │  │     ├─ openpay.service.ts
│  │  │  │     └─ stripe.service.ts
│  │  │  └─ prisma
│  │  │     ├─ prisma.module.ts
│  │  │     └─ prisma.service.ts
│  │  ├─ test
│  │  │  ├─ app.e2e-spec.ts
│  │  │  └─ jest-e2e.json
│  │  ├─ tsconfig.build.json
│  │  └─ tsconfig.json
│  └─ payment-portal
│     ├─ .env
│     ├─ .env.example
│     ├─ eslint.config.js
│     ├─ index.html
│     ├─ package.json
│     ├─ public
│     │  ├─ favicon.svg
│     │  └─ icons.svg
│     ├─ README.md
│     ├─ src
│     │  ├─ App.tsx
│     │  ├─ assets
│     │  ├─ components
│     │  │  ├─ checkout
│     │  │  │  ├─ CheckoutLayout.tsx
│     │  │  │  ├─ CheckoutSteps.tsx
│     │  │  │  ├─ OrderSummary.tsx
│     │  │  │  ├─ steps
│     │  │  │  │  ├─ CustomerStep.tsx
│     │  │  │  │  ├─ PaymentStep.tsx
│     │  │  │  │  └─ ProductStep.tsx
│     │  │  │  └─ types.ts
│     │  │  └─ PayForm.tsx
│     │  ├─ hooks
│     │  │  └─ useCheckout.ts
│     │  ├─ index.css
│     │  ├─ main.tsx
│     │  └─ types
│     │     └─ openpay.d.ts
│     ├─ tsconfig.app.json
│     ├─ tsconfig.json
│     ├─ tsconfig.node.json
│     └─ vite.config.ts
├─ package-lock.json
├─ package.json
├─ packages
│  ├─ shared-config
│  └─ shared-utils
├─ README.md
├─ tsconfig.base.json
└─ turbo.json

```