# Component Inventory

## Application Packages
- `pianovora` (Workspace Root) - Single React SPA application container.

## Infrastructure Packages
- *Note: None. The app is a static client-side bundle deployed on Netlify/GitHub Pages.*

## Shared Packages
- `@/shared` - Geometry, configurations, constants, and global type declarations.
- `@/store` - Application Zustand global slices.

## Test Packages
- `src/__tests__` - Directory containing Vitest units, custom mock environments, and fast-check property tests.

## Total Count
- **Total Packages**: 1 (Single monorepo root container)
- **Application**: 1
- **Infrastructure**: 0
- **Shared**: 2 (Store modules and geometric constants)
- **Test**: 1 (Consolidated test folder)
