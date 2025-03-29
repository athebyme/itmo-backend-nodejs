
document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();

    setupSettingsListeners();

    setupTestNotification();
});

function initializeSettings() {
    const notifyPrice = document.getElementById('notify-price');
    const notifyStock = document.getElementById('notify-stock');
    const notifySound = document.getElementById('notify-sound');

    notifyPrice.checked = localStorage.getItem('notifyPrice') !== 'false';
    notifyStock.checked = localStorage.getItem('notifyStock') !== 'false';
    notifySound.checked = localStorage.getItem('notifySound') === 'true';

    toastr.options = {
        closeButton: true,
        newestOnTop: true,
        progressBar: true,
        positionClass: "toast-top-right",
        preventDuplicates: false,
        showDuration: "300",
        hideDuration: "1000",
        timeOut: "7000",
        extendedTimeOut: "1000",
        showEasing: "swing",
        hideEasing: "linear",
        showMethod: "fadeIn",
        hideMethod: "fadeOut"
    };

    if (notifySound.checked) {
        toastr.options.onShown = function() {
            playNotificationSound();
        };
    } else {
        toastr.options.onShown = null;
    }
}

function setupSettingsListeners() {
    const notifyPrice = document.getElementById('notify-price');
    const notifyStock = document.getElementById('notify-stock');
    const notifySound = document.getElementById('notify-sound');

    notifyPrice.addEventListener('change', function() {
        localStorage.setItem('notifyPrice', this.checked);
    });

    notifyStock.addEventListener('change', function() {
        localStorage.setItem('notifyStock', this.checked);
    });

    notifySound.addEventListener('change', function() {
        localStorage.setItem('notifySound', this.checked);

        if (this.checked) {
            toastr.options.onShown = function() {
                playNotificationSound();
            };
        } else {
            toastr.options.onShown = null;
        }
    });
}

function setupTestNotification() {
    const testButton = document.getElementById('test-notification');
    if (!testButton) return;

    testButton.addEventListener('click', function() {
        const notifyPrice = document.getElementById('notify-price').checked;
        const notifyStock = document.getElementById('notify-stock').checked;

        if (notifyPrice) {
            const priceChange = {
                productName: 'Тестовый товар',
                vendorCode: 'TEST-123',
                oldPrice: 2000,
                newPrice: 2500,
                changeAmount: 500,
                changePercent: 25
            };

            toastr.warning(
                `${priceChange.productName}<br>
                 ${priceChange.oldPrice} ₽ → ${priceChange.newPrice} ₽<br>
                 Артикул: ${priceChange.vendorCode}`,
                `⬆️ Цена повысилась на ${priceChange.changePercent}%`
            );
        }

        if (notifyStock) {
            setTimeout(() => {
                const stockChange = {
                    productName: 'Тестовый товар',
                    vendorCode: 'TEST-123',
                    warehouseName: 'Склад SPB',
                    oldAmount: 50,
                    newAmount: 30,
                    changeAmount: -20,
                    changePercent: -40
                };

                toastr.warning(
                    `${stockChange.productName}<br>
                     ${stockChange.oldAmount} шт. → ${stockChange.newAmount} шт.<br>
                     Склад: ${stockChange.warehouseName}<br>
                     Артикул: ${stockChange.vendorCode}`,
                    `⚠️ Уменьшение остатков ${stockChange.changePercent}%`
                );
            }, 1000);
        }
    });
}

function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.error('Failed to play notification sound', e);
    }
}