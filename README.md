# shadcn/ui monorepo template

This template is for creating a monorepo with shadcn/ui.

## Usage

```bash
pnpm dlx shadcn@latest init
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `apps/web/components/ui` directory.

## Tailwind

Your `globals.css` is already set up to use the components in the `web` app.

## Using components

To use the components in your app, import them from the local `web` aliases.

```tsx
import { Button } from "@/components/ui/button";
```
