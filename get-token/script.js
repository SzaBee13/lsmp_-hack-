const container = document.getElementById("container");
const result = document.getElementById("results");

const loginButton = document.getElementById("login");
const usernameInput = document.getElementById("usernameField");
const passwordInput = document.getElementById("passwordField");

const mfa = document.getElementById("mfa");
const mfaButton = document.getElementById("submit");
const mfaInput = document.getElementById("mfaField");

mfa.style.display = "none";

let token;

function login(username, password) {
    fetch("https://lsmp.hu/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then((res) => res.json())
    .then((jsonRes) => {
        if (jsonRes.mfa == true) {
            token = jsonRes.Token; // Store the token for MFA
            mfa.style.display = "flex";
        } else {
            token = jsonRes.Token;
            createCopyButton(token);
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

function mfaLogin(mfaCode) {
    console.log("Using token for MFA:", token); // Log the token being used for MFA
    fetch("https://lsmp.hu/api/auth/mfa", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({
            code: mfaCode
        })
    })
    .then((res) => res.json())
    .then((jsonRes) => {
        console.log("MFA response:", jsonRes); // Log the response for debugging
        token = jsonRes.Token;
        createCopyButton(token);
        mfa.style.display = "none";
    })
    .catch(error => {
        console.error("Error:", error);
        mfa.style.display = "none";
    });
}

function createCopyButton(token) {
    result.innerHTML = `
        <input type="text" value="${token}" id="tokenField" readonly class="styled-input-"/>
        <button id="copyButton">Copy Token</button>
    `;
    const copyButton = document.getElementById("copyButton");
    copyButton.addEventListener("click", () => {
        const tokenField = document.getElementById("tokenField");
        tokenField.select();
        document.execCommand("copy");
        alert("Token copied to clipboard!");
    });
}

loginButton.addEventListener("click", (e) => {
    login(usernameInput.value, passwordInput.value);
});

usernameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        login(usernameInput.value, passwordInput.value);
    }
});

passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        login(usernameInput.value, passwordInput.value);
    }
});

mfaButton.addEventListener("click", (e) => {
    mfaLogin(mfaInput.value);
});

mfaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        mfaLogin(mfaInput.value);
    }
});