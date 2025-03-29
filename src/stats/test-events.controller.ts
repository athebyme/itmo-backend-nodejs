import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { TestEventsService } from './test-events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/test-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class TestEventsController {
    private stopRandomEventsFunction: (() => void) | null = null;

    constructor(private readonly testEventsService: TestEventsService) {}

    @Get('price-change')
    sendTestPriceChange() {
        const priceChange = this.testEventsService.sendTestPriceChange();
        return {
            success: true,
            message: 'Test price change event sent',
            data: priceChange
        };
    }

    @Get('stock-change')
    sendTestStockChange() {
        const stockChange = this.testEventsService.sendTestStockChange();
        return {
            success: true,
            message: 'Test stock change event sent',
            data: stockChange
        };
    }

    @Post('start-random')
    startRandomEvents(@Body() body: { interval?: number }) {
        // Stop any existing interval
        if (this.stopRandomEventsFunction) {
            this.stopRandomEventsFunction();
        }

        // Start a new interval
        const interval = body.interval || 10000; // Default to 10 seconds
        this.stopRandomEventsFunction = this.testEventsService.startRandomEvents(interval);

        return {
            success: true,
            message: `Started sending random events every ${interval}ms`,
            interval
        };
    }

    @Post('stop-random')
    stopRandomEvents() {
        if (this.stopRandomEventsFunction) {
            this.stopRandomEventsFunction();
            this.stopRandomEventsFunction = null;
            return {
                success: true,
                message: 'Stopped sending random events'
            };
        } else {
            return {
                success: false,
                message: 'No random events were running'
            };
        }
    }
}