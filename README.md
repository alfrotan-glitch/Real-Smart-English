<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1UCF3Jw8EmnUZoWx5ip3SHHVyrFhd7Cy_

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Project bot

A small helper script to run common tasks locally.

Examples:

 - Show project status: `npm run bot:status`
 - Start dev server: `npm run bot:dev` (same as `npm run dev`)
 - Build for production: `npm run bot:build`
 - Typecheck: `npm run bot:typecheck`

Or run `npm run bot help` for available commands.
