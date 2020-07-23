const furigana = document.getElementsByTagName("rt");
const inputs = document.getElementsByName("furigana");

function updateFurigana(furiganaType) {
    for (const rt of furigana) {
        rt.innerText = rt.dataset[furiganaType] || "";
    }
}

for (const radio of inputs) {
    radio.addEventListener("change", event => {
        updateFurigana(event.target.value);
    });
}
