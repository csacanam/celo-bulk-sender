Celo Bulk Sender
================

Send the same amount of CELO or a Mento Protocol stable token (USDm, COPm, EURm, etc.) to many recipients in a single transaction.

**Try it:** [https://celo-bulk-sender.vercel.app/](https://celo-bulk-sender.vercel.app/)

### Live app & deployed contract (Celo mainnet)

| Contract  | Address |
|-----------|---------|
| BulkSender | `0xAeB90eb53700e83F91046Bd71a7553CC564747a2` |

### What the frontend does

- **Asset selection**: CELO (native) or any Mento stable token from a dropdown (USDm, COPm, EURm, BRLm, XOFm, KESm, PHPm, GBPm, CADm, AUDm, CHFm, GHSm, JPYm, NGNm, ZARm).
- **CSV upload**: Accepts addresses one per line or comma-separated.
- **EVM address validation**: All entries are validated before sending. Invalid addresses are rejected and the Send button is disabled until the CSV contains only valid EVM addresses. Duplicates are ignored.
- **ERC20 approve flow**: If you send tokens, the app automatically checks allowance and prompts an `approve` transaction when needed before the bulk send.
- **Success feedback**: After a successful send, a link to view the transaction on the block explorer (Celoscan) is shown instead of the raw hash.
- **Developed by** [@camilosaka](https://x.com/camilosaka).

The project is split into two main parts:

- `contracts`: Foundry-based Solidity project for the bulk sender smart contract.
- `frontend`: Static HTML/JS app that connects to a deployed bulk sender contract and supports Mento stable tokens with address validation and approve flow.

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

Alternatively, you can copy `contracts/.env.example` to `contracts/.env` and edit the value there; Foundry will automatically load environment variables from that file when running inside the `contracts` directory.

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
window.BULK_SENDER_CONFIG = {
  bulkSenderAddress: "0xAeB90eb53700e83F91046Bd71a7553CC564747a2",
  rpcUrl: "https://forno.celo.org",
  chainId: 42220, // Celo mainnet
  explorerUrl: "https://celoscan.io", // for success-message links
};
```

`frontend/config.js` also defines `MENTO_TOKENS`, an array of Mento stable tokens (address, symbol, name) used to populate the token dropdown.

The app comes pre-configured for the mainnet deployment above. To use a different network or your own deployment, edit:

- **`bulkSenderAddress`**: The address of the BulkSender contract.
- **`rpcUrl`**: RPC URL for the target network.
  - Alfajores: `https://alfajores-forno.celo-testnet.org`
  - Mainnet: `https://forno.celo.org`
- **`chainId`**: Numeric chain ID.
  - Alfajores testnet: `44787`
  - Celo mainnet: `42220`

The `frontend/app.js` file:

- Connects to the user’s wallet (e.g., MetaMask) and switches to the configured chain ID.
- Instantiates the bulk sender contract at `bulkSenderAddress`.
- Validates CSV addresses with `ethers.isAddress()` before allowing a send.
- Calls `approve` on the token contract when needed before `bulkSendToken`.
- Renders a "View on Explorer" link in the success message.

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

---

Developed by [@camilosaka](https://x.com/camilosaka).

