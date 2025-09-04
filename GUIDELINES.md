/\*\*

# Frontend App Structure & Conventions

This structure is for a React/TypeScript app with **routes, features, components, hooks, providers, utils, types, enums, constants, and styles**.

It includes **rules** for local vs global, naming, and folder organization.

---

## Rules & Conventions

1. **Routes**

   - Each route is a **folder** under `src/app/routes/`.
   - The folder contains:
     - `PageName.tsx` → main page component.
     - `types.ts` → page-specific types.
     - `enums.ts` → page-specific enums.
     - `utils.ts` → page-specific utilities.
     - `constants.ts` → page-specific constants.
     - `hooks/` → page-specific hooks (`useSomeHook.ts` + `index.ts`).
     - `style.css` → optional local styles for the page.
     - `index.ts` → re-exports everything.
   - **Rule**: Keep pages thin; most logic should be in features or hooks.

2. **Features**

   - Flat structure: `src/features/FeatureName/`.
   - Each feature folder contains:
     - `FeatureName.tsx` → main feature component.
     - `types.ts`, `enums.ts`, `utils.ts`, `constants.ts` → local feature types/utilities.
     - `components/` → feature-specific components (each with `ComponentName.tsx`, optional `types.ts`, `style.css`, and `index.ts`).
     - `hooks/` → feature-specific hooks (`useSomeHook.ts` + `index.ts`).
     - `style.css` → optional feature-level styles.
     - `index.ts` → re-export feature and subfolders.
   - **Rule**: Features are reusable and self-contained; can appear on multiple pages.

3. **Components**

   - Shared UI components go under `src/components/`.
   - Each component has its **own folder**:
     - `ComponentName.tsx`
     - Optional `types.ts` for props.
     - Optional `enums.ts`, `utils.ts`, `constants.ts` if needed.
     - Optional `style.css` for component-specific styles.
     - `index.ts` → re-export component.
   - **Rule**: Keep shared UI generic; avoid feature-specific logic.

4. **Hooks**

   - Local hooks live in `hooks/` inside their route/feature/component folder.
   - Global hooks live in `src/hooks/HookName/`:
     - `useHookName.ts`
     - `index.ts` → re-export hook.
   - **Rule**: Use `use` prefix for hook names. Keep hooks focused and reusable.

5. **Providers**

   - Global providers live in `src/providers/ProviderName/`.
   - Each provider folder contains:
     - `ProviderName.tsx` → provider component.
     - Optional `context.ts` → context creation (can skip in modern React).
     - `hooks/` → provider-specific hooks (`useProviderHook.ts` + `index.ts`).
     - `index.ts` → re-export provider and hooks.
   - **Rule**: Providers manage state or context; wrap app in `App.tsx`.

6. **Utils**

   - Local utils live in feature/route/component folder as `utils.ts`.
   - Global utils live in `src/utils/` and are shared across the app.
   - **Rule**: Keep utilities pure and reusable.

7. **Types**

   - Local types: `types.ts` in feature/route/component folder.
   - Global types: `src/types/`.
   - **Rule**: Use TypeScript interfaces/types consistently; prefer local scope unless shared.

8. **Enums**

   - Same rule as types.
   - Local enums in folder; global enums in `src/enums/`.

9. **Constants**

   - Local constants: `constants.ts` in folder.
   - Global constants: `src/constants/`.
   - **Rule**: Use constants for configs, routes, or fixed values.

10. **Styles**
    - Each route, feature, and component **can have its own `style.css`**.
    - Global styles go in `src/styles/globals.css`.
    - **Rule**: Keep styles scoped to folder unless truly global.

---

## Folder Structure

src/
├── app/
│ ├── routes/
│ │ ├── home/
│ │ │ ├── HomePage.tsx
│ │ │ ├── types.ts
│ │ │ ├── enums.ts
│ │ │ ├── utils.ts
│ │ │ ├── constants.ts
│ │ │ ├── hooks/
│ │ │ │ ├── useHomePageLogic.ts
│ │ │ │ └── index.ts
│ │ │ ├── style.css
│ │ │ └── index.ts
│ │ ├── profile/
│ │ │ ├── ProfilePage.tsx
│ │ │ ├── style.css
│ │ │ └── index.ts
│ │ └── settings/
│ │ ├── SettingsPage.tsx
│ │ ├── style.css
│ │ └── index.ts
│ ├── App.tsx
│ └── index.tsx

├── features/
│ ├── HomeFeature/
│ │ ├── HomeFeature.tsx
│ │ ├── types.ts
│ │ ├── enums.ts
│ │ ├── utils.ts
│ │ ├── constants.ts
│ │ ├── components/
│ │ │ ├── WelcomeBanner.tsx
│ │ │ ├── types.ts
│ │ │ ├── style.css
│ │ │ └── index.ts
│ │ ├── hooks/
│ │ │ ├── useGreeting.ts
│ │ │ └── index.ts
│ │ ├── style.css
│ │ └── index.ts
│ ├── ProfileFeature/
│ │ ├── ProfileFeature.tsx
│ │ ├── hooks/
│ │ │ ├── useProfileData.ts
│ │ │ └── index.ts
│ │ ├── style.css
│ │ └── index.ts
│ └── SettingsFeature/
│ ├── SettingsFeature.tsx
│ ├── hooks/
│ │ ├── useTheme.ts
│ │ └── index.ts
│ ├── style.css
│ └── index.ts

├── components/
│ ├── Button/
│ │ ├── Button.tsx
│ │ ├── types.ts
│ │ ├── enums.ts
│ │ ├── utils.ts
│ │ ├── constants.ts
│ │ ├── style.css
│ │ └── index.ts
│ └── Layout/
│ ├── Layout.tsx
│ ├── style.css
│ └── index.ts

├── hooks/
│ ├── useAuth/
│ │ ├── useAuth.ts
│ │ └── index.ts
│ └── useMediaQuery/
│ ├── useMediaQuery.ts
│ └── index.ts

├── providers/
│ ├── AuthProvider/
│ │ ├── AuthProvider.tsx
│ │ ├── context.ts
│ │ ├── hooks/
│ │ │ ├── useAuthProvider.ts
│ │ │ └── index.ts
│ │ └── index.ts
│ └── ThemeProvider/
│ ├── ThemeProvider.tsx
│ ├── context.ts
│ ├── hooks/
│ │ ├── useThemeProvider.ts
│ │ └── index.ts
│ └── index.ts

├── utils/
│ ├── formatDate.ts
│ ├── storage.ts
│ └── index.ts

├── types/
│ ├── api.ts
│ ├── auth.ts
│ └── index.ts

├── enums/
│ ├── roles.ts
│ ├── status.ts
│ └── index.ts

├── constants/
│ ├── routes.ts
│ ├── api.ts
│ └── index.ts

└── styles/
└── globals.css
