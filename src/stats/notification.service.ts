import { Injectable } from '@angular/core';
import { PriceChange, StockChange } from '/stats.types';

declare var toastr: any;

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private initialized = false;
    private maxNotifications = 5;
    private notificationQueue: Array<() => void> = [];
    private notificationCount = 0;
    private notificationCooldown = false;
    private cooldownTime = 2000; // ms

    constructor() {
        this.initToastr();
    }

    /**
     * Инициализация Toastr
     */
    private initToastr() {
        if (typeof toastr !== 'undefined') {
            toastr.options = {
                closeButton: true,
                progressBar: true,
                positionClass: 'toast-bottom-right',
                timeOut: 5000,
                extendedTimeOut: 2000,
                preventDuplicates: true,
                newestOnTop: true,
                showDuration: 300,
                hideDuration: 500
            };
            this.initialized = true;
        } else {
            console.warn('Toastr не найден. Уведомления будут отключены.');
        }
    }

    /**
     * Показать уведомление об изменении цены
     */
    showPriceChangeNotification(priceChange: PriceChange): void {
        if (!this.initialized) return;

        this.queueNotification(() => {
            const formattedOldPrice = `${priceChange.oldPrice} ₽`;
            const formattedNewPrice = `${priceChange.newPrice} ₽`;

            const notificationType = priceChange.changeAmount > 0 ? 'warning' : 'info';
            const changeDirection = priceChange.changeAmount > 0 ? 'повысилась' : 'снизилась';

            toastr[notificationType](
                `Цена товара "${priceChange.productName}" ${changeDirection} с ${formattedOldPrice} до ${formattedNewPrice} (${priceChange.changePercent.toFixed(1)}%)`,
                'Обновление цены'
            );
        });
    }

    /**
     * Показать уведомление об изменении остатков
     */
    showStockChangeNotification(stockChange: StockChange): void {
        if (!this.initialized) return;

        this.queueNotification(() => {
            const formattedOldAmount = `${stockChange.oldAmount} шт.`;
            const formattedNewAmount = `${stockChange.newAmount} шт.`;

            const notificationType = stockChange.changeAmount > 0 ? 'success' : 'warning';
            const changeDirection = stockChange.changeAmount > 0 ? 'увеличилось' : 'уменьшилось';

            toastr[notificationType](
                `Количество товара "${stockChange.productName}" на складе "${stockChange.warehouseName}" ${changeDirection} с ${formattedOldAmount} до ${formattedNewAmount} (${Math.abs(stockChange.changePercent).toFixed(1)}%)`,
                'Обновление остатков'
            );
        });
    }

    /**
     * Показать информационное уведомление
     */
    showInfo(message: string, title: string = 'Информация'): void {
        if (!this.initialized) return;
        this.queueNotification(() => toastr.info(message, title));
    }

    /**
     * Показать уведомление об успехе
     */
    showSuccess(message: string, title: string = 'Успех'): void {
        if (!this.initialized) return;
        this.queueNotification(() => toastr.success(message, title));
    }

    /**
     * Показать предупреждение
     */
    showWarning(message: string, title: string = 'Внимание'): void {
        if (!this.initialized) return;
        this.queueNotification(() => toastr.warning(message, title));
    }

    /**
     * Показать уведомление об ошибке
     */
    showError(message: string, title: string = 'Ошибка'): void {
        if (!this.initialized) return;
        toastr.error(message, title); // Ошибки всегда показываем без очереди
    }

    /**
     * Закрыть все уведомления
     */
    clearAll(): void {
        if (!this.initialized) return;
        toastr.clear();
        this.notificationQueue = [];
        this.notificationCount = 0;
    }

    /**
     * Установить максимальное количество одновременных уведомлений
     */
    setMaxNotifications(count: number): void {
        this.maxNotifications = count;
    }

    /**
     * Добавить уведомление в очередь
     */
    private queueNotification(notificationFn: () => void): void {
        // Если достигли лимита и нет кулдауна, включаем его и показываем сообщение о пропуске
        if (this.notificationCount >= this.maxNotifications && !this.notificationCooldown) {
            this.notificationCooldown = true;

            // Счетчик пропущенных уведомлений
            let skipped = 0;

            // Отложенный обработчик очереди
            setTimeout(() => {
                // Если в очереди есть уведомления, показываем общее сообщение о пропущенных
                if (this.notificationQueue.length > 0) {
                    toastr.info(`Пропущено ${this.notificationQueue.length} уведомлений из-за высокой частоты`, 'Много обновлений');
                    this.notificationQueue = []; // Очищаем очередь
                }

                this.notificationCooldown = false;
                this.notificationCount = 0;
            }, this.cooldownTime);

            // Добавляем уведомление в очередь
            this.notificationQueue.push(notificationFn);
            return;
        }

        // Если нет кулдауна и не достигли лимита, показываем уведомление
        if (!this.notificationCooldown && this.notificationCount < this.maxNotifications) {
            this.notificationCount++;
            notificationFn();

            // Уменьшаем счетчик через timeout
            setTimeout(() => {
                this.notificationCount--;
            }, 1000);
        } else {
            // Иначе добавляем в очередь
            this.notificationQueue.push(notificationFn);
        }
    }
}