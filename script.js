// 获取画布和上下文
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const thicknessRange = document.getElementById('thicknessRange');
const eraserSizeRange = document.getElementById('eraserSizeRange');
const dropdownButtons = document.querySelectorAll('.tool-button');
const subMenus = document.querySelectorAll('.dropdown-content');
const colorButtons = document.getElementsByClassName('color');
const eraserButton = document.getElementById('eraserButton');
const clearCanvasButton = document.getElementById('clearCanvasButton');
const undoButton = document.getElementById('undo');
const redoButton = document.getElementById('redo');
const moveCanvasButton = document.getElementById('moveCanvasButton');
const toggleBackgroundButton = document.getElementById('toggleBackground');
const penButton = document.getElementById('penButton');
const penColorButtons = document.getElementsByClassName('penColor');
const penSubMenu = document.getElementById('penSubMenu');
penSubMenu.classList.add('close');


const initialCanvasWidth = 4096;
const initialCanvasHeight = 10240;

canvas.width = initialCanvasWidth;
canvas.height = initialCanvasHeight;

// 添加触摸事件监听
canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);

let currentColor = 'black';
let currentTool = 'pen';
let isDrawing = false;
let history = [];
let redoHistory = [];
let currentCoordinates = [];

let isCanvasMoving = false;
let startOffsetX = 0;
let startOffsetY = 0;
let offsetX = 0;
let offsetY = 0;
let canvasTranslateX = 0;
let canvasTranslateY = 0;
let minCanvasTranslateX = 0;
let minCanvasTranslateY = 0;
let maxCanvasTranslateX = 0;
let maxCanvasTranslateY = 0;

let isErasing = false;
let eraserSize = 10;

// 全局范围添加lineWidthHistory变量
let lineWidthHistory = [];

/* 注意这个地方专设计于electron，浏览器调试删去*/
const { ipcRenderer } = require('electron');

// 获取按钮元素

const eraserSubMenu = document.getElementById('eraserSubMenu');

// 默认情况下激活笔按钮
penButton.classList.add('button-active');

// 添加笔按钮的点击事件监听器
penButton.addEventListener('click', () => {
    // 激活笔按钮
    penButton.classList.add('button-active');
    
    // 移除橡皮擦按钮的活动状态
    eraserButton.classList.remove('button-active');
    
    // 在这里执行与笔工具相关的操作
});

// 添加橡皮擦按钮的点击事件监听器
eraserButton.addEventListener('click', () => {
    // 激活橡皮擦按钮
    eraserButton.classList.add('button-active');
    
    // 移除笔按钮的活动状态
    penButton.classList.remove('button-active');
    
    // 在这里执行与橡皮擦工具相关的操作
    
    // 在打开橡皮擦二级界面时，您可以在这里添加逻辑来显示橡皮擦界面
    eraserSubMenu.style.display = 'block';
});

// 添加关闭橡皮擦二级界面的逻辑
function closeEraserSubMenu() {
    // 隐藏橡皮擦二级界面
    eraserSubMenu.style.display = 'none';
    
    // 激活笔按钮（回到笔工具）
    penButton.classList.add('button-active');
    
    // 移除橡皮擦按钮的活动状态
    eraserButton.classList.remove('button-active');
    
    // 在这里可以添加其他关闭橡皮擦二级界面时的操作
}

// 在关闭橡皮擦二级界面的按钮或其他元素上添加点击事件监听器，并调用关闭橡皮擦二级界面的函数

document.getElementById('minimize-white-window').addEventListener('click', () => {
    ipcRenderer.send('minimize-white-window');
});

document.getElementById('closeWindow').addEventListener('click', () => {
    // 向主进程发送关闭窗口的请求
    ipcRenderer.send('close-window-request');
});

const menuButton = document.getElementById('menuButton');
const menuContainer = document.getElementById('menuContainer');

let isMenuOpen = false;

menuButton.addEventListener('click', toggleMenu);

function toggleMenu() {
    if (!isMenuOpen) {
        openMenu();
    } else {
        closeMenu();
    }
}

function openMenu() {
    isMenuOpen = true;
    menuContainer.style.display = 'block';
}

function closeMenu() {
    isMenuOpen = false;
    menuContainer.style.display = 'none';
}



// 关闭二级界面的事件监听器
document.addEventListener('click', (event) => {
    const target = event.target;
    const isDropdownButton = [...dropdownButtons].some((button) => button.contains(target));
    if (!isDropdownButton) {
        subMenus.forEach((menu) => {
            menu.style.display = 'none';
        });
    }
});

