let socket;
let chart;
let series;
let chartData = {};  // Store candlestick data for each coin and interval
let selectedCoin = 'ethusdt';  // Default coin
let selectedInterval = '1m';   // Default interval

// Map human-readable symbols to Binance WebSocket symbols
const symbolMap = {
    'ethusdt': 'ethusdt',
    'bnbusdt': 'bnbusdt',  // Correct symbol for BNB/USDT
    'dotusdt': 'dotusdt'
};

// Function to connect to Binance WebSocket for real-time data
function connectWebSocket(symbol, interval) {
    if (socket) socket.close();  // Close any existing WebSocket connection

    const endpoint = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    console.log('Connecting to WebSocket:', endpoint);  // Debugging WebSocket connection
    socket = new WebSocket(endpoint);

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.k && data.k.x) {  // Only handle completed candlestick data
            const candlestick = {
                time: data.k.t / 1000,  // Convert timestamp to seconds
                open: parseFloat(data.k.o),
                high: parseFloat(data.k.h),
                low: parseFloat(data.k.l),
                close: parseFloat(data.k.c),
            };

            // Store the data in memory and localStorage
            if (!chartData[symbol]) chartData[symbol] = {};
            if (!chartData[symbol][interval]) chartData[symbol][interval] = [];

            chartData[symbol][interval].push(candlestick);
            saveToLocalStorage(symbol, interval, chartData[symbol][interval]);

            updateChart(candlestick);  // Update the chart with new data
        }
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed.");
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}

// Function to initialize the chart
function createChart() {
    const chartElement = document.getElementById('chartContainer');
    chart = LightweightCharts.createChart(chartElement, {
        width: chartElement.clientWidth,
        height: chartElement.clientHeight,
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
        },
    });

    series = chart.addCandlestickSeries();
}

// Function to clear the chart when switching coins or intervals
function clearChart() {
    series.setData([]);  // Clear the chart data
}

// Function to update the chart with a new candlestick
function updateChart(candle) {
    series.update(candle);  // Update chart in real-time
}

// Function to load the chart with saved data
function loadChart(data) {
    clearChart();
    series.setData(data);
}

// Save data to localStorage
function saveToLocalStorage(symbol, interval, data) {
    const key = `${symbol}_${interval}`;
    localStorage.setItem(key, JSON.stringify(data));
}

// Load data from localStorage
function loadFromLocalStorage(symbol, interval) {
    const key = `${symbol}_${interval}`;
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : [];
}

// Handle cryptocurrency selection change
function changeCoin() {
    selectedCoin = document.getElementById('cryptoSelect').value;

    const symbol = symbolMap[selectedCoin.toLowerCase()];

    const savedData = loadFromLocalStorage(symbol, selectedInterval);
    if (savedData.length > 0) {
        loadChart(savedData);
    } else {
        clearChart();  // Clear the chart and fetch new data
        connectWebSocket(symbol, selectedInterval);
    }
}

// Handle interval selection change
function changeInterval() {
    selectedInterval = document.getElementById('intervalSelect').value;

    const symbol = symbolMap[selectedCoin.toLowerCase()];

    const savedData = loadFromLocalStorage(symbol, selectedInterval);
    if (savedData.length > 0) {
        loadChart(savedData);
    } else {
        clearChart();  // Clear the chart and fetch new data
        connectWebSocket(symbol, selectedInterval);
    }
}

// Handle chart resizing
function handleResize() {
    chart.resize(
        document.getElementById('chartContainer').clientWidth,
        document.getElementById('chartContainer').clientHeight
    );
}

// Initialize the chart and WebSocket on page load
window.onload = function () {
    createChart();  // Create the chart when the page loads

    const symbol = symbolMap[selectedCoin];

    const savedData = loadFromLocalStorage(symbol, selectedInterval);
    if (savedData.length > 0) {
        loadChart(savedData);
    } else {
        connectWebSocket(symbol, selectedInterval);  // Connect WebSocket if no data is saved
    }

    window.addEventListener('resize', handleResize);
};
