const CONFIG = window.BULK_SENDER_CONFIG;

const BULK_SENDER_ABI = [
  "function bulkSendNative(address[] recipients, uint256 amountPerRecipient) payable",
  "function bulkSendToken(address token, address[] recipients, uint256 amountPerRecipient)",
];

let signer;
let bulkSenderContract;
let recipients = [];
let hasInvalidRecipients = false;

const $ = (id) => document.getElementById(id);

function getMode() {
  const select = $("mode");
  return select && select.value === "native" ? "native" : "token";
}

function isAmountValid() {
  const amountStr = $("amount").value.trim();
  if (!amountStr || isNaN(parseFloat(amountStr))) return false;
  try {
    // Will throw if invalid
    ethers.parseUnits(amountStr, 18);
    return true;
  } catch {
    return false;
  }
}

function updateSummary() {
  const isNative = getMode() === "native";
  const amountStr = $("amount").value.trim();
  $("summary-mode").textContent = isNative ? "CELO (native)" : "ERC20 token";
  $("summary-count").textContent = recipients.length.toString();

  let totalText = "-";
  if (isAmountValid() && recipients.length > 0) {
    try {
      const amount = ethers.parseUnits(amountStr, 18);
      const total = amount * BigInt(recipients.length);
      totalText = `${ethers.formatUnits(total, 18)} ${isNative ? "CELO" : "tokens"}`;
    } catch {
      totalText = "-";
    }
  }
  $("summary-total").textContent = totalText;
}

function updateSendButton() {
  $("btn-send").disabled = recipients.length === 0 || !isAmountValid() || hasInvalidRecipients;
}

async function connect() {
  if (!window.ethereum) {
    alert("Install MetaMask or another Web3 wallet");
    return;
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts.length) return;

  const provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${CONFIG.chainId.toString(16)}` }],
    });
  } catch (e) {
    console.warn("Chain switch:", e.message);
  }

  bulkSenderContract = new ethers.Contract(CONFIG.bulkSenderAddress, BULK_SENDER_ABI, signer);

  $("connect-section").style.display = "none";
  $("app").style.display = "block";
  $("wallet-address").textContent = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;

  updateSummary();
}

function parseAddresses(text) {
  const lines = text.split(/[\n,]/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const seen = new Set();
  const valid = [];
  const invalid = [];
  for (const a of lines) {
    if (ethers.isAddress(a)) {
      if (!seen.has(a)) {
        seen.add(a);
        valid.push(a);
      }
    } else {
      invalid.push(a);
    }
  }
  return { valid, invalid };
}

function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const { valid, invalid } = parseAddresses(ev.target.result);
    recipients = valid;
    hasInvalidRecipients = invalid.length > 0;
    const previewMax = 30;
    const preview = recipients.slice(0, previewMax);
    $("recipients-preview").textContent = preview.length
      ? preview.join("\n") + (recipients.length > previewMax ? `\n… and ${recipients.length - previewMax} more` : "")
      : "No valid addresses";
    $("preview").style.display = "block";
    if (hasInvalidRecipients) {
      $("send-error").textContent = `CSV contains ${invalid.length} invalid address(es). Please fix them and re-upload.`;
    } else {
      $("send-error").textContent = "";
    }
    updateSummary();
    updateSendButton();
  };
  reader.readAsText(file);
}

$("mode").addEventListener("change", (e) => {
  $("token-field").style.display = e.target.value === "token" ? "block" : "none";
  updateSummary();
  updateSendButton();
});

$("csv-file").addEventListener("change", onFileChange);

$("amount").addEventListener("input", () => {
  updateSummary();
  updateSendButton();
});

$("btn-connect").addEventListener("click", connect);

$("btn-send").addEventListener("click", async () => {
  $("send-error").textContent = "";
  $("send-success").textContent = "";

  const amountStr = $("amount").value.trim();
  if (!amountStr || isNaN(parseFloat(amountStr))) {
    $("send-error").textContent = "Enter a valid amount";
    return;
  }

  if (hasInvalidRecipients) {
    $("send-error").textContent = "Fix invalid addresses in the CSV before sending.";
    return;
  }

  const isNative = getMode() === "native";
  const amount = ethers.parseUnits(amountStr, 18);

  if (recipients.length === 0) {
    $("send-error").textContent = "Upload a CSV with addresses";
    return;
  }

  try {
    if (isNative) {
      const total = amount * BigInt(recipients.length);
      const tx = await bulkSenderContract.bulkSendNative(recipients, amount, { value: total });
      await tx.wait();
      $("send-success").textContent = `Sent ${amountStr} CELO to ${recipients.length} addresses. Tx: ${tx.hash}`;
    } else {
      const tokenAddr = $("token-address").value.trim();
      if (!ethers.isAddress(tokenAddr)) {
        $("send-error").textContent = "Enter a valid token address";
        return;
      }
      const tx = await bulkSenderContract.bulkSendToken(tokenAddr, recipients, amount);
      await tx.wait();
      $("send-success").textContent = `Sent ${amountStr} tokens to ${recipients.length} addresses. Tx: ${tx.hash}`;
    }
  } catch (e) {
    $("send-error").textContent = e.reason || e.message || "Transaction failed";
  }
});
