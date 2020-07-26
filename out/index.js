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

function clamp(a, b, x) {
    if (x < a) {
        return a;
    } else if (x > b) {
        return b;
    } else {
        return x;
    }
}

function updateProgressBar(y) {
    const progressBar = document.getElementById("progress-bar");
    const footnotes = document.querySelector(".footnotes");
    const articleHeight =
        footnotes.offsetTop
        + footnotes.getBoundingClientRect().height
        - window.innerHeight;
    const percent = clamp(0, 100, (100 * y) / articleHeight);
    progressBar.style.width = `${percent}%`;
}

let y = 0;
let ticking = false;

window.addEventListener("scroll", () => {
    y = window.scrollY;

    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateProgressBar(y);
            ticking = false;
        });

        ticking = true;
    }
});
