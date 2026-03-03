Bulk Sender for Celo
=====================

This repository contains a simple bulk sender smart contract and a static frontend to send CELO or ERC‑20 tokens to many recipients in a single transaction.

The project is split into two main parts:

- `contracts`: Foundry-based Solidity project for the bulk sender smart contract.
- `frontend`: Static HTML/JS app that connects to a deployed bulk sender contract.

The sections below describe how to configure and run each part without changing any application logic.


Contracts (Foundry)
-------------------

### Prerequisites

- **Foundry** (`forge`, `cast`, etc.) installed. See the official Foundry documentation for installation instructions.
- A funded account on the target Celo network (e.g., Alfajores testnet or Celo mainnet).

### Project layout

- `contracts/src`: Solidity contracts.
- `contracts/test`: Foundry tests.
- `contracts/script`: Deployment and utility scripts.
- `contracts/foundry.toml`: Foundry configuration.

The top-level `contracts/foundry.toml` already defines:

- Compiler version `0.8.31` and EVM version `osaka`.
- Standard paths (`src`, `out`, `lib`, `test`, `cache_forge`).
- Fuzzing and linting settings.

### Required environment variables

To interact with Celo from Foundry (for example, when running scripts that use a live RPC endpoint), you must set:

- **`CELO_RPC_URL`** – HTTP(S) RPC URL for the Celo network you want to use.

Examples:

- For **Celo Alfajores testnet**:
  - `CELO_RPC_URL=https://alfajores-forno.celo-testnet.org`
- For **Celo mainnet** (example, use your own provider or node):
  - `CELO_RPC_URL=https://forno.celo.org`

You can export this in your shell before running `forge` commands, for example:

```bash
export CELO_RPC_URL="https://alfajores-forno.celo-testnet.org"
```

No additional configuration changes are required in `foundry.toml`; it is already wired to read this environment variable.


Frontend (Static App)
---------------------

The frontend is a static HTML/JavaScript application located in the `frontend` directory:

- `frontend/index.html`
- `frontend/app.js`
- `frontend/config.js`
- `frontend/example-addresses.csv`

It uses a global configuration object defined in `frontend/config.js` and expects `ethers` and the bulk sender ABI to be available via `<script>` tags in `index.html`.

### Frontend configuration

All runtime configuration for the frontend lives in `frontend/config.js`:

```javascript
// Edit these after deploying the BulkSender contract
window.BULK_SENDER_CONFIG = {
  bulkSenderAddress: "0x0000000000000000000000000000000000000000",
  rpcUrl: "https://alfajores-forno.celo-testnet.org",
  chainId: 44787, // Celo Alfajores
};
```

You must update the following fields before using the app against a real deployment:

- **`bulkSenderAddress`**: The address of your deployed BulkSender contract.
  - Replace the all‑zero placeholder with the actual contract address.
- **`rpcUrl`**: RPC URL that matches the network where the contract is deployed.
  - Example for Alfajores: `https://alfajores-forno.celo-testnet.org`
  - For mainnet, use a mainnet RPC endpoint instead.
- **`chainId`**: Numeric chain ID corresponding to the target network.
  - Alfajores testnet: `44787`
  - Celo mainnet: `42220`

The `frontend/app.js` file reads `window.BULK_SENDER_CONFIG` and:

- Connects to the user’s wallet (e.g., MetaMask).
- Attempts to switch to the configured chain ID.
- Instantiates the bulk sender contract at `bulkSenderAddress`.

No additional changes to the JavaScript logic are required as long as the config values above are correct.

### Running the frontend

Because the frontend is completely static, you do not need Node.js tooling or a `package.json` file to run it. Any static file server is sufficient.

Examples:

- Using `npx serve`:

  ```bash
  cd frontend
  npx serve .
  ```

- Using a simple Python HTTP server:

  ```bash
  cd frontend
  python -m http.server 8000
  ```

Then open `http://localhost:8000` (or the URL printed by your server) in a browser with a Web3 wallet extension installed.


Typical Workflow
----------------

1. **Deploy contracts**
   - Use Foundry scripts or your preferred deployment flow inside `contracts` to deploy the BulkSender contract to the desired Celo network.
   - Note the deployed contract address.

2. **Configure the frontend**
   - Edit `frontend/config.js`:
     - Set `bulkSenderAddress` to the deployed contract address.
     - Set `rpcUrl` and `chainId` to match the target network.

3. **Serve the frontend**
   - Run a static file server in the `frontend` directory.
   - Open the app in your browser, connect your wallet, and upload a CSV of recipient addresses using the provided example as a template.

This README is focused only on configuration and usage; it does not change the application’s functionality.

