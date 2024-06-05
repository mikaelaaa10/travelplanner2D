const weatherForm = document.querySelector(".weatherForm");
const cityInput = document.querySelector(".cityInput");
const card = document.querySelector(".card");
const apiKey = "0ea5fed713a4fcb113af98dac3e011c8";
let ws; 

function connectWebSocket() {
    ws = new WebSocket('ws://localhost:3000'); 

    ws.onopen = function () {
        console.log('Connected to WebSocket server.');  
    };

    ws.onerror = function (error) {
        console.error('WebSocket error:', error);
    };

    ws.onclose = function () {
        console.log('WebSocket connection closed. Reconnecting...');
        setTimeout(connectWebSocket, 1000);
    };

    ws.onmessage = function (event) {
        try {
            const parsedMessage = JSON.parse(event.data);
            if (parsedMessage.source === 'pexels') {
                displayImages(JSON.parse(parsedMessage.data));
            } else if (parsedMessage.source === 'weather') {
                displayWeatherInfo(JSON.parse(parsedMessage.data));
            } else {
                console.log(`Received message from client: ${parsedMessage}`);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    };
}

connectWebSocket();

function sendTestMessage() {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send('Test message from client');
    } else {
        console.error('WebSocket is not open. ReadyState: ' + ws.readyState);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let hidePlanTrip = false; 

    const links = {
        'home-link': 'home-section',
        'search-link': 'search-section',
        'plan-trip-link': 'plan-trip-section',
        'help-desk-link': 'help-desk-section'
    };

    for (const [linkId, sectionId] of Object.entries(links)) {
        document.getElementById(linkId).addEventListener('click', function(event) {
            event.preventDefault();
            showSection(sectionId);
        });
    }

    function showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        if (sectionId === 'plan-trip-section') {
            document.getElementById('receipt-section').classList.add('active');
            if (hidePlanTrip) {
                document.getElementById('plan-trip-section').classList.remove('active');
            }
        }
    }

    const budgetInput = document.getElementById('budget');
    const budgetValue = document.getElementById('budget-value');

    budgetInput.addEventListener('input', function() {
        budgetValue.textContent = `₱${budgetInput.value}`;
    });

    const tripForm = document.getElementById('trip-form');
    tripForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(tripForm);
        const tripData = {
            destination: formData.get('destination'),
            departureDate: formData.get('departure-date'),
            returnDate: formData.get('return-date'),
            budget: formData.get('budget'),
            numTravelers: formData.get('num-travelers'),
            accommodation: formData.get('accommodation'),
            departureTime: formData.get('departure-time'),
        };

        displayReceipt(tripData);
    });

    function displayReceipt(data) {
        const receipt = ` 
            <h2>Your Trip Details</h2>
            <p>Destination: ${data.destination}</p>
            <p>Departure Date: ${data.departureDate}</p>
            <p>Return Date: ${data.returnDate}</p>
            <p>Budget: ₱${data.budget}</p>
            <p>Number of Travelers: ${data.numTravelers}</p>
            <p>Accommodation: ${data.accommodation}</p>
            <p>Departure Time: ${data.departureTime}</p>
            <p>--------------------------------------------------------------</p>
            <p>Thank you for planning your trip with us!</p>

            <button id="edit-button">Edit</button>
            <button id="suggest-button">Check Weather</button>
        `;
        document.getElementById('receipt').innerHTML = receipt;
        document.getElementById('receipt-section').classList.add('active');
        document.getElementById('plan-trip-section').classList.remove('active');
        hidePlanTrip = true;
    }

    document.getElementById('receipt-section').addEventListener('click', function(event) {
        const editButton = event.target.closest('#edit-button');
        const suggestButton = event.target.closest('#suggest-button');

        if (editButton) {
            document.getElementById('receipt-section').classList.remove('active');
            document.getElementById('plan-trip-section').classList.add('active');
            hidePlanTrip = false;
        } else if (suggestButton) {
         showSection('check-weather-section');
        }
    });

    async function searchImages(query) {
        const apiKey = '03ommpMyMFF7QnUYim8fL3isJ3dPqbgYc0cWZfrFQywUuYLNC2DTgzft'; 
        const apiUrl = `https://api.pexels.com/v1/search?query=${query}`;
    
        const response = await fetch(apiUrl, {
            headers: {
                Authorization: apiKey
            }
        });
    
        if (!response.ok) {
            throw new Error('Could not fetch image data');
        }
    
        const data = await response.json();
        return data.photos;
    }
    
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', async function(event) {
        event.preventDefault();
    
        const query = document.getElementById('search-input').value.trim();
        if (query) {
            try {
                const images = await searchImages(query);
                displayImages(images);
                sendMessageToWebSocket(JSON.stringify(images));
            } catch (error) {
                console.error(error);
                displayError(error.message);
            }
        } else {
            displayError('Please enter a search query');
        }
    });
    
    function displayImages(images) {
        const card = document.querySelector('.card_place');
        card.innerHTML = ''; 
        card.style.display = 'flex';
    
        if (images.length === 0) {
            displayError('No images found');
            return;
        }
    
        images.forEach(image => {
            const img = document.createElement('img');
            img.src = image.src.medium; 
            img.alt = image.alt;
            card.appendChild(img);
        });
    }
    
    function displayError(message) {
        const card = document.querySelector('.card');
        card.innerHTML = ''; 
        card.style.display = 'flex';
    
        const errorDisplay = document.createElement('p');
        errorDisplay.textContent = message;
        errorDisplay.classList.add('errorDisplay');
        card.appendChild(errorDisplay);
    }    
    
    function sendMessageToWebSocket(message) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            console.error('WebSocket is not open. ReadyState: ' + ws.readyState);
        }
    }

