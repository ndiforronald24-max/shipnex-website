# Feature Modules

This folder contains feature-specific modules that group related pages, components, and logic.

## Structure

Each feature folder follows this pattern:
```
features/
  shipments/       — Shipment management feature
    components/    — Shipment-specific components
    hooks/         — Shipment-specific hooks
  pets/            — Pet shipment feature
    components/
    hooks/
  tracking/        — Tracking feature
    components/
    hooks/
  admin/           — Admin dashboard feature
    components/
    hooks/
```

> Feature modules are extracted here as the application grows beyond simple pages. For now, shared components live in `src/components/` and pages in `src/pages/`.
