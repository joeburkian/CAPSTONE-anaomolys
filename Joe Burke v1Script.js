function init() {
    const imageInput = document.getElementById("image-input");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const sensitivitySlider = document.getElementById("sensitivity-slider");
    const detectButton = document.getElementById("detect-button");
    const coordinatesList = document.getElementById("coordinates-list");
    const tooltip = document.getElementById("tooltip");
    const showCoordinatesCheckbox = document.getElementById("show-coordinates");
    let originalImageData;

    const MAX_ANOMALIES = 5000;

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

        if (originalImageData) {
            ctx.putImageData(originalImageData, 0, 0);
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const anomalies = [];
        const visited = new Set();

        function floodFill(x, y) {
            const queue = [{ x, y }];
            const pixels = [];
            while (queue.length > 0) {
                const { x, y } = queue.shift();
                const index = (y * canvas.width + x) * 4;
                if (visited.has(index)) continue;
                visited.add(index);
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (isYellowish(r, g, b, sensitivity)) {
                    pixels.push({ x, y });
                    // Mark pixel with red for highlighting
                    data[index] = 255;     // Red
                    data[index + 1] = 0;   // Green
                    data[index + 2] = 0;   // Blue
                    data[index + 3] = 150; // Semi-transparent
                    if (x > 0) queue.push({ x: x - 1, y });
                    if (x < canvas.width - 1) queue.push({ x: x + 1, y });
                    if (y > 0) queue.push({ x, y: y - 1 });
                    if (y < canvas.height - 1) queue.push({ x, y: y + 1 });
                }
            }
            return pixels;
        }

        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const index = (y * canvas.width + x) * 4;
                if (visited.has(index)) continue;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                if (isYellowish(r, g, b, sensitivity)) {
                    const pixels = floodFill(x, y);
                    if (pixels.length > 0) {
                        const centerX = Math.floor(pixels.reduce((sum, p) => sum + p.x, 0) / pixels.length);
                        const centerY = Math.floor(pixels.reduce((sum, p) => sum + p.y, 0) / pixels.length);
                        const anomalyRGB = { r: pixels[0].r, g: pixels[0].g, b: pixels[0].b };
                        const backgroundRGB = { r, g, b };
                        const anomalySize = pixels.length;

                        anomalies.push({ x: centerX, y: centerY, anomalyRGB, backgroundRGB, size: anomalySize });

                        // Create a button for each coordinate
                        const button = document.createElement("button");
                        button.textContent = `(${centerX}, ${centerY}) - Size: ${anomalySize} pixels`;
                        button.classList.add("coordinate-button");
                        button.addEventListener("click", () => showPopup(centerX, centerY, anomalyRGB, backgroundRGB));
                        coordinatesList.appendChild(button);

                        // Draw circle to highlight anomaly on the canvas
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, Math.max(Math.sqrt(anomalySize), 5), 0, 2 * Math.PI);
                        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
                        ctx.fill();
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0); // Render the highlighted image back to canvas
    }

    function showPopup(x, y, anomalyRGB, backgroundRGB) {
        const colorDiff = Math.sqrt(
            Math.pow(anomalyRGB.r - backgroundRGB.r, 2) +
            Math.pow(anomalyRGB.g - backgroundRGB.g, 2) +
            Math.pow(anomalyRGB.b - backgroundRGB.b, 2)
        ).toFixed(2);

        const popup = document.getElementById("popup");
        const popupContent = document.getElementById("popup-content");
        popupContent.innerHTML = `
            <strong>Coordinate:</strong> (${x}, ${y})<br>
            <strong>Color Difference:</strong> ${colorDiff}<br>
            <strong>Anomaly RGB:</strong> (${anomalyRGB.r}, ${anomalyRGB.g}, ${anomalyRGB.b})<br>
            <strong>Background RGB:</strong> (${backgroundRGB.r.toFixed(2)}, ${backgroundRGB.g.toFixed(2)}, ${backgroundRGB.b.toFixed(2)})
        `;
        popup.style.display = "block";
    }

    function hidePopup() {
        const popup = document.getElementById("popup");
        popup.style.display = "none";
    }

    document.addEventListener("click", (event) => {
        if (!event.target.classList.contains("coordinate-button") && event.target.id !== "close-popup") {
            hidePopup();
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (showCoordinatesCheckbox.checked) {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor(event.clientX - rect.left);
            const y = Math.floor(event.clientY - rect.top);
            tooltip.style.display = "block";
            tooltip.style.left = `${event.pageX + 15}px`;
            tooltip.style.top = `${event.pageY + 15}px`;
            tooltip.textContent = `(${x}, ${y})`;
        } else {
            tooltip.style.display = "none";
        }
    });

    canvas.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
    });

    detectButton.addEventListener("click", detectAnomalies);
}

document.addEventListener("DOMContentLoaded", init);
