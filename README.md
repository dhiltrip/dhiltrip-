This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The repository's primary branch is `master`. With Vercel Git integration enabled and `master` selected as the Production Branch, pushing or merging to it triggers a deployment. Confirm the resulting GitHub deployment check succeeds before considering the release live.

The website, embedded Studio at `/studio`, and Sanity CLI share the public project ID `rsnabcto` and dataset `packages` from `sanity/env.ts`. These defaults allow builds without configuring Sanity environment variables in Vercel. Optional overrides are listed in `.env.example`; copy it to `.env.local` for local overrides. Published content in this public dataset does not require a read token. Never put a secret token in a `NEXT_PUBLIC_*` variable.

Before releasing:

1. Ensure temporary QA documents have been removed after CMS validation, without deleting shared image assets.
2. Allow `https://dhiltrip.vercel.app` and the actual client domain in the Sanity project's API/CORS settings. A public dataset still requires the correct browser origin. Add preview origins explicitly when testing a preview deployment. Reading published content does not require credentials; authenticated editing in `/studio` requires **Allow credentials** for that exact origin, with the project owner's approval.
3. Run `npm ci`, `npm run build`, and `npm run lint`. Report existing lint failures separately from build results.
4. After a successful deployment check, verify the homepage, `/studio`, package details, gallery, FAQ, and testimonials on the deployed URL. Check the client domain and HTTPS separately when that domain is available.

The defaults address missing Sanity configuration. They do not establish the cause of an earlier failed Vercel deployment. Build success locally does not verify the remote deployment or its domain assignment.
