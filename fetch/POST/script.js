const container = document.getElementById("container");
const submitButton = document.getElementById("submit");
const tokenInput = document.getElementById("tokenInput");
const pathInput = document.getElementById("pathInput");
const bodyInput = document.getElementById("bodyInput");



function POST() {
    const token = tokenInput.value;
    const path = pathInput.value;
    const body = bodyInput.value;

    if (path && token && body) {
        fetch(`https://lsmp.hu/api/${path}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: body,
        })
        .then((res) => res.json())
        .then((jsonRes) => {
            document.getElementById("results").innerText = JSON.stringify(jsonRes, null, 2);
        })
        .catch((error) => {
            console.error("Error:", error);
            document.getElementById("results").innerText = "An error occurred. Check the console for details.";
        });
    } else {
        alert("Please fill in all fields before submitting.");
    }
}

// Attach POST function to the submit button
submitButton.addEventListener("click", POST);

// Handle Enter key for pathInput and tokenInput
pathInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        POST(); // Trigger the POST function
    }
});

tokenInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        POST(); // Trigger the POST function
    }
});

// Handle Tab and Backspace for bodyInput
bodyInput.addEventListener("keydown", function (event) {
    if (event.key === "Tab") {
        event.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4; // Move cursor after 4 spaces
    } else if (event.key === "Backspace") {
        const start = this.selectionStart;
        const end = this.selectionEnd;
        if (start === end && this.value.substring(start - 4, start) === "    ") {
            event.preventDefault();
            this.value = this.value.substring(0, start - 4) + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start - 4; // Move cursor back 4 spaces
        }
    }
});