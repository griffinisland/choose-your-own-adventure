# Deployment Guide

This document covers deploying Adventure Builder to Netlify and how to avoid common build failures. See the main [README](../README.md#deployment) for basic Netlify setup.

## Netlify Setup Summary

- **Build command:** `npm run build`
- **Publish directory:** `.next` (or let `@netlify/plugin-nextjs` handle it)
- **Environment variable:** `NEXT_PUBLIC_INSTANT_APP_ID` (your InstantDB App ID)
- **Branch:** Deploy from `v2` (or your chosen branch) in Netlify site settings

---

## Before Pushing to GitHub / Deploying

1. **Run the build locally**  
   ```bash
   npm run build
   ```  
   Fix any TypeScript or prerender errors before pushing. Netlify runs the same command.

2. **Ensure environment variable is set in Netlify**  
   In Netlify: **Site settings → Environment variables** add `NEXT_PUBLIC_INSTANT_APP_ID` with your InstantDB App ID. Redeploy after adding or changing it.

---

## Fixes to Keep (Avoid Failed Deployments)

These choices are in place to prevent known Netlify/build failures. **Do not revert them** without a good reason and testing the build.

### 1. Layout client components (prerender / “Element type is invalid”)

**File:** `app/layout-client.tsx`

**What we do:** Load **TopNav**, **MaterialIconsLoader**, and **InstantDBAuthInit** with `next/dynamic` and **`ssr: false`** instead of normal imports.

**Why:** During static prerender, one of these (or their dependencies) can resolve incorrectly or use browser-only APIs, causing:  
`Element type is invalid: expected a string or a class/function but got...`  
and failing `/`, `/login`, and `/_not-found`. Loading them only on the client avoids that.

**If you change it:** Switch back to direct imports only after confirming `npm run build` completes and static page generation no longer throws the invalid-element error.

### 2. InstantDB and Next.js server bundling

**File:** `next.config.js`

**What we do:**  
```js
experimental: {
  serverComponentsExternalPackages: ['@instantdb/react'],
},
```

**Why:** Stops Next.js from bundling `@instantdb/react` into server vendor chunks in a way that can cause “Cannot find module './vendor-chunks/@instantdb.js'” or similar errors during the build.

### 3. TypeScript / React Flow type collisions

**File:** `components/editor/FlowCanvas.tsx` (and any file mixing DOM and React Flow)

**What we do:** When calling DOM APIs that expect a DOM `Node` (e.g. `element.contains(...)`), use the **DOM** type, not React Flow’s `Node` type. For example:  
`e.target as unknown as globalThis.Node`  
Also ensure props that must be `T | null` are not `undefined` (e.g. use `?? null` after `.find()`).

**Why:** React Flow’s `Node` type conflicts with the global DOM `Node` type. Using the wrong one leads to TypeScript errors and can surface as build failures.

---

## Troubleshooting Build Failures

| Symptom | What to check |
|--------|----------------|
| **“Element type is invalid”** during “Generating static pages” | Ensure `app/layout-client.tsx` still uses `next/dynamic` with `ssr: false` for TopNav, MaterialIconsLoader, and InstantDBAuthInit. |
| **“Cannot find module './vendor-chunks/@instantdb.js'”** | Ensure `next.config.js` has `experimental.serverComponentsExternalPackages: ['@instantdb/react']`. |
| **TypeScript errors about `Node` or `contains`** | Use DOM `Node` (e.g. `globalThis.Node`) for DOM APIs; avoid React Flow `Node` in those places. |
| **Blank page after deploy** | Confirm `NEXT_PUBLIC_INSTANT_APP_ID` is set in Netlify environment variables and redeploy. |

---

## Quick checklist before each deploy

- [ ] `npm run build` succeeds locally
- [ ] `app/layout-client.tsx` still uses dynamic imports with `ssr: false` for TopNav, MaterialIconsLoader, InstantDBAuthInit
- [ ] `next.config.js` still includes `serverComponentsExternalPackages: ['@instantdb/react']`
- [ ] `NEXT_PUBLIC_INSTANT_APP_ID` is set in Netlify (and in `.env.local` for local runs)
