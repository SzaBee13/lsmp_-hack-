const submitButton = document.getElementById("submit");
const tokenInput = document.getElementById("tokenInput");
const pathInput = document.getElementById("pathInput");

const API_BASE_URL = "https://lsmp.hu/api/v2";
const TOKEN_STORAGE_KEY = "lsmp.auth.token";

function sanitizePath(path) {
  return path.replace(/^\/+/, "").replace(/^api\/v2\//, "");
}

function rememberToken() {
  const token = tokenInput.value.trim();
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

function restoreToken() {
  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (savedToken) {
    tokenInput.value = savedToken;
  }
}

function fetchData() {
  const token = tokenInput.value.trim();
  const path = sanitizePath(pathInput.value.trim());

  if (!path || !token) {
    return;
  }

  rememberToken();

  fetch(`${API_BASE_URL}/${path}`, {
    headers: {
      Authorization: token
    }
  })
    .then((res) => res.json())
    .then((jsonRes) => {
      document.getElementById("results").innerText = JSON.stringify(jsonRes, null, 2);
    })
    .catch((error) => {
      document.getElementById("results").innerText = `Request failed: ${error.message}`;
    });
}

submitButton.addEventListener("click", fetchData);
tokenInput.addEventListener("change", rememberToken);

pathInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    fetchData();
  }
});

tokenInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    fetchData();
  }
});

restoreToken();