// 显示二级界面的按钮点击事件监听器
dropdownButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const dropdownContent = button.nextElementSibling;
        dropdownContent.style.display = 'block';
        event.stopPropagation();
    });
});

// 计算画布可移动范围
function calculateCanvasRange() {
    const boundingRect = canvas.getBoundingClientRect();
    const canvasRange = {
        minX: -boundingRect.width + initialCanvasWidth,
        minY: -boundingRect.height + initialCanvasHeight,
        maxX: boundingRect.width,
        maxY: boundingRect.height,
    };
    return canvasRange;
}

// 监听绘图事件
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// 监听颜色按钮点击事件
for (let i = 0; i < colorButtons.length; i++) {
    colorButtons[i].addEventListener('click', changeColor);
}

// 监听橡皮擦按钮点击事件
eraserButton.addEventListener('click', useEraser);

// 监听清除画布按钮点击事件
clearCanvasButton.addEventListener('click', clearCanvas);

// 监听撤销按钮点击事件
undoButton.addEventListener('click', undo);

// 监听重做按钮点击事件
redoButton.addEventListener('click', redo);



// 监听切换背景颜色按钮点击事件
toggleBackgroundButton.addEventListener('click', toggleBackgroundColor);

// 监听橡皮擦大小滑块值改变事件
eraserSizeRange.addEventListener('input', updateEraserSize);

let isDrawingEnabled = false;

// 开始移动画布
function startMovingCanvas() {
    if (currentTool !== 'move') {
        currentTool = 'move';
        canvas.style.cursor = 'grabbing';
        document.addEventListener('mousedown', startMovingMouse);
        isDrawingEnabled = false; // 禁用绘制
    }
}
// 右键点击事件处理程序，防止右键菜单弹出
function preventContextMenu(e) {
    e.preventDefault();
}
// 开始移动鼠标
function startMovingMouse(e) {
    if (currentTool === 'move') {
        document.addEventListener('mousemove', moveCanvas);
        document.addEventListener('mouseup', stopMovingMouse);
    }
}

// 停止移动鼠标
function stopMovingMouse(e) {
    document.removeEventListener('mousemove', moveCanvas);
    document.removeEventListener('mouseup', stopMovingMouse);
    if (e.target === canvas) {
        stopMovingCanvas();
    }
}
// 鼠标右键点击事件处理程序，启用移动画布
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // 阻止右键菜单弹出
    startMovingCanvas();
});

// 获取触摸位置
function getTouchPos(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.touches[0].clientX - rect.left,
        y: evt.touches[0].clientY - rect.top
    };
}


  
let isTwoFingerTouch = false;
let isDraggingCanvas = false; // 添加一个标志来控制画布拖动

canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        // 双指触摸开始
        isTwoFingerTouch = true;
        isDraggingCanvas = true; // 启用画布拖动，禁用绘制
        isDrawing = false; // 禁用绘制
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialTouch1X = touch1.clientX;
        initialTouch1Y = touch1.clientY;
        initialTouch2X = touch2.clientX;
        initialTouch2Y = touch2.clientY;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (isTwoFingerTouch && isDraggingCanvas) {
        // 双指触摸移动且正在拖动画布
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentTouch1X = touch1.clientX;
        const currentTouch1Y = touch1.clientY;
        const currentTouch2X = touch2.clientX;
        const currentTouch2Y = touch2.clientY;

        // 计算两个触摸点的移动距离
        const deltaX1 = currentTouch1X - initialTouch1X;
        const deltaY1 = currentTouch1Y - initialTouch1Y;
        const deltaX2 = currentTouch2X - initialTouch2X;
        const deltaY2 = currentTouch2Y - initialTouch2Y;

        // 计算平均的移动距离
        const averageDeltaX = (deltaX1 + deltaX2) / 2;
        const averageDeltaY = (deltaY1 + deltaY2) / 2;

        // 更新画布的平移位置
        canvasTranslateX += averageDeltaX;
        canvasTranslateY += averageDeltaY;

        // 应用移动效果
        canvas.style.transform = `translate(${canvasTranslateX}px, ${canvasTranslateY}px)`;

        // 更新初始触摸点位置
        initialTouch1X = currentTouch1X;
        initialTouch1Y = currentTouch1Y;
        initialTouch2X = currentTouch2X;
        initialTouch2Y = currentTouch2Y;

    
    } else if (isDrawing) {
        // 如果处于绘制状态，则调用绘制函数
        draw(e);
    }

    
});


canvas.addEventListener('touchend', () => {
    // 双指触摸结束
    isTwoFingerTouch = false;
    isDraggingCanvas = false; // 停止拖动画布，允许绘制
});

