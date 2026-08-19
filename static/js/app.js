/**
 * CaliValuate AI - Frontend Application Controller
 * Handles Leaflet Map synchronization, dynamic slider-input binding, preset autofill,
 * live REST API prediction calls, and animated statistics counters.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // 1. Element References
    // ----------------------------------------------------
    const form = document.getElementById("predictionForm");
    const predictBtn = document.getElementById("predictBtn");
    const resetFormBtn = document.getElementById("resetFormBtn");

    // Inputs & Sliders
    const latSlider = document.getElementById("latitudeSlider");
    const latInput = document.getElementById("latitude");
    const lngSlider = document.getElementById("longitudeSlider");
    const lngInput = document.getElementById("longitude");
    const overlayLat = document.getElementById("overlayLat");
    const overlayLng = document.getElementById("overlayLng");

    const incomeSlider = document.getElementById("medianIncomeSlider");
    const incomeInput = document.getElementById("median_income");
    const incomeUsdDisplay = document.getElementById("incomeUsdDisplay");

    const ageSlider = document.getElementById("ageSlider");
    const ageInput = document.getElementById("housing_median_age");
    const ageValDisplay = document.getElementById("ageValDisplay");

    const roomsSlider = document.getElementById("roomsSlider");
    const roomsInput = document.getElementById("total_rooms");
    const roomsValDisplay = document.getElementById("roomsValDisplay");

    const bedroomsSlider = document.getElementById("bedroomsSlider");
    const bedroomsInput = document.getElementById("total_bedrooms");
    const bedroomsValDisplay = document.getElementById("bedroomsValDisplay");

    const popSlider = document.getElementById("populationSlider");
    const popInput = document.getElementById("population");
    const popValDisplay = document.getElementById("popValDisplay");

    const hhSlider = document.getElementById("householdsSlider");
    const hhInput = document.getElementById("households");
    const householdsValDisplay = document.getElementById("householdsValDisplay");

    // Ocean Proximity
    const oceanPills = document.querySelectorAll(".ocean-pill");

    // Output Displays
    const predictedPriceElem = document.getElementById("predictedPrice");
    const priceRangeDisplay = document.getElementById("priceRangeDisplay");
    const confidenceBadge = document.getElementById("confidenceBadge");
    const pricePerRoomVal = document.getElementById("pricePerRoomVal");
    const roomsPerHhVal = document.getElementById("roomsPerHhVal");
    const bedRatioVal = document.getElementById("bedRatioVal");
    const densityVal = document.getElementById("densityVal");

    // Tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    // Presets
    const presetBtns = document.querySelectorAll(".preset-card");

    // ----------------------------------------------------
    // 2. Leaflet Map Initialization
    // ----------------------------------------------------
    let initialLat = parseFloat(latInput.value) || 37.85;
    let initialLng = parseFloat(lngInput.value) || -122.25;

    const map = L.map("californiaMap", {
        center: [36.8, -119.5],
        zoom: 6,
        zoomControl: false,
        attributionControl: false
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    // OpenStreetMap standard tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
    }).addTo(map);

    // Custom Draggable Pin
    const marker = L.marker([initialLat, initialLng], {
        draggable: true
    }).addTo(map);

    // Update map marker from inputs
    function updateMapMarker(lat, lng) {
        if (!isNaN(lat) && !isNaN(lng)) {
            marker.setLatLng([lat, lng]);
            map.panTo([lat, lng], { animate: true, duration: 0.5 });
            overlayLat.textContent = lat.toFixed(4);
            overlayLng.textContent = lng.toFixed(4);
        }
    }

    // Marker drag event
    marker.on("drag", (e) => {
        const pos = e.target.getLatLng();
        syncCoordinates(pos.lat, pos.lng, false);
    });

    // Map click event
    map.on("click", (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        // Keep within California bounds approximation
        if (lat >= 32.0 && lat <= 42.5 && lng >= -125.0 && lng <= -114.0) {
            syncCoordinates(lat, lng, true);
        }
    });

    function syncCoordinates(lat, lng, moveMarker = true) {
        const cleanLat = Math.min(41.95, Math.max(32.54, parseFloat(lat)));
        const cleanLng = Math.min(-114.31, Math.max(-124.35, parseFloat(lng)));

        latInput.value = cleanLat.toFixed(4);
        latSlider.value = cleanLat.toFixed(2);
        lngInput.value = cleanLng.toFixed(4);
        lngSlider.value = cleanLng.toFixed(2);

        overlayLat.textContent = cleanLat.toFixed(4);
        overlayLng.textContent = cleanLng.toFixed(4);

        if (moveMarker) {
            marker.setLatLng([cleanLat, cleanLng]);
        }
    }

    // ----------------------------------------------------
    // 3. Slider & Input Binding Helpers
    // ----------------------------------------------------
    function bindSliderInput(slider, input, displayCallback) {
        slider.addEventListener("input", () => {
            input.value = slider.value;
            if (displayCallback) displayCallback(slider.value);
        });

        input.addEventListener("input", () => {
            slider.value = input.value;
            if (displayCallback) displayCallback(input.value);
        });
    }

    // Coordinate inputs
    latSlider.addEventListener("input", () => {
        latInput.value = latSlider.value;
        updateMapMarker(parseFloat(latSlider.value), parseFloat(lngInput.value));
    });
    latInput.addEventListener("input", () => {
        latSlider.value = latInput.value;
        updateMapMarker(parseFloat(latInput.value), parseFloat(lngInput.value));
    });

    lngSlider.addEventListener("input", () => {
        lngInput.value = lngSlider.value;
        updateMapMarker(parseFloat(latInput.value), parseFloat(lngSlider.value));
    });
    lngInput.addEventListener("input", () => {
        lngSlider.value = lngInput.value;
        updateMapMarker(parseFloat(latInput.value), parseFloat(lngInput.value));
    });

    // Income
    bindSliderInput(incomeSlider, incomeInput, (val) => {
        const usd = Math.round(parseFloat(val || 0) * 10000);
        incomeUsdDisplay.textContent = `$${usd.toLocaleString()} / year`;
    });

    // Age
    bindSliderInput(ageSlider, ageInput, (val) => {
        ageValDisplay.textContent = `${Math.round(val || 0)} yrs`;
    });

    // Rooms
    bindSliderInput(roomsSlider, roomsInput, (val) => {
        roomsValDisplay.textContent = `${Math.round(val || 0)} rms`;
    });

    // Bedrooms
    bindSliderInput(bedroomsSlider, bedroomsInput, (val) => {
        bedroomsValDisplay.textContent = `${Math.round(val || 0)} beds`;
    });

    // Population
    bindSliderInput(popSlider, popInput, (val) => {
        popValDisplay.textContent = `${Math.round(val || 0)} people`;
    });

    // Households
    bindSliderInput(hhSlider, hhInput, (val) => {
        householdsValDisplay.textContent = `${Math.round(val || 0)} hh`;
    });

    // ----------------------------------------------------
    // 4. Ocean Proximity Selector
    // ----------------------------------------------------
    oceanPills.forEach((pill) => {
        const radio = pill.querySelector("input[type='radio']");
        pill.addEventListener("click", () => {
            oceanPills.forEach((p) => p.classList.remove("active"));
            pill.classList.add("active");
            radio.checked = true;
        });
    });

    function setOceanProximity(val) {
        oceanPills.forEach((pill) => {
            const radio = pill.querySelector("input[type='radio']");
            if (radio.value === val) {
                pill.classList.add("active");
                radio.checked = true;
            } else {
                pill.classList.remove("active");
            }
        });
    }

    // ----------------------------------------------------
    // 5. Presets Autofill
    // ----------------------------------------------------
    presetBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            presetBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const presetId = btn.getAttribute("data-preset-id");
            loadPreset(presetId);
        });
    });

    function loadPreset(presetId) {
        fetch("/api/presets")
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.presets) {
                    const selected = data.presets.find((p) => p.id === presetId);
                    if (selected) {
                        applyPresetData(selected.data);
                        performPrediction();
                    }
                }
            })
            .catch((err) => console.error("Error fetching presets:", err));
    }

    function applyPresetData(d) {
        syncCoordinates(d.latitude, d.longitude, true);
        map.setView([d.latitude, d.longitude], 8);

        incomeInput.value = d.median_income;
        incomeSlider.value = d.median_income;
        incomeUsdDisplay.textContent = `$${Math.round(d.median_income * 10000).toLocaleString()} / year`;

        ageInput.value = d.housing_median_age;
        ageSlider.value = d.housing_median_age;
        ageValDisplay.textContent = `${d.housing_median_age} yrs`;

        roomsInput.value = d.total_rooms;
        roomsSlider.value = d.total_rooms;
        roomsValDisplay.textContent = `${d.total_rooms} rms`;

        bedroomsInput.value = d.total_bedrooms;
        bedroomsSlider.value = d.total_bedrooms;
        bedroomsValDisplay.textContent = `${d.total_bedrooms} beds`;

        popInput.value = d.population;
        popSlider.value = d.population;
        popValDisplay.textContent = `${d.population} people`;

        hhInput.value = d.households;
        hhSlider.value = d.households;
        householdsValDisplay.textContent = `${d.households} hh`;

        setOceanProximity(d.ocean_proximity);
    }

    // ----------------------------------------------------
    // 6. Reset Form Defaults
    // ----------------------------------------------------
    resetFormBtn.addEventListener("click", () => {
        presetBtns.forEach((b) => b.classList.remove("active"));
        applyPresetData({
            latitude: 37.85,
            longitude: -122.25,
            housing_median_age: 41,
            total_rooms: 880,
            total_bedrooms: 129,
            population: 322,
            households: 126,
            median_income: 8.3252,
            ocean_proximity: "NEAR BAY",
        });
        performPrediction();
    });

    // ----------------------------------------------------
    // 7. Tab Switching
    // ----------------------------------------------------
    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            tabBtns.forEach((b) => b.classList.remove("active"));
            tabPanes.forEach((p) => p.classList.remove("active"));

            btn.classList.add("active");
            const activePane = document.getElementById(`tab-${targetTab}`);
            if (activePane) activePane.classList.add("active");
        });
    });

    // ----------------------------------------------------
    // 8. Animated Number Counter
    // ----------------------------------------------------
    function animateValue(obj, start, end, duration = 600) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentVal = Math.floor(easeProgress * (end - start) + start);
            obj.textContent = currentVal.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = Math.round(end).toLocaleString();
            }
        };
        window.requestAnimationFrame(step);
    }

    // ----------------------------------------------------
    // 9. Prediction Submission
    // ----------------------------------------------------
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        performPrediction();
    });

    function performPrediction() {
        const formData = {
            latitude: parseFloat(latInput.value),
            longitude: parseFloat(lngInput.value),
            housing_median_age: parseFloat(ageInput.value),
            total_rooms: parseFloat(roomsInput.value),
            total_bedrooms: parseFloat(bedroomsInput.value),
            population: parseFloat(popInput.value),
            households: parseFloat(hhInput.value),
            median_income: parseFloat(incomeInput.value),
            ocean_proximity: document.querySelector("input[name='ocean_proximity']:checked")?.value || "<1H OCEAN"
        };

        // Loading state on button
        const btnText = predictBtn.querySelector(".btn-text-content");
        const btnSpinner = predictBtn.querySelector(".btn-spinner");
        if (btnText && btnSpinner) {
            btnText.style.display = "none";
            btnSpinner.style.display = "inline-flex";
            predictBtn.disabled = true;
        }

        fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.prediction) {
                    const currentVal = parseFloat(predictedPriceElem.textContent.replace(/,/g, "")) || 0;
                    const newVal = data.prediction.median_house_value;

                    animateValue(predictedPriceElem, currentVal, newVal);

                    priceRangeDisplay.textContent = data.prediction.formatted_range;
                    confidenceBadge.innerHTML = `<i class="fa-solid fa-shield-check"></i> 70% Confidence (${data.prediction.confidence_mae})`;

                    // Update ratio badges
                    pricePerRoomVal.textContent = data.prediction.price_per_room;
                    roomsPerHhVal.textContent = data.derived_metrics.rooms_per_household;
                    bedRatioVal.textContent = `${(data.derived_metrics.bedrooms_per_room * 100).toFixed(1)}%`;
                    densityVal.textContent = `${data.derived_metrics.population_per_household}`;
                } else {
                    alert("Prediction error: " + (data.error || "Unknown error occurred."));
                }
            })
            .catch((err) => {
                console.error("Prediction request failed:", err);
                alert("Failed to connect to the prediction server.");
            })
            .finally(() => {
                if (btnText && btnSpinner) {
                    btnText.style.display = "inline-flex";
                    btnSpinner.style.display = "none";
                    predictBtn.disabled = false;
                }
            });
    }

    // Trigger initial prediction calculation on load
    performPrediction();
});