weatherForm.addEventListener("submit", async event => {
    event.preventDefault();

    const city = cityInput.value;

    if (city) {
        try {
            const weatherData = await getWeatherData(city);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(weatherData)); 
            } else {
                console.error('WebSocket is not open. ReadyState: ' + ws.readyState);
            }
            displayWeatherInfo(weatherData);
        } catch (error) {
            console.error(error);
            displayError(error);
        }
    } else {
        displayError("Please enter a destination");
    }
});

async function getWeatherData(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},PH&appid=${apiKey}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
        throw new Error("Could not fetch weather data");
    }

    return await response.json();
}


function displayWeatherInfo(data) {
    const { name: city,
        main: { temp, humidity },
        weather: [{ description }] } = data;

    card.textContent = "";
    card.style.display = "flex";

    const cityDisplay = document.createElement("h1");
    const tempDisplay = document.createElement("p");
    const humidityDisplay = document.createElement("p");
    const descDisplay = document.createElement("p");

    cityDisplay.textContent = city;
    tempDisplay.textContent = `${(temp - 273.15).toFixed(1)}°C`;
    humidityDisplay.textContent = `Humidity: ${humidity}%`;
    descDisplay.textContent = description;

    cityDisplay.classList.add("cityDisplay");
    tempDisplay.classList.add("tempDisplay");
    humidityDisplay.classList.add("humidityDisplay");
    descDisplay.classList.add("descDisplay");

    card.appendChild(cityDisplay);
    card.appendChild(tempDisplay);
    card.appendChild(humidityDisplay);
    card.appendChild(descDisplay);
}