// 移动画布
function moveCanvas(e) {
    const deltaX = e.movementX;
    const deltaY = e.movementY;
    canvasTranslateX += deltaX;
    canvasTranslateY += deltaY;
    canvas.style.transform = `translate(${canvasTranslateX}px, ${canvasTranslateY}px)`;
}

// 停止移动画布
function stopMovingCanvas() {
    currentTool = 'pen';
    canvas.style.cursor = 'crosshair';
    document.removeEventListener('mousedown', startMovingMouse);
}

// 获取鼠标偏移量
function getOffset(e) {
    const { clientX, clientY } = e;
    const { left, top } = canvas.getBoundingClientRect();
    const offsetX = clientX - left;
    const offsetY = clientY - top;
    return { offsetX, offsetY };
}

// 更新线条粗细
function updateLineWidth() {
    ctx.lineWidth = thicknessRange.value;
}

// 更改绘图颜色
function changeColor(e) {
    currentColor = e.target.style.backgroundColor;
}

eraserSizeRange.addEventListener('input', updateEraserSize);

let currentEraserSize = eraserSize; 

function updateEraserSize() {
    currentEraserSize = eraserSizeRange.value; // 更新橡皮擦大小
    if (currentTool === 'eraser') {
        // 修改橡皮擦的鼠标样式为一个灰白色半透明的圆形指示器
        canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${currentEraserSize}" height="${currentEraserSize}" viewBox="0 0 ${currentEraserSize} ${currentEraserSize}"><circle cx="${currentEraserSize / 2}" cy="${currentEraserSize / 2}" r="${currentEraserSize / 2}" fill="rgba(200, 200, 200, 0.7)" stroke="none"/></svg>') ${currentEraserSize / 2} ${currentEraserSize / 2}, auto`;
    }
}

// 更新橡皮擦指示器的位置
function updateEraserIndicator(x, y) {
    const eraserIndicator = document.getElementById('eraserIndicator');
    eraserIndicator.style.left = `${x}px`;
    eraserIndicator.style.top = `${y}px`;
}


// 使用橡皮擦
function useEraser() {
    if (currentTool === 'eraser') {
        currentTool = 'pen';
        eraserButton.classList.remove('active');
        canvas.style.cursor = 'crosshair';
        document.getElementById('eraserSubMenu').style.display = 'none';
        isErasing = false; // 设置为false，切换回画笔时不再擦除
    } else {
        currentTool = 'eraser';
        eraserButton.classList.add('active');
        document.getElementById('eraserSubMenu').style.display = 'block';
        updateEraserSize(); // 更新橡皮擦大小
        isErasing = true; // 设置为true，切换到橡皮擦时开始擦除
    }
    isDrawing = false;
}


/*重新绘制步骤
function redrawStep(step) {
    const { x, y, color, type, thickness } = step;

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'line') {
        ctx.beginPath();
        ctx.moveTo(x[0], y[0]);
        for (let i = 1; i < x.length; i++) {
            ctx.lineTo(x[i], y[i]);
        }
        ctx.stroke();
    } else if (type === 'eraser') {
        const radius = thickness / 2;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        for (let i = 0; i < x.length; i++) {
            ctx.arc(x[i], y[i], radius, 0, 2 * Math.PI);
        }
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }
}
*/
// 清除画布
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    redoHistory = [];
    drawingData = []; // 清空绘制步骤数据数组
}

// 切换背景颜色
function toggleBackgroundColor() {
    if (canvas.style.backgroundColor === 'black') {
        canvas.style.backgroundColor = 'white';
    } else {
        canvas.style.backgroundColor = 'black';
    }
}

// 修改笔颜色按钮点击事件
for (let i = 0; i < penColorButtons.length; i++) {
    penColorButtons[i].addEventListener('click', changePenColor);
}

// 笔按钮点击事件
penButton.addEventListener('click', togglePenMenu);

let isPenSelected = false;
let isPenMenuOpen = false;

// 切换笔颜色
function changePenColor(e) {
    currentColor = e.target.style.backgroundColor;
    updateLineWidth(); // 更新笔的粗细

    // 更新绘图上下文的线条颜色
    ctx.strokeStyle = currentColor;
}


// 切换笔二级菜单
function togglePenMenu() {
    if (!isPenSelected) {
        isPenSelected = true;
        openPenMenu();
    } else {
        if (!isPenMenuOpen) {
            openPenMenu();
        } else {
            closePenMenu();
        }
    }
}

// 打开笔二级菜单
function openPenMenu() {
    isPenMenuOpen = true;
    penSubMenu.classList.add('open');
}

