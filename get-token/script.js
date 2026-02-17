const result = document.getElementById("results");

const loginButton = document.getElementById("login");
const usernameInput = document.getElementById("usernameField");
const passwordInput = document.getElementById("passwordField");

const mfa = document.getElementById("mfa");
const mfaButton = document.getElementById("submit");
const mfaInput = document.getElementById("mfaField");

const oauth2LoginButton = document.getElementById("oauth2Login");
const exchangeCodeButton = document.getElementById("exchangeCode");

const API_BASE_URL = "https://lsmp.hu/api/v2";
const OAUTH_STORAGE_KEY = "lsmp.oauth2.pkce";
const TOKEN_STORAGE_KEY = "lsmp.auth.token";

mfa.style.display = "none";

let token;
let oauthConfig = {
  clientId: "",
  clientSecret: "",
  redirectUri: "",
  scope: "openid profile",
  authorizeEndpoint: "https://lsmp.hu/api/v2/oauth2/authorize",
  tokenEndpoint: "https://lsmp.hu/api/v2/oauth2/token"
};

async function loadRuntimeEnv() {
  try {
    const response = await fetch("/api/env", { cache: "no-store" });
    if (!response.ok) {
      return {};
    }
    return response.json();
  } catch {
    return {};
  }
}

function readStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

function saveToken(nextToken) {
  token = nextToken;
  localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
}

function getTokenFromResponse(payload) {
  return payload?.Token || payload?.token || payload?.accessToken || payload?.access_token || payload?.data?.token || "";
}

function hasMfaChallenge(payload) {
  return payload?.mfa === true || payload?.mfaRequired === true || payload?.requireMfa === true;
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let value = "";
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const random = new Uint8Array(length);
  crypto.getRandomValues(random);
  return Array.from(random, (item) => chars[item % chars.length]).join("");
}

async function buildPkceChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

function createCopyButton(nextToken) {
  saveToken(nextToken);
  result.innerHTML = `
    <input type="text" value="${nextToken}" id="tokenField" readonly class="styled-input-"/>
    <button id="copyButton">Copy Token</button>
  `;

  const copyButton = document.getElementById("copyButton");
  copyButton.addEventListener("click", async () => {
    const tokenField = document.getElementById("tokenField");
    try {
      await navigator.clipboard.writeText(tokenField.value);
    } catch {
      tokenField.select();
      document.execCommand("copy");
    }
    alert("Token copied to clipboard!");
  });
}

function showJson(payload) {
  result.textContent = JSON.stringify(payload, null, 2);
}

function saveOauthState(state) {
  localStorage.setItem(OAUTH_STORAGE_KEY, JSON.stringify(state));
}

