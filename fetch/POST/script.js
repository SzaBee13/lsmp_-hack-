const submitButton = document.getElementById("submit");
const tokenInput = document.getElementById("tokenInput");
const pathInput = document.getElementById("pathInput");
const bodyInput = document.getElementById("bodyInput");

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

function postData() {
  const token = tokenInput.value.trim();
  const path = sanitizePath(pathInput.value.trim());
  const body = bodyInput.value;

  if (!path || !token || !body) {
    alert("Please fill in all fields before submitting.");
    return;
  }

  rememberToken();

  fetch(`${API_BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body
  })
    .then((res) => res.json())
    .then((jsonRes) => {
      document.getElementById("results").innerText = JSON.stringify(jsonRes, null, 2);
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("results").innerText = `An error occurred: ${error.message}`;
    });
}

submitButton.addEventListener("click", postData);
tokenInput.addEventListener("change", rememberToken);

pathInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    postData();
  }
});

tokenInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    postData();
  }
});

bodyInput.addEventListener("keydown", function (event) {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = this.selectionStart;
    const end = this.selectionEnd;
    this.value = `${this.value.substring(0, start)}  ${this.value.substring(end)}`;
    this.selectionStart = this.selectionEnd = start + 2;
  } else if (event.key === "Backspace") {
    const start = this.selectionStart;
    const end = this.selectionEnd;
    if (start === end && this.value.substring(start - 2, start) === "  ") {
      event.preventDefault();
      this.value = `${this.value.substring(0, start - 2)}${this.value.substring(end)}`;
      this.selectionStart = this.selectionEnd = start - 2;
    }
  }
});

restoreToken();