// 关闭笔二级菜单
function closePenMenu() {
    isPenMenuOpen = false;
    penSubMenu.classList.remove('open');
}


// 全局范围添加绘制步骤数据数组
let drawingData = [];

// 计算鼠标移动速度
function calculateSpeed(currentX, currentY, previousX, previousY, deltaTime) {
    if (previousX === null || previousY === null || previousTime === null) {
        return 0;
    }
    const distance = Math.sqrt((currentX - previousX) ** 2 + (currentY - previousY) ** 2);
    const speed = distance / deltaTime;
    return speed;
}
// 计算线条粗细
function calculateLineWidth(speed) {
    const minSpeed = 0;
    const maxSpeed = 10;
    const minWidth = 1;
    const maxWidth = 5;
    const normalizedSpeed = Math.max(Math.min(speed, maxSpeed), minSpeed);
    const normalizedLineWidth = ((normalizedSpeed - minSpeed) / (maxSpeed - minSpeed)) * (maxWidth - minWidth) + minWidth;
    const currentLineWidth = Math.round(normalizedLineWidth);
    return currentLineWidth;
}

// 计算线条透明度
function calculateLineOpacity(speed) {
    const minSpeed = 0;
    const maxSpeed = 10;
    const minOpacity = 0.1;
    const maxOpacity = 1;
    const normalizedSpeed = Math.max(Math.min(speed, maxSpeed), minSpeed);
    const normalizedOpacity = ((normalizedSpeed - minSpeed) / (maxSpeed - minSpeed)) * (maxOpacity - minOpacity) + minOpacity;
    const currentOpacity = Math.round(normalizedOpacity * 10) / 10;
    return currentOpacity;
}

// 绘制
function draw(e,evt) {
    if ((isDrawingEnabled || isErasing) && !isDraggingCanvas) { // 允许绘制或擦除
        let offsetX, offsetY;

        if (e.type === 'mousemove' || e.type === 'mousedown') {
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        } else if (e.type === 'touchmove' || e.type === 'touchstart') {
            e.preventDefault();
            const touch = e.touches[0];
            offsetX = touch.clientX - canvas.getBoundingClientRect().left;
            offsetY = touch.clientY - canvas.getBoundingClientRect().top;
        }

        // 获取线条粗细值
        const lineWidth = parseFloat(thicknessRange.value);

        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentTool === 'pen') {
            // 绘制画笔
            ctx.strokeStyle = `rgba(${currentColor}, 1)`;
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();

            // 保存绘制步骤
            const step = {
                x: offsetX,
                y: offsetY,
                thickness: lineWidth,
                color: ctx.strokeStyle,
                type: 'line',
            };
            currentCoordinates.push(step);
        } else if (currentTool === 'eraser') {
            
            // 使用橡皮擦时清除对应的像素
            const radius = currentEraserSize / 2; // 使用新的橡皮擦大小
            ctx.globalCompositeOperation = 'destination-out';

            
            // 绘制一个圆形来清除像素
            ctx.beginPath();
            ctx.arc(offsetX, offsetY, radius, 0, 2 * Math.PI);
            ctx.fill();

            // 恢复合成操作为默认
            ctx.globalCompositeOperation = 'source-over';

            // 保存绘制步骤
            const step = {
                x: offsetX,
                y: offsetY,
                thickness: currentEraserSize, // 使用新的橡皮擦大小
                color: canvas.style.backgroundColor,
                type: 'eraser',
            };
            currentCoordinates.push(step);
        }
    }
}



// 添加事件监听器以在值变化时更新线条粗细
thicknessRange.addEventListener('input', () => {
    // 获取新的线条粗细值并应用
    const newLineWidth = parseFloat(thicknessRange.value);
    ctx.lineWidth = newLineWidth;
});

// 监听鼠标和触摸事件
canvas.addEventListener('mousedown', (e) => {
    isDrawingEnabled = true;
    draw(e);
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawingEnabled) {
        draw(e);
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawingEnabled = false;
});

canvas.addEventListener('touchstart', (e) => {
    isDrawingEnabled = true;
    draw(e);
});

canvas.addEventListener('touchmove', (e) => {
    if (isDrawingEnabled) {
        draw(e);
    }
});

canvas.addEventListener('touchend', () => {
    isDrawingEnabled = false;
});


// 停止绘制
function stopDrawing() {
    isDrawing = false;
    isErasing = false;
    if (currentCoordinates.length > 0) {
        // 将绘制步骤数据保存到历史记录数组（进行深拷贝）
        history.push(currentCoordinates);

        // 清空当前绘制步骤数据数组
        currentCoordinates = [];

        // 清空重做历史记录数组
        redoHistory = [];
    }
}