function readOauthState() {
  const raw = localStorage.getItem(OAUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearOauthState() {
  localStorage.removeItem(OAUTH_STORAGE_KEY);
}

function login(username, password) {
  fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
    .then((res) => res.json())
    .then((jsonRes) => {
      const receivedToken = getTokenFromResponse(jsonRes);
      if (receivedToken) {
        saveToken(receivedToken);
      }

      if (hasMfaChallenge(jsonRes)) {
        mfa.style.display = "flex";
        return;
      }

      if (!receivedToken) {
        throw new Error("Token was not returned by the API.");
      }

      createCopyButton(receivedToken);
    })
    .catch((error) => {
      result.textContent = `Login failed: ${error.message}`;
      mfa.style.display = "none";
    });
}

function mfaLogin(mfaCode) {
  fetch(`${API_BASE_URL}/auth/mfa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({ code: mfaCode })
  })
    .then((res) => res.json())
    .then((jsonRes) => {
      const receivedToken = getTokenFromResponse(jsonRes);
      if (!receivedToken) {
        throw new Error("Token was not returned by the MFA endpoint.");
      }

      createCopyButton(receivedToken);
      mfa.style.display = "none";
    })
    .catch((error) => {
      result.textContent = `MFA failed: ${error.message}`;
      mfa.style.display = "none";
    });
}

async function startOauth2Login() {
  const { clientId, clientSecret, redirectUri, scope, authorizeEndpoint, tokenEndpoint } = oauthConfig;

  if (!clientId || !redirectUri || !scope || !authorizeEndpoint || !tokenEndpoint) {
    result.textContent = "Missing OAuth2 env config. Required: OAUTH_CLIENT_ID. Optional: OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI, OAUTH_SCOPE, OAUTH_AUTHORIZE_URL, OAUTH_TOKEN_URL.";
    return;
  }

  const state = randomString(32);
  const codeVerifier = randomString(64);
  const codeChallenge = await buildPkceChallenge(codeVerifier);

  saveOauthState({
    state,
    codeVerifier,
    clientId,
    clientSecret,
    redirectUri,
    tokenEndpoint
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  window.location.href = `${authorizeEndpoint}?${params.toString()}`;
}

async function exchangeCodeForToken() {
  const query = new URLSearchParams(window.location.search);
  const code = query.get("code");
  const returnedState = query.get("state");
  const oauthError = query.get("error");
  const oauthErrorDescription = query.get("error_description");

  if (oauthError) {
    result.textContent = `OAuth2 error: ${oauthError} ${oauthErrorDescription || ""}`.trim();
    return;
  }

  if (!code) {
    result.textContent = "No OAuth2 code in URL. Start OAuth2 Login first.";
    return;
  }

  const saved = readOauthState();
  if (!saved) {
    result.textContent = "Missing OAuth2 state in localStorage. Start OAuth2 Login again.";
    return;
  }

  if (returnedState !== saved.state) {
    result.textContent = "OAuth2 state mismatch. Possible stale tab or CSRF issue.";
    clearOauthState();
    return;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: saved.clientId,
    redirect_uri: saved.redirectUri,
    code_verifier: saved.codeVerifier
  });

  if (saved.clientSecret) {
    body.set("client_secret", saved.clientSecret);
  }

  try {
    const response = await fetch(saved.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });

    const payload = await response.json();
    if (!response.ok) {
      showJson(payload);
      return;
    }

    const oauthToken = getTokenFromResponse(payload);
    if (oauthToken) {
      createCopyButton(oauthToken);
    } else {
      showJson(payload);
    }

    clearOauthState();
  } catch (error) {
    result.textContent = `Code exchange failed: ${error.message}`;
  }
}

async function initOauth2Defaults() {
  const env = await loadRuntimeEnv();
  const defaultRedirect = window.location.origin + window.location.pathname;

  oauthConfig = {
    clientId: env.OAUTH_CLIENT_ID || "",
    clientSecret: env.OAUTH_CLIENT_SECRET || "",
    redirectUri: env.OAUTH_REDIRECT_URI || defaultRedirect,
    scope: env.OAUTH_SCOPE || oauthConfig.scope,
    authorizeEndpoint: env.OAUTH_AUTHORIZE_URL || oauthConfig.authorizeEndpoint,
    tokenEndpoint: env.OAUTH_TOKEN_URL || oauthConfig.tokenEndpoint
  };

  const existingToken = readStoredToken();
  if (existingToken) {
    createCopyButton(existingToken);
  }
}

loginButton.addEventListener("click", () => {
  login(usernameInput.value, passwordInput.value);
});

usernameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    login(usernameInput.value, passwordInput.value);
  }
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    login(usernameInput.value, passwordInput.value);
  }
});

mfaButton.addEventListener("click", () => {
  mfaLogin(mfaInput.value);
});

mfaInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    mfaLogin(mfaInput.value);
  }
});

oauth2LoginButton.addEventListener("click", startOauth2Login);
exchangeCodeButton.addEventListener("click", exchangeCodeForToken);

initOauth2Defaults();

if (new URLSearchParams(window.location.search).has("code")) {
  exchangeCodeForToken();
}
