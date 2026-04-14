// Mengatur tampilan input Z berdasarkan dimensi
function toggleDimension() {
    const dim = document.getElementById('dimension').value;
    const zInputs = document.querySelectorAll('.z-input');
    zInputs.forEach(el => el.style.display = dim === '3d' ? 'block' : 'none');
    document.getElementById('canvas-hint').innerText = dim === '3d' ? "Scroll: Zoom | Drag: Rotasi 3D" : "Scroll: Zoom";
    
    if (dim === '2d') { yaw = 0; pitch = 0; } 
    else { yaw = Math.PI / 4; pitch = Math.PI / 6; }
}

const canvas = document.getElementById('vectorCanvas');
const ctx = canvas.getContext('2d');
const historyContainer = document.getElementById('history-container');

// Variabel Navigasi Kanvas
let scale = 25; 
let yaw = 0;   
let pitch = 0; 
let isDragging = false;
let lastX, lastY;

// Event Listeners untuk interaksi Mouse (Zoom & Rotasi)
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    scale += e.deltaY > 0 ? -2 : 2;
    if(scale < 5) scale = 5;    
    if(scale > 100) scale = 100;  
    calculateAndDraw();
});

function zoomCanvas(amount) {
    scale += amount;
    if(scale < 5) scale = 5;
    if(scale > 100) scale = 100;
    calculateAndDraw();
}

canvas.addEventListener('mousedown', (e) => {
    if (document.getElementById('dimension').value === '3d') {
        isDragging = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && document.getElementById('dimension').value === '3d') {
        let dx = e.offsetX - lastX;
        let dy = e.offsetY - lastY;
        yaw += dx * 0.01;
        pitch -= dy * 0.01;
        lastX = e.offsetX;
        lastY = e.offsetY;
        calculateAndDraw();
    }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Fungsi Proyeksi Koordinat (Dari 3D ke layar 2D)
function project(x, y, z) {
    const is3D = document.getElementById('dimension').value === '3d';
    if (!is3D) {
        return { x: canvas.width / 2 + x * scale, y: canvas.height / 2 - y * scale };
    }
    
    let y1 = y * Math.cos(pitch) - z * Math.sin(pitch);
    let z1 = y * Math.sin(pitch) + z * Math.cos(pitch);
    let x2 = x * Math.cos(yaw) + z1 * Math.sin(yaw);
    let z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
    
    return {
        x: canvas.width / 2 + x2 * scale,
        y: canvas.height / 2 - y1 * scale
    };
}

function drawLine3D(x1, y1, z1, x2, y2, z2, color, lineWidth, isDashed = false) {
    const p1 = project(x1, y1, z1);
    const p2 = project(x2, y2, z2);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    if (isDashed) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawText3D(text, x, y, z, color) {
    const p = project(x, y, z);
    ctx.fillStyle = color;
    ctx.font = '10px Inter';
    ctx.fillText(text, p.x + 5, p.y + 5);
}

// Fungsi menggambar Grid & Sumbu X, Y, Z
function drawAxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const is3D = document.getElementById('dimension').value === '3d';

    drawLine3D(-20, 0, 0, 20, 0, 0, '#662222', 2); 
    drawLine3D(0, -20, 0, 0, 20, 0, '#226622', 2); 
    if (is3D) drawLine3D(0, 0, -20, 0, 0, 20, '#222266', 2); 

    for(let i = -15; i <= 15; i++) {
        if(i === 0) continue;
        drawLine3D(i, -0.2, 0, i, 0.2, 0, '#666', 1);
        drawText3D(i, i, -0.5, 0, '#888');
        
        drawLine3D(-0.2, i, 0, 0.2, i, 0, '#666', 1);
        drawText3D(i, 0.5, i, 0, '#888');
        
        if (is3D) {
            drawLine3D(0, -0.2, i, 0, 0.2, i, '#666', 1);
            drawText3D(i, 0, -0.5, i, '#888');
        }
    }
}

// Fungsi Eksekusi Perhitungan & Gambar Vektor
function calculateAndDraw() {
    const dim = document.getElementById('dimension').value;
    const ax = parseFloat(document.getElementById('ax').value) || 0;
    const ay = parseFloat(document.getElementById('ay').value) || 0;
    const bx = parseFloat(document.getElementById('bx').value) || 0;
    const by = parseFloat(document.getElementById('by').value) || 0;
    
    let az = 0, bz = 0, dotProduct = 0, historyText = "";

    if (dim === '3d') {
        az = parseFloat(document.getElementById('az').value) || 0;
        bz = parseFloat(document.getElementById('bz').value) || 0;
        dotProduct = (ax * bx) + (ay * by) + (az * bz);
        historyText = `[3D] Vektor A(${ax}, ${ay}, ${az}) · Vektor B(${bx}, ${by}, ${bz}) = ${dotProduct}`;
    } else {
        dotProduct = (ax * bx) + (ay * by);
        historyText = `[2D] Vektor A(${ax}, ${ay}) · Vektor B(${bx}, ${by}) = ${dotProduct}`;
    }

    document.getElementById('result-text').innerText = dotProduct;

    const emptyMsg = document.getElementById('empty-history');
    if(emptyMsg) emptyMsg.remove();
    
    const lastHistoryEntry = historyContainer.lastElementChild?.innerText;
    if (lastHistoryEntry !== historyText) {
        const p = document.createElement('p');
        p.innerText = historyText;
        historyContainer.insertBefore(p, historyContainer.firstChild); 
    }

    drawAxes();

    drawLine3D(ax, ay, az, ax, ay, 0, '#ff6b6b', 1, true); 
    drawLine3D(ax, ay, 0, ax, 0, 0, '#ff6b6b', 1, true);   
    drawLine3D(ax, ay, 0, 0, ay, 0, '#ff6b6b', 1, true);   
    if(dim === '3d') drawLine3D(ax, ay, az, 0, 0, az, '#ff6b6b', 1, true); 

    drawLine3D(bx, by, bz, bx, by, 0, '#4facf7', 1, true);
    drawLine3D(bx, by, 0, bx, 0, 0, '#4facf7', 1, true);
    drawLine3D(bx, by, 0, 0, by, 0, '#4facf7', 1, true);
    if(dim === '3d') drawLine3D(bx, by, bz, 0, 0, bz, '#4facf7', 1, true);

    drawLine3D(0, 0, 0, ax, ay, az, '#ff4d4d', 3); 
    drawLine3D(0, 0, 0, bx, by, bz, '#3399ff', 3); 
}

// Memulai program saat pertama dibuka
toggleDimension();
calculateAndDraw();