// 修改undo函数
function undo() {
    if (history.length > 0) {
        const undoneSteps = history.pop();
        redoHistory.push(undoneSteps);
        redrawHistory(); // 重新绘制历史记录
    }
}

// 修改redo函数
function redo() {
    if (redoHistory.length > 0) {
        const redoneSteps = redoHistory.pop();
        history.push(redoneSteps);
        redrawHistory(); // 重新绘制历史记录
    }
}


// 重新绘制历史记录中的所有步骤
function redrawHistory() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const steps of history) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const { x, y, color, thickness, type } = step;

            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (type === 'line') {
                if (i === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            } else if (type === 'eraser') {
                const radius = thickness / 2;
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';
            }
        }
    }
}

const MAX_HISTORY_LENGTH = 10; // 设置历史记录的上限长度

// 开始绘制
function startDrawing(e) {
    if (!isCanvasMoving && currentTool === 'pen') {
        isDrawing = true;
        const { offsetX, offsetY } = getOffset(e);
        previousX = offsetX;
        previousY = offsetY;
        previousTime = performance.now();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);

        // 清空重做历史记录
        redoHistory = [];
    } else if (currentTool === 'eraser') {
        isErasing = true;
        draw(e);
    }
}


const canvasList = []; // 用于存储画布的数组
const canvasHistoryList = [];


function saveCanvas() {
    if (currentCanvasIndex !== -1) {
        ctx.canvas.willReadFrequently = true; // 设置属性为true

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvasList[currentCanvasIndex] = imageData;

        // 如果历史记录长度超过上限，删除最早的历史记录
        if (history.length > MAX_HISTORY_LENGTH) {
            history.shift();
        }

        ctx.canvas.willReadFrequently = false; // 恢复属性为false
    }
}


// 将canvasList数组中指定索引的画布内容绘制到当前画布上
function drawCurrentCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const imageData = canvasList[currentCanvasIndex];
    ctx.putImageData(imageData, 0, 0);
}

// 修改switchToPreviousCanvas函数
function switchToPreviousCanvas() {
    if (currentCanvasIndex > 0 || canvasList.length <= 1) {
        saveCanvas();
        canvasHistoryList[currentCanvasIndex] = { history, redoHistory };
        currentCanvasIndex--;
        if (currentCanvasIndex < 0) {
            currentCanvasIndex = canvasList.length - 1; // 切换到最后一个画布
        }
        drawCurrentCanvas();
        if (canvasHistoryList[currentCanvasIndex]) {
            history = canvasHistoryList[currentCanvasIndex].history;
            redoHistory = canvasHistoryList[currentCanvasIndex].redoHistory;
        } else {
            history = [];
            redoHistory = [];
        }
    }
}

// 修改switchToNextCanvas函数
function switchToNextCanvas() {
    if (currentCanvasIndex < canvasList.length - 1) {
        saveCanvas();
        canvasHistoryList[currentCanvasIndex] = { history, redoHistory };
        currentCanvasIndex++;
        drawCurrentCanvas();
        if (canvasHistoryList[currentCanvasIndex]) {
            history = canvasHistoryList[currentCanvasIndex].history;
            redoHistory = canvasHistoryList[currentCanvasIndex].redoHistory;
        } else {
            history = [];
            redoHistory = [];
        }
    } else {
        saveCanvas();
        canvasHistoryList[currentCanvasIndex] = { history, redoHistory };
        const newCanvas = ctx.createImageData(canvas.width, canvas.height);
        canvasList.push(newCanvas);
        currentCanvasIndex = canvasList.length - 1;
        drawCurrentCanvas();
        history = [];
        redoHistory = [];
    }
}


// 绑定向左按钮点击事件
const leftButton = document.getElementById("leftButton");
leftButton.addEventListener("click", switchToPreviousCanvas);

// 绑定向右按钮点击事件
const rightButton = document.getElementById("rightButton");
rightButton.addEventListener("click", switchToNextCanvas);

// 创建默认画布，并将其添加到canvasList数组中
const defaultImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
canvasList.push(defaultImageData);
currentCanvasIndex = 0;
drawCurrentCanvas();




// 初始化
function initialize() {
    canvasTranslateX = 0;
    canvasTranslateY = 0;
    minCanvasTranslateX = -canvas.width + initialCanvasWidth;
    minCanvasTranslateY = -canvas.height + initialCanvasHeight;
    maxCanvasTranslateX = 0;
    maxCanvasTranslateY = 0;
    canvas.style.transform = `translate(${canvasTranslateX}px, ${canvasTranslateY}px)`;
}

// 初始化画布
initialize();