function displayError(message) {
    const errorDisplay = document.createElement("p");
    errorDisplay.textContent = message;
    errorDisplay.classList.add("errorDisplay");

    card.textContent = "";
    card.style.display = "flex";
    card.appendChild(errorDisplay);
}

    let slideIndex = 0;
    showSlides();

    function showSlides() {
        let slides1 = document.querySelectorAll('.slides_1 img');
        let slides2 = document.querySelectorAll('.slides_2 img');
        let slides3 = document.querySelectorAll('.slides_3 img');

        for (let i = 0; i < slides1.length; i++) {
            slides1[i].style.display = "none";  
        }
        for (let i = 0; i < slides2.length; i++) {
            slides2[i].style.display = "none";  
        }
        for (let i = 0; i < slides3.length; i++) {
            slides3[i].style.display = "none";  
        }

        slideIndex++;
        if (slideIndex > slides1.length) { slideIndex = 1; }    

        slides1[slideIndex-1].style.display = "block";  
        slides2[slideIndex-1].style.display = "block";  
        slides3[slideIndex-1].style.display = "block";  
        setTimeout(showSlides, 2000); 
    }
});

const details = document.querySelectorAll('details');
details.forEach(detail => {
    detail.addEventListener('click', () => {
        details.forEach(otherDetail => {
            if (otherDetail !== detail) {
                otherDetail.removeAttribute('open');
            }
        });
    });
});

const carousels = document.querySelectorAll(".carousel"),
    arrowIcons = document.querySelectorAll(".row i"); 

let isDragStart = false, isDragging = false, prevPageX, prevScrollLeft, positionDiff;

const showHideIcons = (carousel, icons) => {
    let scrollWidth = carousel.scrollWidth - carousel.clientWidth;
    icons[0].style.display = carousel.scrollLeft == 0 ? "none" : "block";
    icons[1].style.display = carousel.scrollLeft == scrollWidth ? "none" : "block";
}

arrowIcons.forEach((icon, i) => {
    icon.addEventListener("click", () => {
        const row = icon.parentElement;
        const carousel = row.querySelector(".carousel");
        const icons = row.querySelectorAll("i");
        let firstImgWidth = carousel.querySelector("img").clientWidth + 14;
        carousel.scrollLeft += icon.id.includes("left") ? -firstImgWidth : firstImgWidth;
        setTimeout(() => showHideIcons(carousel, icons), 60);
    });
});

const autoSlide = (carousel, firstImgWidth) => {
    if (carousel.scrollLeft - (carousel.scrollWidth - carousel.clientWidth) > -1 || carousel.scrollLeft <= 0) return;
    positionDiff = Math.abs(positionDiff);
    let valDifference = firstImgWidth - positionDiff;
    if (carousel.scrollLeft > prevScrollLeft) {
        return carousel.scrollLeft += positionDiff > firstImgWidth / 3 ? valDifference : -positionDiff;
    }
    carousel.scrollLeft -= positionDiff > firstImgWidth / 3 ? valDifference : -positionDiff;
}

const dragStart = (e, carousel) => {
    isDragStart = true;
    prevPageX = e.pageX || e.touches[0].pageX;
    prevScrollLeft = carousel.scrollLeft;
}

const dragging = (e, carousel) => {
    if (!isDragStart) return;
    e.preventDefault();
    isDragging = true;
    carousel.classList.add("dragging");
    positionDiff = (e.pageX || e.touches[0].pageX) - prevPageX;
    carousel.scrollLeft = prevScrollLeft - positionDiff;
    const icons = carousel.parentElement.querySelectorAll("i");
    showHideIcons(carousel, icons);
}

const dragStop = (carousel, firstImgWidth) => {
    isDragStart = false;
    carousel.classList.remove("dragging");
    if (!isDragging) return;
    isDragging = false;
    autoSlide(carousel, firstImgWidth);
}

carousels.forEach(carousel => {
    const firstImg = carousel.querySelectorAll("img")[0];
    let firstImgWidth = firstImg.clientWidth + 14;
    carousel.addEventListener("mousedown", (e) => dragStart(e, carousel));
    carousel.addEventListener("touchstart", (e) => dragStart(e, carousel));
    document.addEventListener("mousemove", (e) => dragging(e, carousel));
    carousel.addEventListener("touchmove", (e) => dragging(e, carousel));
    document.addEventListener("mouseup", () => dragStop(carousel, firstImgWidth));
    carousel.addEventListener("touchend", () => dragStop(carousel, firstImgWidth));
});

