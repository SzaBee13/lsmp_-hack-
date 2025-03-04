const container = document.getElementById("container");
const submitButton = document.getElementById("submit");
const tokenInput = document.getElementById("tokenInput");
const pathInput = document.getElementById("pathInput");

let path;
let token;

submitButton.addEventListener("click", (e) => {
    token = document.getElementById("tokenInput").value;
    path = document.getElementById("pathInput").value;
    fetchData();
});

pathInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        token = document.getElementById("tokenInput").value;
        path = document.getElementById("pathInput").value;
        fetchData();
    }
});

tokenInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        token = document.getElementById("tokenInput").value;
        path = document.getElementById("pathInput").value;
        fetchData();
    }
});

function fetchData() {
    if (path && token) {
        fetch(`https://lsmp.hu/api/${path}`, {
            headers: {
                authorization: token,
            },
        })
            .then((res) => res.json())
            .then((jsonRes) => {
                document.getElementById("results").innerText = JSON.stringify(
                    jsonRes,
                    null,
                    2
                );
            });
    }
}
