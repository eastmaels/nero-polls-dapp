# 🚨 **BETA RELEASE** 🚨

> **This is a beta version of NERO Wallet. Expect frequent updates and potential changes.**  

# NERO Decentralized Polls

[![Beta Version](https://img.shields.io/badge/version-beta-orange.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![Discord](https://img.shields.io/discord/your-discord-id-here?label=Discord)](https://discord.gg/nerochainofficial)

NERO Wallet is a high-performance wallet that supports innovative blockchain applications.  
Follow the steps below for a quick and easy setup.

## 🔗 Demo

Try out our demo site at:  
[https://nero-polls.vercel.app/](https://nero-polls.vercel.app/)

## 📋 Prerequisites

- **Node.js**: `v22.4.1`
- **Yarn**: `v3.8.3`

## 🚀 Setup Instructions

### 1. Install Dependencies

Run the following command in your terminal:

```bash
yarn install
```

If install fails, try to delete yarn.lock, the run `yarn install`.

### 2. Start the Server

After installing the dependencies, start the development server with:

```bash
yarn dev
```

### 3. Deployment (vercel)

```bash
yarn build:demo
vercel build --prod
vercel --prebuilt --prod
```

## 📄 License

This project is distributed under the [MIT License](LICENSE).