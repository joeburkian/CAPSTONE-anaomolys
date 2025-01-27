function init() {
    const imageInput = document.getElementById("image-input");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sensitivitySlider = document.getElementById("sensitivity-slider");
    const detectButton = document.getElementById("detect-button");
    const coordinatesList = document.getElementById("coordinates-list");
    const anomalyCount = document.getElementById("anomaly-count");
    const infoBox = document.getElementById("info-box");
    const infoBoxContent = document.getElementById("info-box-content");
    const showCoordinatesHover = document.getElementById("show-coordinates-hover");
    let originalImageData;

    imageInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    function isYellowish(r, g, b, sensitivity) {
        return (
            r > 200 &&
            g > 200 &&
            b < (255 - sensitivity * 2) &&
            Math.abs(r - g) < sensitivity
        );
    }

    function detectAnomalies() {
        const sensitivity = parseInt(sensitivitySlider.value, 10);
        coordinatesList.innerHTML = "";
        anomalyCount.textContent = "";

        if (originalImageData) {
            ctx.putImageData(originalImageData, 0, 0);
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const anomalies = [];

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];

                if (isYellowish(r, g, b, sensitivity)) {
                    anomalies.push({ x, y });
                    data[index] = 255; // Highlight in red
                    data[index + 1] = 0;
                    data[index + 2] = 0;
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        anomalyCount.textContent = `Anomalies Detected: ${anomalies.length}`;

        anomalies.forEach(({ x, y }) => {
            const listItem = document.createElement("li");
            listItem.textContent = `(${x}, ${y})`;
            coordinatesList.appendChild(listItem);
        });
    }

    detectButton.addEventListener("click", detectAnomalies);

    document.getElementById("info-box-close").addEventListener("click", () => {
        infoBox.style.display = 'none';
    });
}

document.addEventListener("DOMContentLoaded", init);
