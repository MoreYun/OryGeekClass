var newWindow = document.getElementById("newWindow");
var newWindowResult = document.getElementById("newWindowResult");
var draggable = false;
var resizable = false;
var posX, posY, mouseX, mouseY, width, height;
var sortedNumbers = []; // 保存排序结果
const { ipcRenderer } = require('electron');


// 获取打开 white.html 窗口的按钮元素
const openWhiteButton = document.querySelector('.button-white');

// 添加按钮点击事件监听器
openWhiteButton.addEventListener('click', () => {
    // 调用 openWhiteWindow 函数来触发 IPC 请求
    openWhiteWindow();
});

// 打开 white.html 窗口
function openWhiteWindow() {
    // 发送 IPC 请求到主进程
    ipcRenderer.send('open-white-window');
}

// 打开新窗口
function openNewWindow() {
    newWindow.style.display = "block";
    setTimeout(function () {
        // 延迟执行动画效果
        newWindow.classList.add("show");
    }, 100);
}

// 关闭新窗口
function closeNewWindow() {
    newWindow.classList.remove("show");

    // 等待动画结束后再隐藏窗口
    setTimeout(function () {
        newWindow.style.display = "none";
        newWindowResult.innerHTML = "";
    }, 300);
}

// 顺序排序
function sortAscending() {
    var numbers = document.getElementById("numbers").value;
    sortedNumbers = numbers.split("/").sort(function (a, b) {
        return a - b;
    });
    displayResults(sortedNumbers);
}

// 倒序排序
function sortDescending() {
    var numbers = document.getElementById("numbers").value;
    sortedNumbers = numbers.split("/").sort(function (a, b) {
        return b - a;
    });
    displayResults(sortedNumbers);
}

// 显示排序结果
function displayResults(sortedNumbers) {
    var html = "排序结果：<br>";
    for (var i = 0; i < sortedNumbers.length; i++) {
        html += sortedNumbers[i] + "<br>";
    }
    newWindowResult.innerHTML = html;
}

// 导出为Excel
function exportToExcel() {
    if (sortedNumbers.length > 0) {
        var csv = "";
        sortedNumbers.forEach(function (row) {
            csv += row + ",\n";
        });

        var link = document.createElement("a");
        link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
        link.download = "sorted_numbers.csv";
        link.click();
    }
}

// 关闭程序
function closeProgram() {
    window.close();
}

// 窗口移动事件
document.addEventListener("mouseup", function () {
    draggable = false;
});

document.addEventListener("mousemove", function (e) {
    if (draggable) {
        var dx = e.clientX - mouseX;
        var dy = e.clientY - mouseY;
        var newPosX = posX + dx;
        var newPosY = posY + dy;
        newWindow.style.left = newPosX + "px";
        newWindow.style.top = newPosY + "px";
    }
});

function startDrag(e) {
    e.preventDefault();
    draggable = true;
    posX = newWindow.offsetLeft;
    posY = newWindow.offsetTop;
    mouseX = e.clientX;
    mouseY = e.clientY;
}

// 窗口调整大小事件
document.addEventListener("mouseup", function () {
    resizable = false;
});

document.addEventListener("mousemove", function (e) {
    if (resizable) {
        var dx = e.clientX - mouseX;
        var dy = e.clientY - mouseY;
        var newWidth = width + dx;
        var newHeight = height + dy;
        newWindow.style.width = newWidth + "px";
        newWindow.style.height = newHeight + "px";
    }
});

function startResize(e) {
    resizable = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
    width = newWindow.offsetWidth;
    height = newWindow.offsetHeight;
}

// 最小化窗口
function minimizeWindow() {
    newWindow.style.display = "none";
}

// 切换主页
function changeTab(tabIndex) {
    var tabContents = document.getElementsByClassName("tab-content");
    var menuItems = document.getElementsByClassName("menu-item");

    for (var i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }

    for (var i = 0; i < menuItems.length; i++) {
        menuItems[i].classList.remove("active");
    }

    tabContents[tabIndex - 1].style.display = "block";
    menuItems[tabIndex - 1].classList.add("active");
}

